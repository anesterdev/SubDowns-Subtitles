import { ref } from 'vue';
import { toast } from 'vue3-toastify';
import { useVideoStore } from '../stores/videoStore.ts';
import { downloadSubtitlesUrl, rawSubtitlesUrl } from '../services/api.ts';

export function useDownload() {
  const isDownloading = ref<Record<string, boolean>>({});
  const videoStore = useVideoStore();

  async function downloadSubs(vidId: string, lang: string, format: 'srt' | 'txt' | 'raw', type: 'manual' | 'auto') {
    if (!vidId) return;

    const key = `${vidId}-${lang}-${format}`;
    isDownloading.value[key] = true;

    try {
      const url = downloadSubtitlesUrl(vidId, lang, format, type);
      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Download failed');
      }
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `subtitles.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Save metadata to Cache Storage via the global store
      await videoStore.saveToHistory(lang, format, type, filename);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'An error occurred during download';
      toast.error(message);
    } finally {
      isDownloading.value[key] = false;
    }
  }

  function openRawTab(vidId: string, lang: string) {
    window.open(rawSubtitlesUrl(vidId, lang), '_blank');
  }

  return {
    isDownloading,
    downloadSubs,
    openRawTab
  };
}
