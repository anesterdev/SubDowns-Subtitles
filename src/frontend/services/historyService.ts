import type { HistoryVideoCard } from '../stores/videoStore.ts';

const CACHE = 'metadata';

export async function saveHistoryEntry(entry: Omit<HistoryVideoCard, 'timestamp'>): Promise<void> {
  try {
    const cache = await caches.open(CACHE);
    const timestamp = Date.now();
    const key = `/metadata/history/${timestamp}-${entry.videoId}`;
    await cache.put(key, new Response(JSON.stringify({ ...entry, timestamp }), {
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch (err) {
    console.error('Failed to save download metadata to cache', err);
  }
}

export async function loadHistoryEntries(): Promise<HistoryVideoCard[]> {
  try {
    const cache = await caches.open(CACHE);
    const keys = await cache.keys();
    const items: HistoryVideoCard[] = [];

    for (const req of keys) {
      if (!req.url.includes('/history/') && !req.url.includes('/downloads/')) continue;
      const res = await cache.match(req);
      if (!res) continue;
      try {
        const data = await res.json();
        if (data.language && data.format) {
          items.push({
            videoId: data.videoId,
            video: data.video || { title: `Unknown Video (${data.videoId})`, thumbnail_url: '' },
            author: data.author || { channel_name: 'Unknown Author' },
            language: data.language,
            format: data.format,
            type: data.type,
            filename: data.filename,
            timestamp: data.timestamp,
          });
        }
      } catch (e) {
        console.error('Failed to parse history item', e);
      }
    }

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  } catch (err) {
    console.error('Failed to load history', err);
    return [];
  }
}
