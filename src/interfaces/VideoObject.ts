export interface IVideoObject {
  subtitles: {
    available_languages: string[];
    raw_subtitles: string;
  };
  video: { 
    title: string;
    video_id: string;
    created_at: string;
    thumbnail_url?: string;
  };
  author: {
    channel_name: string;
    channel_id: string;
    created_at?: string;
  };
  meta: {
    requested_at: string;
    file_hash: string;
    file_size: string;
    filename: string;
  };
}
