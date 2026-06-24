const BASE = '/api/v0';

export function videoPreviewUrl(vidId: string): string {
  return `${BASE}/video-preview?vid_id=${encodeURIComponent(vidId)}`;
}

export function downloadSubtitlesUrl(
  vidId: string,
  lang: string,
  format: 'srt' | 'txt' | 'raw',
  type: 'manual' | 'auto'
): string {
  return `${BASE}/download?vid_id=${encodeURIComponent(vidId)}&lang=${encodeURIComponent(lang)}&format=${format}&type=${type}`;
}

export function rawSubtitlesUrl(vidId: string, lang: string): string {
  return `${BASE}/download/raw?vid_id=${encodeURIComponent(vidId)}&lang=${encodeURIComponent(lang)}`;
}
