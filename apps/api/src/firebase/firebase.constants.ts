/**
 * DI token for a bare `Firestore` instance. Feature repositories inject this
 * rather than `FirebaseService`, so their dependency surface is exactly
 * "a Firestore", nothing wider.
 */
export const FIRESTORE = Symbol('FIRESTORE');

/** Name of the Firebase Admin app, so we never collide with the default app. */
export const FIREBASE_APP_NAME = 'zporter-api';
