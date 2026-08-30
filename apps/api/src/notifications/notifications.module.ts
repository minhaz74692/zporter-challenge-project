import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller.js';
import { DevicesRepository } from './devices.repository.js';
import { DevicesService } from './devices.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationsService } from './notifications.service.js';

/**
 * `FirebaseModule` is `@Global`, so `FirebaseService` (for FCM) is available
 * without importing anything. `NotificationsService` is exported so
 * `ChallengesModule` can raise notifications on invite / result events.
 */
@Module({
  controllers: [NotificationsController, DevicesController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    DevicesService,
    DevicesRepository,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
