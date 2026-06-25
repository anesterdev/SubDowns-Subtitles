export interface YouTubeCaptionTrack {
    baseUrl: string;
    name: { simpleText: string };
    vssId: string;
    languageCode: string;
    isTranslatable: boolean;
    isDefault?: boolean;
}

export interface YouTubeTranslationLanguage {
    languageCode: string;
    languageName: { simpleText: string };
}

export interface YouTubePlayerResponse {
    playabilityStatus?: {
        status: string;
        reason?: string;
    };
    videoDetails?: {
        title: string;
        author: string;
        channelId: string;
        lengthSeconds: string;
        thumbnail?: {
            thumbnails: { url: string; width: number; height: number }[];
        };
    };
    microformat?: {
        playerMicroformatRenderer?: {
            publishDate: string;
        };
    };
    captions?: {
        playerCaptionsTracklistRenderer?: {
            captionTracks?: YouTubeCaptionTrack[];
            translationLanguages?: YouTubeTranslationLanguage[];
        };
    };
}

export interface SubtitleItem {
    start: string;
    dur: string;
    text: string;
}
