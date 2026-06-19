const fs = require('fs');
const { getSubtitles } = require('youtube-caption-extractor');

const youtubeLinks = require('./links.json');

function extractVideoId(url) {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
}

async function fetchMetadata(videoId) {
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

async function downloadSubtitles(links, targetLanguage = 'English') {
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

            const title = playerResponse.videoDetails?.title?.replace(/[<>:"/\\|?*]+/g, '') || 'Unknown Title';

            const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
            if (tracks.length === 0) {
                console.log(`✗ Error: No subtitles found for ${videoId}`);
                continue;
            }

            const matchingTracks = tracks.filter(t => t.name.simpleText.includes(targetLanguage));
            if (matchingTracks.length === 0) {
                console.log(`✗ Error: No subtitles found for language target '${targetLanguage}'`);
                continue;
            }

            // Prefer manual subs (exact match) over auto-generated
            const manualTrack = matchingTracks.find(t => t.name.simpleText.toLowerCase() === targetLanguage.toLowerCase());
            const selectedTrack = manualTrack || matchingTracks[0];
            const exactLangName = selectedTrack.name.simpleText;

            const subtitles = await getSubtitles({ videoID: videoId, lang: selectedTrack.languageCode });
            const text = subtitles.map(s => s.text).join('\n');

            const filename = `subtitles/[${videoId}] - ${title} - [${exactLangName}].txt`;
            fs.mkdirSync('subtitles', { recursive: true });
            fs.writeFileSync(filename, text);

            console.log(`✓ Saved: ${filename}`);
        } catch (err) {
            console.log(`✗ Error: ${err.message}`);
        }
    }
    console.log('\nDone!');
}

downloadSubtitles(youtubeLinks, 'Russian');