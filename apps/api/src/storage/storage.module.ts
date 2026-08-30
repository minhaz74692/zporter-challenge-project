import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service.js';

/** `FirebaseModule` is `@Global`, so `FirebaseService` is available for injection. */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
