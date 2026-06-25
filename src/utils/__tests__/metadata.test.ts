import { describe, it, expect } from 'vitest';
import { extractVideoData } from '../metadata.ts';
import { YouTubePlayerResponse } from '../../interfaces/YouTube.ts';

describe('extractVideoData', () => {
  it('maps valid metadata correctly and selects best thumbnail url', () => {
    const mockResponse: YouTubePlayerResponse = {
      videoDetails: {
        title: 'Title: with *invalid? <chars>',
        author: 'Rick Astley',
        channelId: 'rick-id',
        lengthSeconds: '212',
        thumbnail: {
          thumbnails: [
            { url: 'small-thumb', width: 120, height: 90 },
            { url: 'best-thumb', width: 480, height: 360 }
          ]
        }
      },
      microformat: {
        playerMicroformatRenderer: {
          publishDate: '2021-06-22'
        }
      }
    };

    const result = extractVideoData(mockResponse, 'dQw4w9WgXcQ');

    expect(result.video).toEqual({
      title: 'Title with invalid chars',
      video_id: 'dQw4w9WgXcQ',
      created_at: '2021-06-22',
      thumbnail_url: 'best-thumb',
      duration: '212',
    });

    expect(result.author).toEqual({
      channel_name: 'Rick Astley',
      channel_id: 'rick-id',
    });
  });

  it('handles missing or partial metadata gracefully with fallback values', () => {
    const mockResponse: YouTubePlayerResponse = {};

    const result = extractVideoData(mockResponse, 'xyz12345678');

    expect(result.video).toEqual({
      title: 'Unknown Title',
      video_id: 'xyz12345678',
      created_at: '',
      thumbnail_url: undefined,
      duration: '0',
    });

    expect(result.author).toEqual({
      channel_name: 'Unknown Channel',
      channel_id: '',
    });
  });
});
