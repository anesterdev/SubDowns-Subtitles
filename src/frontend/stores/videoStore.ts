import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { VideoPreviewResponse } from '../../interfaces/index.ts';
import { videoPreviewUrl } from '../services/api.ts';
import { saveHistoryEntry, loadHistoryEntries } from '../services/historyService.ts';

export interface HistoryVideoCard {
  videoId: string;
  video: VideoPreviewResponse['video'];
  author: VideoPreviewResponse['author'];
  language: string;
  format: string;
  type: string;
  filename: string;
  timestamp: number;
}

export const useVideoStore = defineStore('video', () => {
  const currentVideo = ref<VideoPreviewResponse | null>(null);
  const status = ref<'Idle' | 'Fetching' | 'Ready' | 'Error'>('Idle');

  async function fetchVideo(vidId: string) {
    if (!vidId) return;

    status.value = 'Fetching';
    currentVideo.value = null;
    
    const reqUrl = videoPreviewUrl(vidId);

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
      
      const data: VideoPreviewResponse = await res.json();
      currentVideo.value = data;
      status.value = 'Ready';
    } catch {
      status.value = 'Error';
    }
  }

  async function saveToHistory(lang: string, format: string, type: string, filename: string) {
    if (!currentVideo.value) return;
    await saveHistoryEntry({
      videoId: currentVideo.value.video.video_id,
      video: currentVideo.value.video,
      author: currentVideo.value.author,
      language: lang,
      format,
      type,
      filename,
    });
  }

  async function loadHistory(): Promise<HistoryVideoCard[]> {
    return loadHistoryEntries();
  }

  return {
    currentVideo,
    status,
    fetchVideo,
    saveToHistory,
    loadHistory
  };
});
