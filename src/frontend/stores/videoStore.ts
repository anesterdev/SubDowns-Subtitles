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

  return {
    currentVideo,
    status,
    fetchVideo,
  };
});
