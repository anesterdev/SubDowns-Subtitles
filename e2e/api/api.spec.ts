import { test, expect } from '@playwright/test';

const STABLE_VIDEO_ID = 'dQw4w9WgXcQ';

test.describe('/api/health', () => {
  test('returns ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});

test.describe('/api/v0/video-preview', () => {
  test('returns metadata for a valid video', async ({ request }) => {
    const res = await request.get(`/api/v0/video-preview?vid_id=${STABLE_VIDEO_ID}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.video).toBeDefined();
    expect(body.video.video_id).toBe(STABLE_VIDEO_ID);
    expect(body.video.title).toBeTruthy();
    expect(body.video.thumbnail_url).toMatch(/^https?:\/\//);
    expect(body.author).toBeDefined();
    expect(body.author.channel_name).toBeTruthy();
    expect(body.subtitles).toBeDefined();
    expect(Array.isArray(body.subtitles.available_languages)).toBe(true);
    expect(body.subtitles.available_languages.length).toBeGreaterThan(0);
    expect(body.subtitles.count).toBe(body.subtitles.available_languages.length);
  });

  test('returns 404 for a nonexistent video', async ({ request }) => {
    const res = await request.get('/api/v0/video-preview?vid_id=invalid0000');
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('video_not_found');
  });

  test('returns 400 for an invalid video ID format', async ({ request }) => {
    const res = await request.get('/api/v0/video-preview?vid_id=tooShort');
    expect(res.status()).toBe(400);
  });
});

test.describe('/api/v0/download', () => {
  test('downloads SRT subtitles with correct content-type and disposition', async ({ request }) => {
    const res = await request.get(
      `/api/v0/download?vid_id=${STABLE_VIDEO_ID}&lang=English&format=srt&type=manual`
    );
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');

    const disposition = res.headers()['content-disposition'] || '';
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('.srt');

    const text = await res.text();
    expect(text).toMatch(/^\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/m);
  });

  test('downloads TXT subtitles as plain text', async ({ request }) => {
    const res = await request.get(
      `/api/v0/download?vid_id=${STABLE_VIDEO_ID}&lang=English&format=txt&type=manual`
    );
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');

    const text = await res.text();
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/^\d+\n\d{2}:\d{2}:\d{2}/);
  });

  test('downloads RAW subtitles as JSON', async ({ request }) => {
    const res = await request.get(
      `/api/v0/download?vid_id=${STABLE_VIDEO_ID}&lang=English&format=raw&type=manual`
    );
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('start');
    expect(body[0]).toHaveProperty('dur');
    expect(body[0]).toHaveProperty('text');
  });

  test('returns 404 for a language that does not exist', async ({ request }) => {
    const res = await request.get(
      `/api/v0/download?vid_id=${STABLE_VIDEO_ID}&lang=Klingon&format=srt&type=manual`
    );
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('language_not_found');
  });

  test('returns 400 for an invalid video ID format', async ({ request }) => {
    const res = await request.get(
      '/api/v0/download?vid_id=bad&lang=English&format=srt&type=manual'
    );
    expect(res.status()).toBe(400);
  });
});

test.describe('/api/v0/download/raw', () => {
  test('returns plain text raw subtitles', async ({ request }) => {
    const res = await request.get(
      `/api/v0/download/raw?vid_id=${STABLE_VIDEO_ID}&lang=English`
    );
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');

    const text = await res.text();
    expect(text.length).toBeGreaterThan(0);
  });

  test('returns 400 for a missing video ID', async ({ request }) => {
    const res = await request.get('/api/v0/download/raw');
    expect(res.status()).toBe(400);
  });
});

test.describe('OpenAPI spec', () => {
  test('serves openapi.json with documented paths', async ({ request }) => {
    const res = await request.get('/api/openapi.json');
    expect(res.status()).toBe(200);

    const spec = await res.json();
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.paths).toHaveProperty('/api/v0/video-preview');
    expect(spec.paths).toHaveProperty('/api/v0/download');
    expect(spec.paths).toHaveProperty('/api/v0/download/raw');
    expect(spec.paths).toHaveProperty('/api/health');
  });
});
