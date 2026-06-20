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
    
    const thumbnails = playerResponse.videoDetails?.thumbnail?.thumbnails || [];
    const bestThumbnail = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : undefined;

    return {
        video: {
            title,
            video_id: videoId,
            created_at: publishDate,
            thumbnail_url: bestThumbnail,
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
