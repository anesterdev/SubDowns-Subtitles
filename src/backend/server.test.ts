import { describe, it, expect } from 'vitest';
import app from './server.ts';

describe('Server Global Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK status', async () => {
      const res = await app.request('/api/health');
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(body).toEqual({ status: 'ok' });
    });
  });
});
