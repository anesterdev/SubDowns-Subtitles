import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { VideoPreviewResponse, DownloadTarget, DownloadFormat, DownloadType, HistoryVideoCard } from '../../interfaces/index.ts';
import { videoPreviewUrl } from '../services/api.ts';
import { saveHistoryEntry, loadHistoryEntries } from '../services/historyService.ts';

function downloadKey(t: DownloadTarget): string {
  return `${t.vidId}|${t.lang}|${t.format}|${t.type}`;
}

export const useVideoStore = defineStore('video', () => {
  const currentVideo = ref<VideoPreviewResponse | null>(null);
  const status = ref<'Idle' | 'Fetching' | 'Ready' | 'Error'>('Idle');
  const errorMessage = ref('');
  const downloadingMap = ref<Record<string, boolean>>({});
  let fetchController: AbortController | null = null;

  async function fetchVideo(vidId: string) {
    if (!vidId) return;

    if (fetchController) fetchController.abort();
    fetchController = new AbortController();

    status.value = 'Fetching';
    currentVideo.value = null;
    errorMessage.value = '';

    const reqUrl = videoPreviewUrl(vidId);

    try {
      const res = await fetch(reqUrl, { signal: fetchController.signal });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'fetch_failed');
      }

      const data: VideoPreviewResponse = await res.json();
      currentVideo.value = data;
      status.value = 'Ready';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      errorMessage.value = err instanceof Error ? err.message : 'fetch_failed';
      status.value = 'Error';
    } finally {
      if (fetchController?.signal.aborted) fetchController = null;
    }
  }

  async function saveToHistory(lang: string, format: DownloadFormat, type: DownloadType, filename: string) {
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
