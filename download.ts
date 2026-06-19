import fs from 'fs';
import path from 'path';
import { getSubtitles } from 'youtube-caption-extractor';
import { extractVideoId, fetchMetadata, computeFileHash, getFileSize, extractVideoData } from './src/utils/index.ts';
import type { IVideoObject } from './src/interfaces/index.ts';

import youtubeLinks from './links.json' with { type: 'json' };

async function downloadSubtitles(links: string[], targetLanguage = 'English') {
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

            const availableLanguages = tracks.map((t: any) => t.name.simpleText);

            const matchingTracks = tracks.filter((t: any) => t.name.simpleText.includes(targetLanguage));
            if (matchingTracks.length === 0) {
                console.log(`✗ Error: No subtitles found for language target '${targetLanguage}'`);
                continue;
            }

            // Prefer manual subs (exact match) over auto-generated
            const manualTrack = matchingTracks.find((t: any) => t.name.simpleText.toLowerCase() === targetLanguage.toLowerCase());
            const selectedTrack = manualTrack || matchingTracks[0];
            const exactLangName = selectedTrack.name.simpleText;

            const subtitles = await getSubtitles({ videoID: videoId, lang: selectedTrack.languageCode });
            const text = subtitles.map((s: any) => s.text).join('\n');

            const baseFilename = `[${videoId}] - ${title} - [${exactLangName}]`;
            const txtFilename = path.join('subtitles', `${baseFilename}.txt`);
            const metaFilename = path.join('subtitles', `${baseFilename}.meta.json`);

            fs.mkdirSync('subtitles', { recursive: true });
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
                    file_hash: computeFileHash(text),
                    file_size: getFileSize(text),
                    filename: txtFilename,
                }
            };

            fs.writeFileSync(metaFilename, JSON.stringify(videoObject, null, 2));

            console.log(`✓ Saved: ${txtFilename}`);
            console.log(`✓ Saved: ${metaFilename}`);
        } catch (err: any) {
            console.log(`✗ Error: ${err.message}`);
        }
    }
    console.log('\nDone!');
}

downloadSubtitles(youtubeLinks, 'Russian');