import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import http from "node:http";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fetchMetadata } from "../utils/index.ts";
import { getSubtitles } from "youtube-caption-extractor";
import { YouTubeCaptionTrack, SubtitleItem } from "../interfaces/YouTube.ts";

function createMCPServer() {
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

      try {
        const playerResponse = await fetchMetadata(vid_id);
        if (!playerResponse) {
          return { isError: true, content: [{ type: "text", text: "Error: Video metadata not found or unavailable." }] };
        }

        const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
        if (tracks.length === 0) {
          return { isError: true, content: [{ type: "text", text: "Error: No subtitles available for this video." }] };
        }

        const matchingTracks = tracks.filter((t: YouTubeCaptionTrack) => t.name.simpleText.toLowerCase().includes(lang.toLowerCase()));

        let selectedTrack;
        if (matchingTracks.length > 0) {
          selectedTrack = matchingTracks[0];
        } else {
          selectedTrack = tracks.find((t: YouTubeCaptionTrack) => t.name.simpleText.toLowerCase().includes('english')) || tracks[0];
        }

        const subtitles = await getSubtitles({ videoID: vid_id, lang: selectedTrack.languageCode });
        const content = subtitles.map((s: SubtitleItem) => s.text).join('\n');

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

let isMCPRunning = false;

export async function initMCPServer() {
  if (isMCPRunning) return;
  isMCPRunning = true;

  const port = 9000;
  let activeServer: Server | null = null;
  let transport: SSEServerTransport | null = null;

  const httpServer = http.createServer(async (req, res) => {
    console.log(`[MCP Server] Incoming request: ${req.method} ${req.url}`);

    // Enable CORS for remote connections
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === "GET" && req.url === "/sse") {
      if (activeServer) {
        try { await activeServer.close(); } catch (e) { }
      }

      activeServer = createMCPServer();

      const host = req.headers.host || "127.0.0.1:9000";
      const protocol = (req.socket as import('node:tls').TLSSocket).encrypted ? "https" : "http";
      const messageUrl = `${protocol}://${host}/message`;

      transport = new SSEServerTransport(messageUrl, res);
      console.log(`[MCP Server] SSE connection established. Message URL: ${messageUrl}`);
      await activeServer.connect(transport);
    } else if (req.url?.startsWith("/message") && req.method === "POST") {
      console.log(`[MCP Server] Received POST message on ${req.url}`);
      if (transport) {
        try {
          await transport.handlePostMessage(req, res);
          console.log(`[MCP Server] Handled POST message successfully.`);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error(`[MCP Server] Error handling POST message:`, message);
        }
      } else {
        console.log(`[MCP Server] Rejected POST message: SSE transport not established.`);
        res.writeHead(400);
        res.end("SSE connection not established");
      }
    } else {
      console.log(`[MCP Server] 404 Not Found for ${req.method} ${req.url}`);
      res.writeHead(404);
      res.end("Not found");
    }
  });

  httpServer.on('error', (e: NodeJS.ErrnoException) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`MCP Server port ${port} already in use (HMR reload).`);
    } else {
      console.error('MCP Server Error:', e);
    }
  });

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`🚀 MCP Remote Server running on http://0.0.0.0:${port}/sse`);
  });
}
