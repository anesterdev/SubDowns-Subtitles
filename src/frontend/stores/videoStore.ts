import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { IVideoObject } from '../../interfaces/VideoObject.ts';

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

  return {
    currentVideo,
    status,
    fetchVideo,
    saveToHistory
  };
});
