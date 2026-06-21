export function extractVideoId(url: string): string | null {
    const match = url.match(/(?:v=|\/embed\/|\/shorts\/|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
}
