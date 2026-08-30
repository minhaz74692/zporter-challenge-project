import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FirebaseService } from '../firebase/firebase.service.js';
import {
  ALLOWED_IMAGE_MIME,
  MAX_IMAGE_BYTES,
  type AllowedImageMime,
} from './storage.constants.js';

export interface UploadImageInput {
  buffer: Buffer;
  mimeType: string;
  /** Object path within the bucket — no leading slash, no extension. */
  path: string;
}

/** The subset of a multer `File` the upload endpoints pass around. */
export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
}

/**
 * The only place `firebase-admin/storage` is used beyond the `FirebaseService`
 * getter. Uploads go client → API → Storage (Admin SDK) so the "no client ever
 * touches Firebase directly" rule holds; the returned URL carries a Firebase
 * download token, so it works with deny-all Storage rules.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly firebase: FirebaseService) {}

  get enabled(): boolean {
    return !!this.firebase.bucketName;
  }

  /** Store an image at `path` (overwriting) and return a stable tokenised URL. */
  async uploadImage({ buffer, mimeType, path }: UploadImageInput): Promise<string> {
    const bucketName = this.requireBucket();
    this.assertValidImage(buffer, mimeType);

    const token = randomUUID();
    const file = this.firebase.storage.bucket(bucketName).file(path);
    await file.save(buffer, {
      resumable: false,
      contentType: mimeType,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
    this.logger.log(`stored ${path} (${buffer.length} bytes)`);
    return downloadUrl(bucketName, path, token);
  }

  /** Best-effort delete; a missing object is not an error. */
  async deleteObject(path: string): Promise<void> {
    const bucketName = this.firebase.bucketName;
    if (!bucketName) return;
    await this.firebase.storage
      .bucket(bucketName)
      .file(path)
      .delete({ ignoreNotFound: true });
  }

  private assertValidImage(buffer: Buffer, mimeType: string): void {
    if (!ALLOWED_IMAGE_MIME.includes(mimeType as AllowedImageMime)) {
      throw new BadRequestException('Only JPEG, PNG or WebP images are allowed');
    }
    if (buffer.length === 0) throw new BadRequestException('The uploaded file is empty');
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image must be 5 MB or smaller');
    }
  }

  private requireBucket(): string {
    const name = this.firebase.bucketName;
    if (!name) {
      throw new ServiceUnavailableException(
        'Image uploads are not configured on this server (FIREBASE_STORAGE_BUCKET is unset).',
      );
    }
    return name;
  }
}

/** Firebase-style download URL — the token stands in for auth, bypassing rules. */
function downloadUrl(bucket: string, path: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
    path,
  )}?alt=media&token=${token}`;
}
