import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from './config/config.module.js';
import { FirebaseModule } from './firebase/firebase.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [ConfigModule, FirebaseModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
