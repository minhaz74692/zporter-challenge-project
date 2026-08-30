export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number];

/** Regex form for `ParseFilePipe`'s `FileTypeValidator`. */
export const IMAGE_MIME_PATTERN = /^image\/(jpeg|png|webp)$/;
