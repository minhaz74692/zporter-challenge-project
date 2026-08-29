import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

/**
 * `FirebaseModule` is `@Global`, so `FIRESTORE` is available to the repository
 * without importing anything here. `UsersService` is exported for `AuthModule`
 * and the seed script.
 */
@Module({
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
