import { getSubtitles } from 'youtube-caption-extractor';
import { SubtitleItem, YouTubeCaptionTrack } from '../interfaces/YouTube.ts';
import { fetchMetadata } from './metadata.ts';

export function selectCaptionTrack(tracks: YouTubeCaptionTrack[], lang: string, allowFallback: boolean = true): YouTubeCaptionTrack | null {
    if (!tracks || tracks.length === 0) return null;
    
    const matchingTracks = tracks.filter((t) => t.name.simpleText.toLowerCase().includes(lang.toLowerCase()));
    
    if (matchingTracks.length > 0) {
        return matchingTracks.find((t) => t.name.simpleText.toLowerCase() === lang.toLowerCase()) || matchingTracks[0];
    }
    
    if (!allowFallback) return null;
    
    return tracks.find((t) => t.name.simpleText.toLowerCase().includes('english')) || tracks[0];
}

interface AutoSubtitleEvent {
    tStartMs?: number;
    dDurationMs?: number;
    aAppend?: number;
    segs?: { utf8?: string }[];
}

interface AutoSubtitleResponse {
    events?: AutoSubtitleEvent[];
}

export async function fetchAutoSubtitles(baseUrl: string, targetLangCode: string): Promise<SubtitleItem[]> {
    const url = baseUrl.replace(/&fmt=[^&]+/, '') + '&fmt=json3&tlang=' + targetLangCode;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (response.status === 429) {
        throw new Error('YouTube blocked the auto-translate request (Error 429 Too Many Requests) due to bot detection. Node.js fetches lack browser cookies/tokens and get rate-limited for translated tracks.');
    }
    if (!response.ok) throw new Error(`Caption fetch failed: ${response.status}`);
    const data = await response.json() as AutoSubtitleResponse;
    const events = data.events ?? [];
    const subtitles: SubtitleItem[] = [];
    for (const event of events) {
        if (!event.segs || event.aAppend === 1) continue;
        const raw = event.segs.map((s) => s.utf8 ?? '').join('');
        const text = raw.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
        if (!text) continue;
        const startMs = event.tStartMs ?? 0;
        const durMs = event.dDurationMs ?? 0;
        subtitles.push({
            start: (startMs / 1000).toString(),
            dur: (durMs / 1000).toString(),
            text,
        });
    }
    return subtitles;
}

export interface FetchSubtitlesOptions {
    type?: 'manual' | 'auto';
    allowFallback?: boolean;
}

export interface FetchSubtitlesResult {
    subtitles: SubtitleItem[];
    exactLangName: string;
    title: string;
}

export async function fetchSubtitles(vidId: string, lang: string, opts: FetchSubtitlesOptions = {}): Promise<FetchSubtitlesResult> {
    const type = opts.type || 'manual';
    const allowFallback = opts.allowFallback ?? true;

    const playerResponse = await fetchMetadata(vidId);
    if (!playerResponse) {
        throw new Error('Video metadata not found or unavailable');
    }

    const title = playerResponse.videoDetails?.title?.replace(/[<>:"/\\|?*]+/g, '') || 'Video';
    const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    
    if (tracks.length === 0) {
        throw new Error('No subtitles available for this video');
    }

    let subtitles: SubtitleItem[] = [];
    let exactLangName = lang;

    if (type === 'auto') {
        const translationLanguages = playerResponse.captions?.playerCaptionsTracklistRenderer?.translationLanguages || [];
        // @ts-ignore
        const targetLang = translationLanguages.find((t) => t.languageName.simpleText === lang);
        if (!targetLang) throw new Error(`Auto-translate language not found: '${lang}'`);

        const defaultTrack = tracks.find((t) => t.isDefault) || tracks[0];
        if (!defaultTrack) throw new Error('No base track found for auto-translation');

        subtitles = await fetchAutoSubtitles(defaultTrack.baseUrl, targetLang.languageCode);
        exactLangName = targetLang.languageName.simpleText;
    } else {
        const selectedTrack = selectCaptionTrack(tracks, lang, allowFallback);
        if (!selectedTrack) {
            throw new Error(`No manual subtitles found for language target '${lang}'`);
        }
        exactLangName = selectedTrack.name.simpleText;
        subtitles = await getSubtitles({ videoID: vidId, lang: selectedTrack.languageCode });
    }

    return { subtitles, exactLangName, title };
}

export async function fetchSubtitlesText(vidId: string, lang: string): Promise<string> {
    const { subtitles } = await fetchSubtitles(vidId, lang, { type: 'manual', allowFallback: true });
    return subtitles.map((s: SubtitleItem) => s.text).join('\n');
}
