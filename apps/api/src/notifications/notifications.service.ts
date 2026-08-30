import { Injectable, Logger } from '@nestjs/common';
import type { AppNotification } from '@zporter/shared';
import { FirebaseService } from '../firebase/firebase.service.js';
import { DevicesRepository } from './devices.repository.js';
import type { NewNotification } from './entities/notification.entity.js';
import { NotificationsRepository } from './notifications.repository.js';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repo: NotificationsRepository,
    private readonly devices: DevicesRepository,
    private readonly firebase: FirebaseService,
  ) {}

  /**
   * Persist an in-app notification and best-effort deliver an FCM push.
   * Deliberately swallows its own errors — a notification failure must never
   * break the action that triggered it.
   */
  async notify(payload: NewNotification): Promise<void> {
    let saved: AppNotification;
    try {
      saved = await this.repo.create(payload);
    } catch (err) {
      this.logger.error(
        `Could not persist notification for ${payload.userId}`,
        err as Error,
      );
      return;
    }
    try {
      await this.push(saved);
    } catch (err) {
      this.logger.warn(
        `FCM push failed for ${payload.userId}: ${(err as Error).message}`,
      );
    }
  }

  listForUser(userId: string): Promise<AppNotification[]> {
    return this.repo.listByUser(userId);
  }

  markRead(userId: string, id: string): Promise<void> {
    return this.repo.markRead(userId, id);
  }

  private async push(notification: AppNotification): Promise<void> {
    const tokens = await this.devices.tokensForUser(notification.userId);
    if (tokens.length === 0) return;
    await this.firebase.messaging.sendEachForMulticast({
      tokens,
      notification: { title: notification.title, body: notification.body },
      data: {
        type: notification.type,
        ...(notification.challengeId ? { challengeId: notification.challengeId } : {}),
      },
    });
  }
}
