import { SubtitleItem } from '../interfaces/YouTube.ts';

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
