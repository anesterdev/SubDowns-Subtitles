# YouTube Subtitle Downloader

A lightweight, modern Node.js 24 script that fetches and downloads YouTube subtitles. Built with native TypeScript execution, it processes a list of YouTube URLs, extracts metadata, and downloads the specified subtitle tracks (preferring manual uploads over auto-generated).

## Features

- **TypeScript Native**
- **Smart Selection**
- **Rich Metadata**
- **Clean File Names**

## Installation

Ensure you have [Node.js v24+](https://nodejs.org/) installed on your machine.

1. Clone or download this repository.
2. Install the dependencies:
   ```bash
   npm install
   ```

## Usage

1. Create a JSON file (e.g., `links.json`) in the root directory containing an array of YouTube URLs:
   ```json
   [
       "https://youtu.be/OIjLUzS6SQA"
   ]
   ```

2. Run the script:
   ```bash
   npm start
   ```

### Custom Input Files and Meta Directory

If you want to use a different file for your links, you can pass it directly as an argument. You can also specify a custom directory for your `.meta` files using the `--meta-dir=` flag (perfect for storing metadata on another disk or separate folder):

```bash
npm start custom-links.json --meta-dir=C:/MyMetaFiles
```

## Outputs

For each processed video, the tool creates a `subtitles/` folder and generates two files:
- `[VIDEO_ID] - Video Title - [Language].txt` — The raw downloaded subtitles text.
- `[VIDEO_ID] - Video Title - [Language].meta` — A lightweight JSON metadata file containing video, author, and source file tracking details and building analytics board.
