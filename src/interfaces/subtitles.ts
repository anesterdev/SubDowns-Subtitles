import type { SubtitleItem } from './YouTube.ts';

export interface FetchSubtitlesOptions {
  type?: 'manual' | 'auto';
  allowFallback?: boolean;
  signal?: AbortSignal;
}

export interface FetchSubtitlesResult {
  subtitles: SubtitleItem[];
  exactLangName: string;
  title: string;
}
