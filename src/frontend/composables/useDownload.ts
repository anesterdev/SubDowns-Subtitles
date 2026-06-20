import { ref } from 'vue';
import { toast } from 'vue3-toastify';
import { useVideoStore } from '../stores/videoStore.ts';

export function useDownload() {
  const isDownloading = ref<Record<string, boolean>>({});
  const videoStore = useVideoStore();

  async function downloadSubs(vidId: string, lang: string, format: string, type: 'manual' | 'auto') {
    if (!vidId) return;

    const key = `${lang}-${format}`;
    isDownloading.value[key] = true;

    try {
      const url = `/api/v0/download?vid_id=${encodeURIComponent(vidId)}&lang=${encodeURIComponent(lang)}&format=${format}&type=${type}`;
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred during download');
    } finally {
      isDownloading.value[key] = false;
    }
  }

  function openRawTab(vidId: string, lang: string) {
    const url = `/api/v0/download/raw?vid_id=${encodeURIComponent(vidId)}&lang=${encodeURIComponent(lang)}`;
    window.open(url, '_blank');
  }

  return {
    isDownloading,
    downloadSubs,
    openRawTab
  };
}
