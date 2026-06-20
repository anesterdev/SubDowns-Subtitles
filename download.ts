import fs from 'fs';
import path from 'path';
import { getSubtitles } from 'youtube-caption-extractor';
import { extractVideoId, fetchMetadata, computeFileHash, getFileSize, extractVideoData, truncateObjectStrings } from './src/utils/index.ts';
import type { IVideoObject } from './src/interfaces/index.ts';
import type { YouTubeCaptionTrack, SubtitleItem } from './src/interfaces/YouTube.ts';

async function downloadSubtitles(linksFilePath: string, metaDir = 'subtitles', targetLanguage = 'English') {
    if (!fs.existsSync(linksFilePath)) {
        console.log(`✗ Error: Could not find ${linksFilePath}`);
        return;
    }

    const linksContent = fs.readFileSync(linksFilePath, 'utf8');
    const links: string[] = JSON.parse(linksContent);
    const sourceFilename = path.basename(linksFilePath);

    for (const url of links) {
        const videoId = extractVideoId(url);
        if (!videoId) {
            console.log(`✗ Invalid URL: ${url}`);
            continue;
        }

        console.log(`Processing: ${url}`);

        try {
            const playerResponse = await fetchMetadata(videoId);
            if (!playerResponse) {
                console.log(`✗ Error: Could not find player response for ${videoId}`);
                continue;
            }

            const { video, author } = extractVideoData(playerResponse, videoId);
            const title = video.title;

            const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
            if (tracks.length === 0) {
                console.log(`✗ Error: No subtitles found for ${videoId}`);
                continue;
            }

            const availableLanguages = tracks.map((t: YouTubeCaptionTrack) => t.name.simpleText);

            const matchingTracks = tracks.filter((t: YouTubeCaptionTrack) => t.name.simpleText.includes(targetLanguage));
            if (matchingTracks.length === 0) {
                console.log(`✗ Error: No subtitles found for language target '${targetLanguage}'`);
                continue;
            }

            // Prefer manual subs (exact match) over auto-generated
            const manualTrack = matchingTracks.find((t: YouTubeCaptionTrack) => t.name.simpleText.toLowerCase() === targetLanguage.toLowerCase());
            const selectedTrack = manualTrack || matchingTracks[0];
            const exactLangName = selectedTrack.name.simpleText;

            const subtitles = await getSubtitles({ videoID: videoId, lang: selectedTrack.languageCode });
            const text = subtitles.map((s: SubtitleItem) => s.text).join('\n');

            const baseFilename = `[${videoId}] - ${title} - [${exactLangName}]`;
            const txtFilename = path.join('subtitles', `${baseFilename}.txt`);
            const metaFilename = path.join(metaDir, `${baseFilename}.meta`);

            fs.mkdirSync('subtitles', { recursive: true });
            if (metaDir !== 'subtitles') {
                fs.mkdirSync(metaDir, { recursive: true });
            }
            fs.writeFileSync(txtFilename, text);

            const videoObject: IVideoObject = {
                subtitles: {
                    available_languages: availableLanguages,
                    raw_subtitles: text,
                },
                video,
                author,
                meta: {
                    requested_at: new Date().toISOString(),
                    file_hash: computeFileHash(linksContent),
                    file_size: getFileSize(linksContent),
                    filename: sourceFilename,
                }
            };

            const truncatedMeta = truncateObjectStrings(videoObject, 128, { raw_subtitles: 32 }) as IVideoObject;
            fs.writeFileSync(metaFilename, JSON.stringify(truncatedMeta, null, 2));

            console.log(`✓ Saved: ${txtFilename}`);
            console.log(`✓ Saved: ${metaFilename}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.log(`✗ Error: ${message}`);
        }
    }
    console.log('\nDone!');
}

const args = process.argv.slice(2);
let inputFile = 'links.json';
let metaDir = 'subtitles';
let targetLanguage = 'English';

for (const arg of args) {
    if (arg.startsWith('--meta-dir=')) {
        metaDir = arg.split('=')[1];
    } else if (arg.startsWith('--lang=')) {
        targetLanguage = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
        inputFile = arg;
    }
}

downloadSubtitles(inputFile, metaDir, targetLanguage);