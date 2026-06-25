import { toast } from 'vue3-toastify';
import { useVideoStore } from '../stores/videoStore.ts';
import type { DownloadTarget } from '../../interfaces/index.ts';
import { downloadSubtitlesUrl, rawSubtitlesUrl } from '../services/api.ts';

export function useDownload() {
  const videoStore = useVideoStore();

  async function downloadSubs(target: DownloadTarget): Promise<void> {
    if (!target.vidId) return;

    videoStore.setDownloading(target, true);

    const signal = AbortSignal.timeout(30_000);

    try {
      const url = downloadSubtitlesUrl(target.vidId, target.lang, target.format, target.type);
      const response = await fetch(url, { signal });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Download failed');
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `subtitles.${target.format}`;
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

      await videoStore.saveToHistory(target.lang, target.format, target.type, filename);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        toast.error('Download timed out. The backend may be stalled.');
      } else {
        console.error(err);
        const message = err instanceof Error ? err.message : 'An error occurred during download';
        toast.error(message);
      }
    } finally {
      videoStore.setDownloading(target, false);
    }
  }

  function openRawTab(vidId: string, lang: string) {
    window.open(rawSubtitlesUrl(vidId, lang), '_blank');
  }

  return {
    isDownloading: videoStore.isDownloading,
    downloadSubs,
    openRawTab,
  };
}
