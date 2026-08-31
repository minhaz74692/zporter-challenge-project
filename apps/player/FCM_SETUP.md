# Push notifications (FCM) — setup

The **code** side is done (deps, Gradle/plugin, manifest, entitlements, Dart
service + token sync). What's left is per-project Firebase config you download
from the console — the app runs fine without it, push is just disabled.

## 1. Register the apps in Firebase (project `zporter-challenge-app`)

- **Android app** — package name `com.zporter.challenge`
  → download `google-services.json` → put at **`android/app/google-services.json`**
  (the `com.google.gms.google-services` Gradle plugin **fails the Android build**
  if this file is missing).
- **iOS app** — bundle id `com.zporter.challenge`
  → download `GoogleService-Info.plist` → add to **`ios/Runner/`** and drag it
  into the `Runner` target in Xcode (so it's bundled).

## 2. iOS APNs

- Apple Developer → Keys → create an **APNs Auth Key** (.p8).
- Firebase Console → Project settings → Cloud Messaging → upload the key
  (Key ID + Team ID `7925P3KN23`).
- Xcode → Runner target → Signing & Capabilities → **+ Capability → Push
  Notifications** (the `aps-environment` entitlement is already in
  `ios/Runner/Runner.entitlements` and wired in the project; adding the
  capability also registers the App ID for push). "Background Modes → Remote
  notifications" is already set in `Info.plist`.

## 3. Run

```bash
flutter run --dart-define-from-file=config/local.json   # or cloud.json
```

Sign in → the app requests notification permission and `POST /devices/fcm-token`
(`{ token, platform }`). Sign out → the token is deleted.

## What the code does

- `lib/main.dart` — guarded `Firebase.initializeApp()` + background handler.
- `lib/core/push/push_service.dart` — permission, Android channel
  (`zporter_default`), foreground display via `flutter_local_notifications`,
  tap → `/challenges/:id` (from `data.challengeId`), token register / refresh /
  delete via `PushApi` → `POST /devices/fcm-token`.
- `lib/core/push/push_providers.dart` — `pushRegistrarProvider` listens to auth
  and syncs / clears the token; watched once in `app.dart`.

## Test a push

Firebase Console → Cloud Messaging → send a test to the token printed on
`syncToken` (or trigger a real one: have a coach invite you to a challenge —
the API's `NotificationsService.notify` fires an FCM multicast). Include
`challengeId` in the data payload to make the tap deep-link.
