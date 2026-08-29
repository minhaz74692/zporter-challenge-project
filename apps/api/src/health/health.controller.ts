import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Liveness + Firestore round-trip. Used as the Cloud Run readiness check. */
  @Get()
  check() {
    return this.health.check();
  }
}
