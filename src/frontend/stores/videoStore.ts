import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { VideoPreviewResponse, DownloadTarget } from '../../interfaces/index.ts';
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

function downloadKey(t: DownloadTarget): string {
  return `${t.vidId}|${t.lang}|${t.format}|${t.type}`;
}

export const useVideoStore = defineStore('video', () => {
  const currentVideo = ref<VideoPreviewResponse | null>(null);
  const status = ref<'Idle' | 'Fetching' | 'Ready' | 'Error'>('Idle');
  const errorMessage = ref('');
  const downloadingMap = ref<Record<string, boolean>>({});

  async function fetchVideo(vidId: string) {
    if (!vidId) return;

    status.value = 'Fetching';
    currentVideo.value = null;
    errorMessage.value = '';

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
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'fetch_failed');
      }

      const clonedRes = res.clone();
      await cache.put(reqUrl, clonedRes);

      const data: VideoPreviewResponse = await res.json();
      currentVideo.value = data;
      status.value = 'Ready';
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : 'fetch_failed';
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

  function isDownloading(t: DownloadTarget): boolean {
    return !!downloadingMap.value[downloadKey(t)];
  }

  function setDownloading(t: DownloadTarget, value: boolean): void {
    const key = downloadKey(t);
    if (value) {
      downloadingMap.value = { ...downloadingMap.value, [key]: true };
    } else {
      const next = { ...downloadingMap.value };
      delete next[key];
      downloadingMap.value = next;
    }
  }

  return {
    currentVideo,
    status,
    errorMessage,
    fetchVideo,
    saveToHistory,
    loadHistory,
    isDownloading,
    setDownloading,
  };
});
