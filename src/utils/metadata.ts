import { LRUCache } from 'lru-cache';
import { type Element, type Node, type Document } from 'domhandler';
import { parseDocument } from 'htmlparser2';
import { type YouTubePlayerResponse } from '../interfaces/YouTube.ts';

const metadataCache = new LRUCache<string, YouTubePlayerResponse>({
    max: 500,
    ttl: 1000 * 60 * 10,
});

/**
 * Locates `varName = { ... }` in an HTML document and returns the balanced JSON
 * object as a raw string.
 *
 * Strategy:
 *   1. Parse the document with `htmlparser2` and walk every `<script>` element.
 *      Limiting the search to script text avoids false positives from the variable
 *      name appearing in attributes, comments, or unrelated text.
 *   2. Within the script text, locate one of the supported assignment forms
 *      (`var x = `, `window.x = `, `window['x'] = `, or a bare `x = `).
 *   3. Use a JS-aware tokenizer to scan past `"`, `'`, and `` ` `` strings, escape
 *      sequences, and line / block comments so that braces inside any literal
 *      do not corrupt the depth count.
 *
 * Limitation: regex literals (`/.../`) and template-expression `${...}` braces are
 * not specially handled. The YouTube player response is plain JSON with no such
 * constructs, so this is safe for the supported inputs.
 */
export function extractJsonByName(html: string, varName: string): string | null {
    for (const scriptText of collectScriptTexts(html)) {
        const result = extractFromScriptText(scriptText, varName);
        if (result !== null) return result;
    }
    return null;
}

function* collectScriptTexts(html: string): Generator<string> {
    let doc: Document;
    try {
        doc = parseDocument(html);
    } catch {
        return;
    }
    for (const node of doc.children) {
        yield* walkScriptTexts(node);
    }
}

function* walkScriptTexts(node: Node): Iterable<string> {
    if (!isElement(node)) return;
    if (node.name === 'script') {
        const text = scriptInnerText(node);
        if (text) yield text;
        return;
    }
    for (const child of node.children) {
        yield* walkScriptTexts(child);
    }
}

function scriptInnerText(node: Element): string {
    if (!node.children) return '';
    let out = '';
    for (const child of node.children) {
        if (child.type === 'text' && 'data' in child && typeof child.data === 'string') {
            out += child.data;
        }
    }
    return out;
}

function isElement(node: Node): node is Element {
    return node.type === 'tag' || node.type === 'script' || node.type === 'style';
}

function extractFromScriptText(scriptText: string, varName: string): string | null {
    const forms = [
        `var ${varName} = `,
        `window['${varName}'] = `,
        `window.${varName} = `,
        `${varName} = `,
    ];

    let startIdx = -1;
    for (const form of forms) {
        startIdx = scriptText.indexOf(form);
        if (startIdx !== -1) {
            startIdx += form.length;
            break;
        }
    }
    if (startIdx === -1) return null;

    const openBraceIdx = scriptText.indexOf('{', startIdx);
    if (openBraceIdx === -1) return null;

    let depth = 1;
    let i = openBraceIdx + 1;
    const len = scriptText.length;

    while (i < len && depth > 0) {
        const ch = scriptText[i];

        if (ch === '"' || ch === '\'' || ch === '`') {
            i = skipString(scriptText, i, ch);
            continue;
        }

        if (ch === '/' && i + 1 < len) {
            const next = scriptText[i + 1];
            if (next === '/') {
                i = skipLineComment(scriptText, i);
                continue;
            }
            if (next === '*') {
                i = skipBlockComment(scriptText, i);
                continue;
            }
        }

        if (ch === '{') depth++;
        else if (ch === '}') depth--;

        i++;
    }

    if (depth !== 0) return null;
    return scriptText.substring(openBraceIdx, i);
}

function skipString(text: string, start: number, quote: string): number {
    const len = text.length;
    let i = start + 1;
    while (i < len) {
        const ch = text[i];
        if (ch === '\\') {
            i += 2;
            continue;
        }
        if (ch === quote) {
            return i + 1;
        }
        i++;
    }
    return i;
}

function skipLineComment(text: string, start: number): number {
    const newlineIdx = text.indexOf('\n', start);
    return newlineIdx === -1 ? text.length : newlineIdx;
}

function skipBlockComment(text: string, start: number): number {
    const closeIdx = text.indexOf('*/', start + 2);
    return closeIdx === -1 ? text.length : closeIdx + 2;
}

export async function fetchMetadata(videoId: string, clientSignal?: AbortSignal): Promise<YouTubePlayerResponse | null> {
    const cached = metadataCache.get(videoId);
    if (cached) return cached;

    const timeoutSignal = AbortSignal.timeout(30_000);
    const signal = clientSignal ? AbortSignal.any([clientSignal, timeoutSignal]) : timeoutSignal;

    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': 'Mozilla/5.0' },
        signal,
    });
    const html = await res.text();

    let result: YouTubePlayerResponse | null = null;

    // Primary: robust balanced braces parser
    const jsonStr = extractJsonByName(html, 'ytInitialPlayerResponse');
    if (jsonStr) {
        try {
            result = JSON.parse(jsonStr);
        } catch {
            // Ignore and try fallback
        }
    }

    if (!result) {
        // Secondary fallback: regex
        const match = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
        if (match) {
            try {
                result = JSON.parse(match[1]);
            } catch {
                // Ignore
            }
        }
    }

    if (result) {
        metadataCache.set(videoId, result);
    }

    return result;
}

export function extractVideoData(playerResponse: YouTubePlayerResponse, videoId: string) {
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
