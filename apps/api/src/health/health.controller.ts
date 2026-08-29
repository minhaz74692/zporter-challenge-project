import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator.js';
import { HealthService } from './health.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Liveness + Firestore round-trip. Used as the Cloud Run readiness check. */
  @Public()
  @Get()
  check() {
    return this.health.check();
  }
}
