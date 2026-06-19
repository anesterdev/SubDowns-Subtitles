const { getSubtitles } = require('youtube-caption-extractor');
const fs = require('fs');

const youtubeLinks = [
    'https://youtu.be/xxx',
];

function extractVideoId(url) {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
}

async function downloadSubtitles(links, language = 'en') {
    for (const url of links) {
        const videoId = extractVideoId(url);
        if (!videoId) {
            console.log(`✗ Invalid URL: ${url}`);
            continue;
        }
        
        console.log(`Processing: ${url}`);
        
        try {
            const subtitles = await getSubtitles({ videoID: videoId, lang: language });
            const text = subtitles.map(s => s.text).join('\n');
            
            const filename = `subtitles/${videoId}.${language}.txt`;
            fs.mkdirSync('subtitles', { recursive: true });
            fs.writeFileSync(filename, text);
            
            console.log(`✓ Saved: ${filename}`);
        } catch (err) {
            console.log(`✗ Error: ${err.message}`);
        }
    }
    console.log('\nDone!');
}

downloadSubtitles(youtubeLinks, 'en');