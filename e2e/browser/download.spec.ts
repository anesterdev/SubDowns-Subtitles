import { test, expect } from '@playwright/test';

const STABLE_VIDEO_ID = 'dQw4w9WgXcQ';
const STABLE_URL = `https://www.youtube.com/watch?v=${STABLE_VIDEO_ID}`;

test.describe('Download flow', () => {
  test('paste URL → preview renders → SRT downloads with correct filename', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('input[aria-label="YouTube Video Link"]');
    await input.fill(STABLE_URL);

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });

    await page.locator('.download-btn').click();

    await page.waitForURL(`**/preview?vid_id=${STABLE_VIDEO_ID}`, { timeout: 15_000 });

    await expect(page.locator('.video-preview-island')).toBeVisible({ timeout: 15_000 });

    await expect(page.locator('.subtitles-list-container').first()).toBeVisible({ timeout: 15_000 });

    const srtButton = page.locator('.subtitles-list-container').first().locator('button', { hasText: 'SRT' }).first();
    await srtButton.click();

    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toContain(STABLE_VIDEO_ID);
    expect(filename).toMatch(/\.srt$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const content = Buffer.concat(chunks).toString('utf-8');
    expect(content).toMatch(/^\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/m);
  });

  test('paste URL → preview renders → TXT downloads as plain text', async ({ page }) => {
    await page.goto('/');

    await page.locator('input[aria-label="YouTube Video Link"]').fill(STABLE_URL);
    await page.locator('.download-btn').click();

    await page.waitForURL(`**/preview?vid_id=${STABLE_VIDEO_ID}`, { timeout: 15_000 });
    await expect(page.locator('.subtitles-list-container').first()).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.locator('.subtitles-list-container').first().locator('button', { hasText: 'TXT' }).first().click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.txt$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const content = Buffer.concat(chunks).toString('utf-8');
    expect(content.length).toBeGreaterThan(0);
    expect(content).not.toMatch(/^\d+\n\d{2}:\d{2}:\d{2}/);
  });
});

test.describe('History flow', () => {
  test('downloaded subtitle appears in history', async ({ page }) => {
    await page.goto('/history');
    await expect(page.locator('.empty-state, .video-card')).toBeVisible({ timeout: 10_000 });

    await page.goto('/');
    await page.locator('input[aria-label="YouTube Video Link"]').fill(STABLE_URL);
    await page.locator('.download-btn').click();

    await page.waitForURL(`**/preview?vid_id=${STABLE_VIDEO_ID}`, { timeout: 15_000 });
    await expect(page.locator('.subtitles-list-container').first()).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.locator('.subtitles-list-container').first().locator('button', { hasText: 'SRT' }).first().click();
    await downloadPromise;

    await page.goto('/history');
    await expect(page.locator('.video-card')).toBeVisible({ timeout: 10_000 });
    const card = page.locator('.video-card').first();
    const cardText = await card.textContent();
    expect(cardText).toContain('Never Gonna Give You Up');
  });
});

test.describe('Error handling', () => {
  test('invalid URL shows error toast, does not navigate', async ({ page }) => {
    await page.goto('/');

    await page.locator('input[aria-label="YouTube Video Link"]').fill('not a url');
    await page.locator('.download-btn').click();

    await expect(page).not.toHaveURL(/preview/);

    await expect(page.locator('.Toastify__toast--error')).toBeVisible({ timeout: 5_000 });
  });

  test('non-YouTube URL shows error toast', async ({ page }) => {
    await page.goto('/');

    await page.locator('input[aria-label="YouTube Video Link"]').fill('https://example.com');
    await page.locator('.download-btn').click();

    await expect(page).not.toHaveURL(/preview/);
    await expect(page.locator('.Toastify__toast--error')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Navigation', () => {
  test('home → history → home via header links', async ({ page }) => {
    await page.goto('/');

    await page.locator('header a', { hasText: 'History' }).click();
    await page.waitForURL('**/history');

    await page.locator('header a', { hasText: 'Home' }).click();
    await page.waitForURL('**/');
  });

  test('theme toggle switches theme class', async ({ page }) => {
    await page.goto('/');

    const bodyClass = await page.evaluate(() => document.body.className);
    await page.locator('.theme-toggle').click();
    const newBodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).not.toBe(newBodyClass);
  });
});
