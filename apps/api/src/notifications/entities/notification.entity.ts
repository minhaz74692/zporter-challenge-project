import type { AppNotification, DevicePlatform } from '@zporter/shared';

/** Fields a caller supplies; `id` / `read` / `createdAt` are set by the repository. */
export type NewNotification = Pick<
  AppNotification,
  'userId' | 'type' | 'title' | 'body'
> &
  Partial<Pick<AppNotification, 'challengeId'>>;

/** `deviceTokens/{userId}_{platform}` — one active token per user per platform. */
export interface DeviceTokenRecord {
  id: string;
  userId: string;
  fcmToken: string;
  platform: DevicePlatform;
  updatedAt: string;
}
