import { Global, Module } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from './firebase.constants.js';
import { FirebaseService } from './firebase.service.js';

/**
 * Global so any feature module can inject `FirebaseService` or `FIRESTORE`
 * without re-importing. The `FIRESTORE` factory depends on `FirebaseService`
 * being initialised first (Nest resolves the graph in order).
 */
@Global()
@Module({
  providers: [
    FirebaseService,
    {
      provide: FIRESTORE,
      useFactory: (firebase: FirebaseService): Firestore => firebase.firestore,
      inject: [FirebaseService],
    },
  ],
  exports: [FirebaseService, FIRESTORE],
})
export class FirebaseModule {}
