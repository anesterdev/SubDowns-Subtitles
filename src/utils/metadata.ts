import { LRUCache } from 'lru-cache';
import { type YouTubePlayerResponse } from '../interfaces/YouTube.ts';

const metadataCache = new LRUCache<string, YouTubePlayerResponse>({
    max: 500,
    ttl: 1000 * 60 * 10,
});

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
    const cached = metadataCache.get(videoId);
    if (cached) return cached;

    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();

    let result: YouTubePlayerResponse | null = null;

    // Primary: robust balanced braces parser
    const jsonStr = extractJsonByName(html, 'ytInitialPlayerResponse');
    if (jsonStr) {
        try {
            result = JSON.parse(jsonStr);
        } catch {
            // Ignore and try fallback
        }
    }

    if (!result) {
        // Secondary fallback: regex
        const match = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
        if (match) {
            try {
                result = JSON.parse(match[1]);
            } catch {
                // Ignore
            }
        }
    }

    if (result) {
        metadataCache.set(videoId, result);
    }

    return result;
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
