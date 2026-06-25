import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMCPServer } from './mcp.ts';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import * as utils from '../utils/index.ts';
import { AddressInfo } from 'node:net';
import { serve, ServerType } from '@hono/node-server';
import app from './server.ts';

vi.mock('./config.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./config.ts')>();
  return {
    config: {
      ...actual.config,
      RATE_LIMIT_MAX: 2,
      RATE_LIMIT_WINDOW_MS: 10000,
      TRUST_PROXY: true,
    }
  };
});

// Mock the utilities and subtitle extraction
vi.mock('../utils/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/index.ts')>();
  return {
    ...actual,
    fetchSubtitlesText: vi.fn(),
  };
});


describe('MCP Server Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists registered tools successfully via InMemoryTransport', async () => {
    const server = createMCPServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    const client = new Client({ name: "test-client", version: "1.0.0" }, {});
    await client.connect(clientTransport);

    const result = await client.listTools();
    expect(result.tools).toBeDefined();
    expect(result.tools.length).toBe(1);
    expect(result.tools[0].name).toBe('get_youtube_subtitles');

    await client.close();
    await server.close();
  });

  it('calls get_youtube_subtitles tool and retrieves formatted subtitles', async () => {
    const server = createMCPServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    const client = new Client({ name: "test-client", version: "1.0.0" }, {});
    await client.connect(clientTransport);

    vi.mocked(utils.fetchSubtitlesText).mockResolvedValue('Hello World');

    const result = await client.callTool({
      name: 'get_youtube_subtitles',
      arguments: {
        vid_id: 'dQw4w9WgXcQ',
        lang: 'English'
      }
    });

    const content = result.content as Array<{ type: string; text: string }>;
    expect(content).toBeDefined();
    expect(content[0].type).toBe('text');
    expect(content[0].text).toBe('Hello World');

    await client.close();
    await server.close();
  });
});

describe('MCP Server HTTP Layer & Rate Limiting', () => {
  let serverInstance: ServerType | undefined;
  let serverPort: number;

  beforeEach(() => {
  });

  afterEach(async () => {
    if (serverInstance) {
      if ('closeAllConnections' in serverInstance) {
        (serverInstance as import('node:http').Server).closeAllConnections();
      }
      await new Promise<void>((resolve) => serverInstance!.close(() => resolve()));
    }
  });

  it('enforces rate limits on HTTP SSE connection requests', async () => {
    await new Promise<void>((resolve) => {
      serverInstance = serve({
        fetch: app.fetch,
        port: 0,
        hostname: '127.0.0.1'
      }, () => resolve());
    });

    const address = serverInstance?.address();
    serverPort = (address as AddressInfo).port;

    // Send 3 requests (limit is 2)
    const makeRequest = async () => {
      const res = await fetch(`http://127.0.0.1:${serverPort}/api/mcp/sse`, {
        headers: { 'x-forwarded-for': '1.1.1.1' }
      });
      return res;
    };

    const res1 = await makeRequest();
    await res1.body?.cancel();
    const res2 = await makeRequest();
    await res2.body?.cancel();
    const res3 = await makeRequest();

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(429); // Exceeded the limit of 2 requests

    const body = await res3.json();
    expect(body).toEqual({ error: 'Too many requests, please try again later.' });
  });

  it('supports full MCP SSE connection and message POST lifecycle', async () => {
    await new Promise<void>((resolve) => {
      serverInstance = serve({
        fetch: app.fetch,
        port: 0,
        hostname: '127.0.0.1'
      }, () => resolve());
    });

    const address = serverInstance?.address();
    serverPort = (address as AddressInfo).port;

    // 1. Connect to SSE
    const sseResponse = await fetch(`http://127.0.0.1:${serverPort}/api/mcp/sse`, {
      headers: { 'x-forwarded-for': '2.2.2.2' }
    });
    expect(sseResponse.status).toBe(200);
    expect(sseResponse.headers.get('content-type')).toContain('text/event-stream');

    const reader = sseResponse.body!.getReader();
    
    // Read the first chunk (which contains the message endpoint setup)
    const chunk1 = await reader.read();
    const text1 = new TextDecoder().decode(chunk1.value);
    
    expect(text1).toContain('event: endpoint');
    
    const sessionMatch = text1.match(/sessionId=([a-zA-Z0-9-]+)/);
    expect(sessionMatch).not.toBeNull();
    const sessionId = sessionMatch![1];
    
    // 2. Send JSON-RPC listTools request via POST
    const postResponse = await fetch(`http://127.0.0.1:${serverPort}/api/mcp/message?sessionId=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '2.2.2.2',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      }),
    });
    
    expect(postResponse.status).toBe(202);

    // 3. Read the JSON-RPC response from the SSE stream
    const chunk2 = await reader.read();
    const text2 = new TextDecoder().decode(chunk2.value);
    
    expect(text2).toContain('event: message');
    expect(text2).toContain('get_youtube_subtitles');
    
    // Close stream
    await reader.cancel();
  });
});
