import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { IMAGE_MIME_PATTERN, MAX_IMAGE_BYTES } from './storage.constants.js';

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
