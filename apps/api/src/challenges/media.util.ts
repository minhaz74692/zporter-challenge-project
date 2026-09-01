import { BadRequestException } from '@nestjs/common';
import type { DocumentData } from 'firebase-admin/firestore';
import type { MediaItem } from '@zporter/shared';

/**
 * Read a challenge doc's media gallery. Prefers the `media` array; falls back to
 * synthesising it from the legacy `mediaImageUrl` / `mediaVideoUrl` fields so
 * documents written before the gallery existed still render.
 */
export function normalizeMedia(data: DocumentData): MediaItem[] {
  if (Array.isArray(data.media) && data.media.length > 0) {
    return data.media
      .filter((m: unknown): m is MediaItem => isMediaItem(m))
      .map((m: MediaItem) => ({
        url: m.url,
        type: m.type,
        ...(m.thumbnailUrl ? { thumbnailUrl: m.thumbnailUrl } : {}),
      }));
  }
  const legacy: MediaItem[] = [];
  if (typeof data.mediaImageUrl === 'string' && data.mediaImageUrl) {
    legacy.push({ url: data.mediaImageUrl, type: 'image' });
  }
  if (typeof data.mediaVideoUrl === 'string' && data.mediaVideoUrl) {
    legacy.push({ url: data.mediaVideoUrl, type: 'video' });
  }
  return legacy;
}

/** First image / first video URL — keeps the legacy fields in step with `media`. */
export function deriveLegacy(media: MediaItem[]): {
  mediaImageUrl: string | null;
  mediaVideoUrl: string | null;
} {
  return {
    mediaImageUrl: media.find((m) => m.type === 'image')?.url ?? null,
    mediaVideoUrl: media.find((m) => m.type === 'video')?.url ?? null,
  };
}

function isMediaItem(v: unknown): v is MediaItem {
  const m = v as Partial<MediaItem>;
  return (
    !!m &&
    typeof m.url === 'string' &&
    (m.type === 'image' || m.type === 'video' || m.type === 'youtube')
  );
}

const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

/** Extract the 11-char video id from any common YouTube URL shape. */
export function youtubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (!YT_HOSTS.has(parsed.hostname)) return null;

  const fromQuery = parsed.searchParams.get('v');
  if (fromQuery && /^[\w-]{11}$/.test(fromQuery)) return fromQuery;

  // youtu.be/<id>, /embed/<id>, /shorts/<id>, /live/<id>
  const seg = parsed.pathname.split('/').filter(Boolean);
  const last = seg[seg.length - 1];
  return last && /^[\w-]{11}$/.test(last) ? last : null;
}

export function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/** Build a `youtube` media item, or 400 if the URL isn't a recognisable link. */
export function toYoutubeItem(url: string): MediaItem {
  const id = youtubeId(url);
  if (!id) {
    throw new BadRequestException(`Not a valid YouTube link: ${url}`);
  }
  return {
    url: `https://www.youtube.com/watch?v=${id}`,
    type: 'youtube',
    thumbnailUrl: youtubeThumb(id),
  };
}

/**
 * The bucket object path inside a Firebase download URL, or null for anything
 * that isn't one (e.g. a YouTube link) so callers skip the Storage delete.
 */
export function storagePathFromDownloadUrl(url: string): string | null {
  const m = url.match(/\/o\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
