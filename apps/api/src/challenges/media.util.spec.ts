import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  deriveLegacy,
  normalizeMedia,
  storagePathFromDownloadUrl,
  toYoutubeItem,
  youtubeId,
} from './media.util.js';

describe('media.util', () => {
  describe('normalizeMedia', () => {
    it('returns a sanitised copy of a real media array', () => {
      const out = normalizeMedia({
        media: [
          { url: 'a', type: 'image', thumbnailUrl: 't', extra: 'drop me' },
          { url: 'b', type: 'youtube' },
          { url: 'c', type: 'bogus' },
        ],
      });
      expect(out).toEqual([
        { url: 'a', type: 'image', thumbnailUrl: 't' },
        { url: 'b', type: 'youtube' },
      ]);
    });

    it('synthesises from the legacy fields when there is no array', () => {
      expect(
        normalizeMedia({ mediaImageUrl: 'img.jpg', mediaVideoUrl: 'clip.mp4' }),
      ).toEqual([
        { url: 'img.jpg', type: 'image' },
        { url: 'clip.mp4', type: 'video' },
      ]);
    });

    it('is [] when there is nothing', () => {
      expect(normalizeMedia({})).toEqual([]);
    });
  });

  it('deriveLegacy picks the first image / first video', () => {
    expect(
      deriveLegacy([
        { url: 'yt', type: 'youtube' },
        { url: 'v1', type: 'video' },
        { url: 'i1', type: 'image' },
        { url: 'i2', type: 'image' },
      ]),
    ).toEqual({ mediaImageUrl: 'i1', mediaVideoUrl: 'v1' });
    expect(deriveLegacy([])).toEqual({ mediaImageUrl: null, mediaVideoUrl: null });
  });

  describe('youtubeId', () => {
    it('reads every common URL shape', () => {
      expect(youtubeId('https://www.youtube.com/watch?v=b1Dp2Yl3ARw')).toBe('b1Dp2Yl3ARw');
      expect(youtubeId('https://youtu.be/b1Dp2Yl3ARw')).toBe('b1Dp2Yl3ARw');
      expect(youtubeId('https://www.youtube.com/embed/b1Dp2Yl3ARw')).toBe('b1Dp2Yl3ARw');
      expect(youtubeId('https://youtube.com/shorts/b1Dp2Yl3ARw')).toBe('b1Dp2Yl3ARw');
    });

    it('rejects non-YouTube or malformed URLs', () => {
      expect(youtubeId('https://vimeo.com/12345')).toBeNull();
      expect(youtubeId('not a url')).toBeNull();
      expect(youtubeId('https://www.youtube.com/watch?v=short')).toBeNull();
    });
  });

  describe('toYoutubeItem', () => {
    it('canonicalises the URL and attaches a thumbnail', () => {
      expect(toYoutubeItem('https://youtu.be/b1Dp2Yl3ARw')).toEqual({
        url: 'https://www.youtube.com/watch?v=b1Dp2Yl3ARw',
        type: 'youtube',
        thumbnailUrl: 'https://img.youtube.com/vi/b1Dp2Yl3ARw/hqdefault.jpg',
      });
    });

    it('400s on a bad link', () => {
      expect(() => toYoutubeItem('https://example.com')).toThrow(BadRequestException);
    });
  });

  describe('storagePathFromDownloadUrl', () => {
    it('extracts the decoded object path from a Firebase download URL', () => {
      expect(
        storagePathFromDownloadUrl(
          'https://firebasestorage.googleapis.com/v0/b/bkt/o/challenges%2Fc1%2Fmedia%2Fabc?alt=media&token=x',
        ),
      ).toBe('challenges/c1/media/abc');
    });

    it('is null for a non-Storage URL (e.g. a YouTube link)', () => {
      expect(storagePathFromDownloadUrl('https://www.youtube.com/watch?v=abc')).toBeNull();
    });
  });
});
