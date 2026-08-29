import type { DevicePlatform, IsoDateTime, NotificationType } from './common.js';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  challengeId?: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: IsoDateTime;
}

/** Body of `POST /devices/fcm-token`. */
export interface RegisterDeviceRequest {
  token: string;
  platform: DevicePlatform;
}
