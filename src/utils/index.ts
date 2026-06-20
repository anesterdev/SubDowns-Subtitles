import crypto from 'crypto';
import { YouTubePlayerResponse, SubtitleItem } from '../interfaces/YouTube.ts';

export function extractVideoId(url: string): string | null {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
}

export function extractJsonByName(html: string, varName: string): string | null {
    const searchStrings = [
        `var ${varName} = `,
        `window['${varName}'] = `,
        `window.${varName} = `,
        `${varName} = `
    ];

    let startIdx = -1;
    for (const search of searchStrings) {
        startIdx = html.indexOf(search);
        if (startIdx !== -1) {
            startIdx += search.length;
            break;
        }
    }
    if (startIdx === -1) return null;

    const openBraceIdx = html.indexOf('{', startIdx);
    if (openBraceIdx === -1) return null;

    let braceCount = 1;
    let inString = false;
    let escape = false;
    let i = openBraceIdx + 1;

    for (; i < html.length && braceCount > 0; i++) {
        const char = html[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (char === '\\') {
            escape = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (!inString) {
            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
            }
        }
    }

    if (braceCount === 0) {
        return html.substring(openBraceIdx, i);
    }
    return null;
}

export async function fetchMetadata(videoId: string): Promise<YouTubePlayerResponse | null> {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();

    // Primary: robust balanced braces parser
    const jsonStr = extractJsonByName(html, 'ytInitialPlayerResponse');
    if (jsonStr) {
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            // Ignore and try fallback
        }
    }

    // Secondary fallback: regex
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
    if (match) {
        try {
            return JSON.parse(match[1]);
        } catch (e) {
            // Ignore
        }
    }

    return null;
}

export function extractVideoData(playerResponse: YouTubePlayerResponse, videoId: string) {
    const title = playerResponse.videoDetails?.title?.replace(/[<>:"/\\|?*]+/g, '') || 'Unknown Title';
    const channelName = playerResponse.videoDetails?.author || 'Unknown Channel';
    const channelId = playerResponse.videoDetails?.channelId || '';
    const publishDate = playerResponse.microformat?.playerMicroformatRenderer?.publishDate || '';
    const lengthSeconds = playerResponse.videoDetails?.lengthSeconds || '0';

    const thumbnails = playerResponse.videoDetails?.thumbnail?.thumbnails || [];
    const bestThumbnail = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : undefined;

    return {
        video: {
            title,
            video_id: videoId,
            created_at: publishDate,
            thumbnail_url: bestThumbnail,
            duration: lengthSeconds,
        },
        author: {
            channel_name: channelName,
            channel_id: channelId,
        }
    };
}

export function computeFileHash(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export function getFileSize(content: string): string {
    const bytes = Buffer.byteLength(content, 'utf8');
    return (bytes / 1024).toFixed(2) + ' KB';
}

export function truncateObjectStrings(obj: unknown, defaultMax: number = 128, customLimits: Record<string, number> = {}): unknown {
    if (Array.isArray(obj)) {
        return obj.map((item: unknown) => truncateObjectStrings(item, defaultMax, customLimits));
    }
    if (obj !== null && typeof obj === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                const limit = customLimits[key] !== undefined ? customLimits[key] : defaultMax;
                if (value.length > limit) {
                    result[key] = value.substring(0, limit) + '...';
                } else {
                    result[key] = value;
                }
            } else {
                result[key] = truncateObjectStrings(value, defaultMax, customLimits);
            }
        }
        return result;
    }
    return obj;
}

export function formatTime(secondsStr: string) {
    const totalSeconds = parseFloat(secondsStr);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const ms = Math.floor((totalSeconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function convertToSrt(subtitles: SubtitleItem[]): string {
    return subtitles.map((sub, index) => {
        const startTime = formatTime(sub.start);
        const endTime = formatTime((parseFloat(sub.start) + parseFloat(sub.dur)).toString());
        return `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}`;
    }).join('\n\n');
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
