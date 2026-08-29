# Standup log

Append one entry per working session. Newest first.

---

## 2026-08-30

**Done**
- Wired Firebase Admin SDK into `apps/api` (NestJS):
  - `ConfigModule` — global, `.env` loaded and validated at boot with
    class-validator (`src/config/`). Boot fails fast on missing
    `FIREBASE_PROJECT_ID` or, outside production, a missing credential source.
  - `FirebaseModule` (`@Global`) / `FirebaseService` — the only file that
    imports `firebase-admin`. One Admin app, credential chain
    inline key → key file → ADC (Cloud Run). Exposes `firestore` / `storage` /
    `messaging`; closes the app on shutdown. `FIRESTORE` DI token for repos.
  - `HealthModule` — `GET /health` does a timed Firestore round-trip
    (`ok` / `degraded`), for Cloud Run readiness checks.
  - `main.ts` — shutdown hooks + `unhandledRejection` guard so a background SDK
    rejection can't kill the process.
  - `apps/api/.env.example`, root `FIREBASE_SETUP.md`.
  - Unit tests: `FirebaseService` credential-branch selection, `HealthService`
    ok/degraded. 9 tests pass, build + lint clean.
- Added Claude project memory: engineering principles (SOLID / reusable / clean
  architecture) + "project-plan.md is source of truth".

**Next**
- Swagger / OpenAPI setup in `apps/api`.
- Firestore: create DB, deny-all security rules, seed script
  (`badges`, `challengeTemplates`, demo users).
- `packages/shared`: challenge / participant / result / user DTOs.

**Notes / decisions**
- Repositories will depend on the narrow `FIRESTORE` token, not the whole
  `FirebaseService` — tighter dependency surface (can't reach Storage/FCM).
- Credential source is chosen by what's provided, not by `NODE_ENV`, so it stays
  unit-testable.
- End-to-end `/health` → `{"status":"ok"}` needs a real service-account key
  dropped in per `FIREBASE_SETUP.md`; without one it correctly reports
  `degraded`.
