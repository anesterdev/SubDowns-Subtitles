import { type SubtitleItem } from '../interfaces/YouTube.ts';

export function formatTime(secondsStr: string) {
    const totalSeconds = parseFloat(secondsStr);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const ms = Math.floor((totalSeconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function formatDuration(duration?: string | number): string { // Thought of using Intl lib, but this approach is nearly 200x slower
    if (!duration) return '00:00';
    const totalSeconds = parseInt(duration.toString(), 10);
    if (isNaN(totalSeconds)) return '00:00';

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');

    if (h > 0) {
        const hStr = h.toString().padStart(2, '0');
        return `${hStr}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
}

export function convertToSrt(subtitles: SubtitleItem[]): string {
    return subtitles.map((sub, index) => {
        const startTime = formatTime(sub.start);
        const endTime = formatTime((parseFloat(sub.start) + parseFloat(sub.dur)).toString());
        return `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}`;
    }).join('\n\n');
}
