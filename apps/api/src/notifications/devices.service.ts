import { Injectable } from '@nestjs/common';
import type { RegisterDeviceRequest } from '@zporter/shared';
import { DevicesRepository } from './devices.repository.js';
import type { DeviceTokenRecord } from './entities/notification.entity.js';

@Injectable()
export class DevicesService {
  constructor(private readonly repo: DevicesRepository) {}

  register(userId: string, dto: RegisterDeviceRequest): Promise<DeviceTokenRecord> {
    return this.repo.upsert(userId, dto.token.trim(), dto.platform);
  }
}
