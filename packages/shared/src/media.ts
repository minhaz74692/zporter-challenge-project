import type { MediaKind } from './common.js';

/**
 * One item in a challenge's ordered media gallery. Uploaded images/videos carry
 * a Firebase Storage download URL; `youtube` items carry the watch URL plus a
 * derived thumbnail.
 */
export interface MediaItem {
  url: string;
  type: MediaKind;
  /** Set for `youtube` (and optionally `video`) so a poster can render. */
  thumbnailUrl?: string;
}

/** Body of `PUT /challenges/:id/media` — replace / reorder the whole gallery. */
export interface SetMediaRequest {
  items: MediaItem[];
}
