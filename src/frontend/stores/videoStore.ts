import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { IVideoObject } from '../../interfaces/VideoObject.ts';

export interface HistoryVideoCard {
  videoId: string;
  video: IVideoObject['video'];
  author: IVideoObject['author'];
  language: string;
  format: string;
  type: string;
  timestamp: number;
}

export const useVideoStore = defineStore('video', () => {
  const currentVideo = ref<IVideoObject | null>(null);
  const status = ref<'Idle' | 'Fetching' | 'Ready' | 'Error'>('Idle');

  async function fetchVideo(vidId: string) {
    if (!vidId) return;

    status.value = 'Fetching';
    currentVideo.value = null;
    
    const reqUrl = `/api/v0/video-preview?vid_id=${vidId}`;

    try {
      const cache = await caches.open('video-metadata-cache');
      const cachedResponse = await cache.match(reqUrl);

      if (cachedResponse) {
        currentVideo.value = await cachedResponse.json();
        status.value = 'Ready';
        return;
      }

      const res = await fetch(reqUrl);
      if (!res.ok) throw new Error('Video metadata not found');
      
      // Clone response before reading it to store in Cache Storage
      const clonedRes = res.clone();
      await cache.put(reqUrl, clonedRes);
      
      const data: IVideoObject = await res.json();
      currentVideo.value = data;
      status.value = 'Ready';
    } catch (error) {
      status.value = 'Error';
    }
  }

  async function saveToHistory(lang: string, format: string, type: string, filename: string) {
    if (!currentVideo.value) return;
    
    try {
      const cache = await caches.open('metadata');
      const ts = Date.now();
      const vidId = currentVideo.value.video.video_id;
      const metadataKey = `/metadata/history/${ts}-${vidId}`;
      
      const historyData = {
        videoId: vidId,
        video: currentVideo.value.video,
        author: currentVideo.value.author,
        language: lang,
        format,
        type,
        filename,
        timestamp: ts
      };

      await cache.put(metadataKey, new Response(JSON.stringify(historyData), {
        headers: { 'Content-Type': 'application/json' }
      }));
    } catch (cacheErr) {
      console.error('Failed to save download metadata to cache', cacheErr);
    }
  }

  async function loadHistory(): Promise<HistoryVideoCard[]> {
    try {
      const cache = await caches.open('metadata');
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

  return {
    currentVideo,
    status,
    fetchVideo,
    saveToHistory,
    loadHistory
  };
});
