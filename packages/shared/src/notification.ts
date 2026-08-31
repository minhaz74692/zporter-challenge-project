import type { DevicePlatform, IsoDateTime, NotificationType } from './common.js';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  challengeId?: string;
  /** Who triggered it — e.g. the player whose result needs verifying. */
  actorId?: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: IsoDateTime;
}

/** Body of `POST /challenges/:id/results/:userId/verify`. */
export interface VerifyResultRequest {
  approved: boolean;
}

/** Body of `POST /devices/fcm-token`. */
export interface RegisterDeviceRequest {
  token: string;
  platform: DevicePlatform;
}
