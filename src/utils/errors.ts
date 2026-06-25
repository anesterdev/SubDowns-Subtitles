import type { ApiErrorCode } from '../interfaces/errors.ts';

export type SubtitleErrorCode = Exclude<ApiErrorCode, 'fetch_failed'>;

const STATUS_BY_CODE: Record<SubtitleErrorCode, 404 | 429 | 502> = {
  video_not_found: 404,
  no_subtitles: 404,
  language_not_found: 404,
  rate_limited: 429,
  download_failed: 502,
};

export class SubtitleError extends Error {
  readonly code: SubtitleErrorCode;
  readonly status: 404 | 429 | 502;

  constructor(code: SubtitleErrorCode, message: string, opts?: { cause?: unknown }) {
    super(message, opts);
    this.name = 'SubtitleError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }
}
