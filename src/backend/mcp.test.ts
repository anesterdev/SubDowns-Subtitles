import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMCPServer, initMCPServer } from './mcp.ts';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { config } from './config.ts';
import * as utils from '../utils/index.ts';
import { getSubtitles } from 'youtube-caption-extractor';
import http from 'node:http';

vi.mock('./config.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./config.ts')>();
  return {
    config: {
      ...actual.config,
      MCP_PORT: 0,
      RATE_LIMIT_MAX: 2,
      RATE_LIMIT_WINDOW_MS: 10000,
    }
  };
});

// Mock the utilities and subtitle extraction
vi.mock('../utils/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/index.ts')>();
  return {
    ...actual,
    fetchMetadata: vi.fn(),
  };
});

vi.mock('youtube-caption-extractor', () => ({
  getSubtitles: vi.fn(),
}));

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

    const mockPlayerResponse = {
      videoDetails: { title: 'Test Video' },
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            { baseUrl: 'https://base.url', name: { simpleText: 'English' }, languageCode: 'en', vssId: '.en', isTranslatable: true }
          ]
        }
      }
    };
    const mockSubtitles = [{ start: '1.0', dur: '1.0', text: 'Hello World' }];

    vi.mocked(utils.fetchMetadata).mockResolvedValue(mockPlayerResponse as any);
    vi.mocked(getSubtitles).mockResolvedValue(mockSubtitles);

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
  let serverInstance: http.Server | undefined;
  let serverPort: number;

  beforeEach(() => {
    // Reset double-boot flag so initMCPServer does not return immediately
    globalThis.__mcp_server_running__ = undefined;
  });

  afterEach(async () => {
    if (serverInstance) {
      serverInstance.closeAllConnections();
      await new Promise<void>((resolve) => serverInstance!.close(() => resolve()));
    }
  });

  it('enforces rate limits on HTTP SSE connection requests', async () => {
    serverInstance = await initMCPServer();
    if (serverInstance) {
      await new Promise<void>((resolve) => {
        if (serverInstance!.listening) {
          resolve();
        } else {
          serverInstance!.once('listening', () => resolve());
        }
      });
    }
    const address = serverInstance?.address();
    serverPort = (address as any).port;

    // Send 3 requests (limit is 2)
    const makeRequest = async () => {
      const res = await fetch(`http://127.0.0.1:${serverPort}/sse`);
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
});
