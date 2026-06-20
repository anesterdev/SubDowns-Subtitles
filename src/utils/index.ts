import crypto from 'crypto';

export function extractVideoId(url: string): string | null {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
}

export async function fetchMetadata(videoId: string): Promise<any> {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    const match = html.match(/var ytInitialPlayerResponse = ({.*?});/);
    if (!match) return null;
    try {
        return JSON.parse(match[1]);
    } catch (e) {
        return null;
    }
}

export function extractVideoData(playerResponse: any, videoId: string) {
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
    return crypto.createHash('md5').update(content, 'utf8').digest('hex');
}

export function getFileSize(content: string): string {
    const bytes = Buffer.byteLength(content, 'utf8');
    return (bytes / 1024).toFixed(2) + ' KB';
}

export function truncateObjectStrings(obj: any, defaultMax: number = 128, customLimits: Record<string, number> = {}): any {
    if (Array.isArray(obj)) {
        return obj.map(item => truncateObjectStrings(item, defaultMax, customLimits));
    }
    if (obj !== null && typeof obj === 'object') {
        const result: any = {};
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

export function convertToSrt(subtitles: {start: string, dur: string, text: string}[]): string {
    return subtitles.map((sub, index) => {
        const startTime = formatTime(sub.start);
        const endTime = formatTime((parseFloat(sub.start) + parseFloat(sub.dur)).toString());
        return `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}`;
    }).join('\n\n');
}

export async function fetchAutoSubtitles(baseUrl: string, targetLangCode: string): Promise<{start: string, dur: string, text: string}[]> {
    const url = baseUrl.replace(/&fmt=[^&]+/, '') + '&fmt=json3&tlang=' + targetLangCode;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (response.status === 429) {
        throw new Error('YouTube blocked the auto-translate request (Error 429 Too Many Requests) due to bot detection. Node.js fetches lack browser cookies/tokens and get rate-limited for translated tracks.');
    }
    if (!response.ok) throw new Error(`Caption fetch failed: ${response.status}`);
    const data: any = await response.json();
    const events = data.events ?? [];
    const subtitles = [];
    for (const event of events) {
        if (!event.segs || event.aAppend === 1) continue;
        const raw = event.segs.map((s: any) => s.utf8 ?? '').join('');
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
