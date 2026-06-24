import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fetchSubtitlesText } from "../utils/index.ts";
import { type OpenAPIHono } from "@hono/zod-openapi";
import { type IncomingMessage, type ServerResponse } from "node:http";
import { mcpLogger } from "./logger.ts";

interface NodeServerEnv {
  incoming?: IncomingMessage;
  outgoing?: ServerResponse;
}

export function createMCPServer() {
  const server = new Server(
    { name: "subdowns", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "get_youtube_subtitles",
          description: "Fetch full raw subtitles for any YouTube video. The `vid_id` is the 11-character video ID from the URL (e.g. `dQw4w9WgXcQ` from `v=dQw4w9WgXcQ`).",
          inputSchema: {
            type: "object",
            properties: {
              vid_id: { type: "string", description: "The 11-character YouTube video ID." },
              lang: { type: "string", description: "The language to download (e.g. 'English', 'Spanish'). Defaults to 'English'." }
            },
            required: ["vid_id"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "get_youtube_subtitles") {
      if (!args || typeof args !== 'object') {
        return { isError: true, content: [{ type: "text", text: "Error: Invalid arguments." }] };
      }

      const vid_id = args.vid_id as string;
      const lang = (args.lang as string) || "English";

      if (!/^[0-9A-Za-z_-]{11}$/.test(vid_id)) {
        return { isError: true, content: [{ type: "text", text: "Error: Invalid video ID format." }] };
      }

      try {
        const content = await fetchSubtitlesText(vid_id, lang);
        return {
          content: [{ type: "text", text: content }],
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        return { isError: true, content: [{ type: "text", text: `Error fetching subtitles: ${message}` }] };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  return server;
}

const activeConnections = new Map<string, {
  server: Server;
  transport: SSEServerTransport;
  res: ServerResponse;
}>();

let pruneInterval: ReturnType<typeof setInterval> | null = null;

function ensurePruneTimer() {
  if (pruneInterval) return;
  pruneInterval = setInterval(() => {
    for (const [sessionId, connection] of activeConnections.entries()) {
      const res = connection.res;
      if (res.writableEnded || res.finished || res.socket?.destroyed) {
        mcpLogger.info("Pruning dead session {sessionId}", { sessionId });
        activeConnections.delete(sessionId);
        connection.server.close().catch(() => { });
      }
    }
    if (activeConnections.size === 0 && pruneInterval) {
      clearInterval(pruneInterval);
      pruneInterval = null;
    }
  }, 30000);
}

export function initMCPServerRoutes(router: OpenAPIHono) {
  router.get('/mcp/sse', async (c) => {
    const env = c.env as NodeServerEnv;
    const nodeReq = env?.incoming;
    const nodeRes = env?.outgoing;

    if (!nodeReq || !nodeRes) {
      return c.text('Not running under Node.js server environment', 500);
    }

    const host = c.req.header('host') || '127.0.0.1:3069';
    const protocol = c.req.header('x-forwarded-proto') || 'http';
    const messageUrl = `${protocol}://${host}/api/mcp/message`;

    const server = createMCPServer();
    const transport = new SSEServerTransport(messageUrl, nodeRes);
    const sessionId = transport.sessionId;

    // Bridge: Monkey-patches writeHead and end to prevent MCP's SSEServerTransport from conflicting with Hono's response lifecycle (avoiding double-writes and premature stream closure).
    const originalWriteHead = nodeRes.writeHead;
    nodeRes.writeHead = (function (this: ServerResponse, ...args: unknown[]) {
      if (!nodeRes.headersSent) {
        return (originalWriteHead.apply(this, args as unknown as Parameters<ServerResponse['writeHead']>) as unknown as ServerResponse);
      }
      return this;
    } as unknown as typeof nodeRes.writeHead);

    const originalEnd = nodeRes.end;
    nodeRes.end = (function (this: ServerResponse, ...args: unknown[]) {
      if (activeConnections.has(sessionId)) {
        return this;
      }
      return (originalEnd.apply(this, args as unknown as Parameters<ServerResponse['end']>) as unknown as ServerResponse);
    } as unknown as typeof nodeRes.end);

    activeConnections.set(sessionId, { server, transport, res: nodeRes });
    ensurePruneTimer();
    mcpLogger.info("SSE connection established. Session: {sessionId}, Message URL: {messageUrl}", { sessionId, messageUrl });

    nodeReq.on('close', async () => {
      mcpLogger.info("SSE connection closed for session {sessionId}", { sessionId });
      activeConnections.delete(sessionId);
      try {
        await server.close();
      } catch { /* connection already closed */ }
      (originalEnd as () => void).call(nodeRes);
    });

    await server.connect(transport);
    c.header('x-hono-already-sent', 'true');
    return c.body(null);
  });

  router.post('/mcp/message', async (c) => {
    const env = c.env as NodeServerEnv;
    const nodeReq = env?.incoming;
    const nodeRes = env?.outgoing;

    if (!nodeReq || !nodeRes) {
      return c.text('Not running under Node.js server environment', 500);
    }

    const sessionId = c.req.query('sessionId');
    if (sessionId) {
      const connection = activeConnections.get(sessionId);
      if (connection) {
        try {
          await connection.transport.handlePostMessage(nodeReq, nodeRes);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          mcpLogger.error("Error handling POST message for session {sessionId}: {message}", { sessionId, message });
        }
        c.header('x-hono-already-sent', 'true');
        return c.body(null);
      }
    }

    mcpLogger.warn("Rejected POST message: Session not found or SSE transport not established.");
    return c.text('SSE connection not established', 400);
  });
}
