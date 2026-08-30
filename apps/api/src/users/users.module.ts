import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

/**
 * `FirebaseModule` and `StorageModule` are `@Global`, so `FIRESTORE` /
 * `StorageService` are available without importing anything here.
 * `UsersService` is exported for `AuthModule` and the seed script.
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
