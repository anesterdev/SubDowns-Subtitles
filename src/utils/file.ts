import crypto from 'crypto';

export function computeFileHash(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export function getFileSize(content: string): string {
    const bytes = Buffer.byteLength(content, 'utf8');
    return (bytes / 1024).toFixed(2) + ' KB';
}
