export type ApiErrorCode =
  | 'video_not_found'
  | 'no_subtitles'
  | 'language_not_found'
  | 'rate_limited'
  | 'download_failed'
  | 'fetch_failed';

const API_ERROR_CODES: readonly ApiErrorCode[] = [
  'video_not_found',
  'no_subtitles',
  'language_not_found',
  'rate_limited',
  'download_failed',
  'fetch_failed',
];

export function isApiErrorCode(x: unknown): x is ApiErrorCode {
  return typeof x === 'string' && (API_ERROR_CODES as readonly string[]).includes(x);
}
