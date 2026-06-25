export type DownloadFormat = 'srt' | 'txt' | 'raw';
export type DownloadType = 'manual' | 'auto';

export interface DownloadTarget {
  vidId: string;
  lang: string;
  format: DownloadFormat;
  type: DownloadType;
}
