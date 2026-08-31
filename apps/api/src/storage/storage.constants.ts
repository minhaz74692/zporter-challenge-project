export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number];

/** Regex form for `ParseFilePipe`'s `FileTypeValidator`. */
export const IMAGE_MIME_PATTERN = /^image\/(jpeg|png|webp)$/;

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_VIDEO_MIME = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;
export type AllowedVideoMime = (typeof ALLOWED_VIDEO_MIME)[number];

export const VIDEO_MIME_PATTERN = /^video\/(mp4|quicktime|webm)$/;
