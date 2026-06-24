import type { VideoPreviewResponse } from './schemas/index.ts';
import type { DownloadFormat, DownloadType } from './download.ts';

export interface HistoryVideoCard {
  videoId: string;
  video: VideoPreviewResponse['video'];
  author: VideoPreviewResponse['author'];
  language: string;
  format: DownloadFormat;
  type: DownloadType;
  filename: string;
  timestamp: number;
}
