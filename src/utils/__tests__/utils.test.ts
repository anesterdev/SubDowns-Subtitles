import { describe, it, expect } from 'vitest';
import {
  extractVideoId,
  extractJsonByName,
  computeFileHash,
  getFileSize,
  truncateObjectStrings,
  formatTime,
  formatDuration,
  convertToSrt
} from '../index.ts';

describe('Utility Functions', () => {
  describe('extractVideoId', () => {
    it('should extract 11-character video ID from various YouTube URL formats', () => {
      expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URLs or IDs', () => {
      expect(extractVideoId('https://www.google.com')).toBeNull();
      expect(extractVideoId('shortID')).toBeNull();
    });
  });

  describe('extractJsonByName', () => {
    function wrap(script: string): string {
      return `<html><head><script>${script}</script></head></html>`;
    }

    it('should parse nested balanced braces variable from HTML string', () => {
      const html = wrap('var testData = {"key": "value", "nested": {"inner": 123}};');
      const result = extractJsonByName(html, 'testData');
      expect(result).toBe('{"key": "value", "nested": {"inner": 123}}');
    });

    it('should return null if variable is not found', () => {
      const html = wrap('var other = {};');
      expect(extractJsonByName(html, 'testData')).toBeNull();
    });

    it('should ignore braces inside double-quoted strings', () => {
      const html = wrap('var data = {"a": "has { and } inside", "b": 2};');
      const result = extractJsonByName(html, 'data');
      expect(result).toBe('{"a": "has { and } inside", "b": 2}');
    });

    it('should ignore braces inside single-quoted and template-literal strings', () => {
      const html = wrap("var data = {'a': 'x{y}z', `b`: `c{d}e`};");
      const result = extractJsonByName(html, 'data');
      expect(result).toBe("{'a': 'x{y}z', `b`: `c{d}e`}");
    });

    it('should skip over line and block comments that contain braces', () => {
      const html = wrap('var data = {/* { skip me */ "ok": 1}; // trailing { ignore');
      const result = extractJsonByName(html, 'data');
      expect(result).toBe('{/* { skip me */ "ok": 1}');
    });

    it('extracts from inside a real <script> tag, not from attributes or surrounding text', () => {
      const html = [
        '<html>',
        '<body data-name="testData" data-payload=\'{"fake": "in attr"}\'>',
        '<p>var testData = {"not": "this one"};</p>',
        '<script>var other = {"ignore": "me"}; var testData = {"real": true}; </script>',
        '</body>',
        '</html>',
      ].join('');
      const result = extractJsonByName(html, 'testData');
      expect(result).toBe('{"real": true}');
    });

    it('returns null when the variable only appears outside of any script tag', () => {
      const html = '<html><body data-name="testData">var testData = {"x":1};</body></html>';
      expect(extractJsonByName(html, 'testData')).toBeNull();
    });
  });

  describe('computeFileHash', () => {
    it('should compute valid SHA-256 hex string', () => {
      const content = 'hello world';
      const hash = computeFileHash(content);
      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });
  });

  describe('getFileSize', () => {
    it('should return size in KB formatted string', () => {
      const content = 'a'.repeat(1024);
      expect(getFileSize(content)).toBe('1.00 KB');
    });
  });

  describe('truncateObjectStrings', () => {
    it('should recursively truncate strings above the max length', () => {
      const input = {
        name: 'this is a long string that exceeds standard limit',
        nested: {
          description: 'another long string that exceeds standard limit',
          short: 'ok'
        }
      };
      const result = truncateObjectStrings(input, 10) as typeof input;
      expect(result.name).toBe('this is a ...');
      expect(result.nested.description).toBe('another lo...');
      expect(result.nested.short).toBe('ok');
    });
  });

  describe('formatTime', () => {
    it('should format seconds string into SRT timestamp format', () => {
      expect(formatTime('0')).toBe('00:00:00,000');
      expect(formatTime('61.5')).toBe('00:01:01,500');
      expect(formatTime('3661.123')).toBe('01:01:01,123');
    });
  });

  describe('formatDuration', () => {
    it('returns 00:00 for missing, zero, or invalid input', () => {
      expect(formatDuration(undefined)).toBe('00:00');
      expect(formatDuration('0')).toBe('00:00');
      expect(formatDuration('')).toBe('00:00');
      expect(formatDuration('not-a-number')).toBe('00:00');
    });

    it('formats seconds-only durations as MM:SS', () => {
      expect(formatDuration('212')).toBe('03:32');
      expect(formatDuration(59)).toBe('00:59');
    });

    it('formats durations of 1 hour or more as HH:MM:SS', () => {
      expect(formatDuration('3661')).toBe('01:01:01');
      expect(formatDuration('36000')).toBe('10:00:00');
    });
  });

  describe('convertToSrt', () => {
    it('should convert SubtitleItems into a correctly formatted SRT string', () => {
      const subtitles = [
        { start: '1.0', dur: '2.5', text: 'Hello World' },
        { start: '4.0', dur: '1.0', text: 'Second Line' }
      ];
      const srt = convertToSrt(subtitles);
      const expected = [
        '1',
        '00:00:01,000 --> 00:00:03,500',
        'Hello World',
        '',
        '2',
        '00:00:04,000 --> 00:00:05,000',
        'Second Line'
      ].join('\n');
      expect(srt).toBe(expected);
    });
  });
});
