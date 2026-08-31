import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import {
  IMAGE_MIME_PATTERN,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  VIDEO_MIME_PATTERN,
} from './storage.constants.js';

/** What `@UploadedFile()` yields (subset of multer's `File`, no ambient types). */
export interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

/**
 * Shared `@UploadedFile()` pipe for image endpoints — rejects a missing file, an
 * oversize file, or a non-image with a clean 400 before the handler runs.
 */
export const parseImageUpload = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: MAX_IMAGE_BYTES }),
    new FileTypeValidator({ fileType: IMAGE_MIME_PATTERN }),
  ],
});

/**
 * Same, for result videos — MP4 / MOV / WebM, ≤50 MB. Magic-number sniffing is
 * skipped: it's unreliable for video containers and would reject valid uploads
 * from the device picker. `StorageService.uploadVideo` still enforces the mime
 * allow-list before storing.
 */
export const parseVideoUpload = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: MAX_VIDEO_BYTES }),
    new FileTypeValidator({
      fileType: VIDEO_MIME_PATTERN,
      skipMagicNumbersValidation: true,
    }),
  ],
});
