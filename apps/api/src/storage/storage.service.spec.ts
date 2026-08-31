import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirebaseService } from '../firebase/firebase.service.js';
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from './storage.constants.js';
import { StorageService } from './storage.service.js';

const BUCKET = 'demo-bucket.firebasestorage.app';

function build(bucketName: string | undefined) {
  const save = vi.fn().mockResolvedValue(undefined);
  const del = vi.fn().mockResolvedValue(undefined);
  const file = vi.fn(() => ({ save, delete: del }));
  const bucket = vi.fn(() => ({ file }));
  const firebase = {
    bucketName,
    storage: { bucket },
  } as unknown as FirebaseService;
  return { service: new StorageService(firebase), save, del, file, bucket };
}

const withBucket = () => build(BUCKET);
const noBucket = () => build(undefined);

const png = () => Buffer.from('fake-png-bytes');

describe('StorageService.uploadImage', () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(() => {
    ctx = withBucket();
  });

  it('saves the buffer with a Firebase download token and returns a tokenised URL', async () => {
    const url = await ctx.service.uploadImage({
      buffer: png(),
      mimeType: 'image/png',
      path: 'avatars/u1',
    });

    expect(ctx.file).toHaveBeenCalledWith('avatars/u1');
    const [buf, opts] = ctx.save.mock.calls[0];
    expect(buf).toBeInstanceOf(Buffer);
    expect(opts.contentType).toBe('image/png');
    const token = opts.metadata.metadata.firebaseStorageDownloadTokens;
    expect(token).toMatch(/[0-9a-f-]{36}/);
    expect(url).toBe(
      `https://firebasestorage.googleapis.com/v0/b/demo-bucket.firebasestorage.app/o/${encodeURIComponent(
        'avatars/u1',
      )}?alt=media&token=${token}`,
    );
  });

  it('rejects a non-image mime type', async () => {
    await expect(
      ctx.service.uploadImage({ buffer: png(), mimeType: 'application/pdf', path: 'x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an empty or oversize file', async () => {
    await expect(
      ctx.service.uploadImage({ buffer: Buffer.alloc(0), mimeType: 'image/png', path: 'x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      ctx.service.uploadImage({
        buffer: Buffer.alloc(MAX_IMAGE_BYTES + 1),
        mimeType: 'image/png',
        path: 'x',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('503s when no bucket is configured', async () => {
    const { service } = noBucket();
    await expect(
      service.uploadImage({ buffer: png(), mimeType: 'image/png', path: 'x' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

describe('StorageService.uploadVideo', () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(() => {
    ctx = withBucket();
  });

  const mp4 = () => Buffer.from('fake-mp4-bytes');

  it('stores an MP4 and returns a tokenised URL', async () => {
    const url = await ctx.service.uploadVideo({
      buffer: mp4(),
      mimeType: 'video/mp4',
      path: 'challenges/c1/results/u1/video',
    });
    expect(ctx.file).toHaveBeenCalledWith('challenges/c1/results/u1/video');
    expect(ctx.save.mock.calls[0][1].contentType).toBe('video/mp4');
    expect(url).toContain('?alt=media&token=');
  });

  it('rejects a non-video mime type', async () => {
    await expect(
      ctx.service.uploadVideo({ buffer: mp4(), mimeType: 'image/png', path: 'x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an oversize video', async () => {
    await expect(
      ctx.service.uploadVideo({
        buffer: Buffer.alloc(MAX_VIDEO_BYTES + 1),
        mimeType: 'video/mp4',
        path: 'x',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('StorageService.deleteObject', () => {
  it('deletes with ignoreNotFound', async () => {
    const ctx = withBucket();
    await ctx.service.deleteObject('avatars/u1');
    expect(ctx.del).toHaveBeenCalledWith({ ignoreNotFound: true });
  });

  it('is a no-op when uploads are not configured', async () => {
    const { service } = noBucket();
    await expect(service.deleteObject('avatars/u1')).resolves.toBeUndefined();
  });
});
