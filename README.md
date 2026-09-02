# Zporter Challenges — Prototype

A prototype of one full slice of **Zporter Challenges**: a coach creates a football
challenge and invites players; players discover it, accept or decline, submit a
result, get it verified by a witness, and appear on a live leaderboard. Around that
loop: notifications + push, an activity feed and a baisc biography screen.

## Live links

| | |
| --- | --- |
| Creator web app | https://zporter-challenge-project-web.vercel.app/ |
| Backend API docs (Swagger UI) | https://zporter-api-d4awjs3cxa-uc.a.run.app/docs |

## Repository layout

```
apps/
  player/     Flutter app (the player experience) — not a pnpm workspace member
  api/        NestJS REST API — the only process with Firebase credentials
  web/        Next.js 16 creator/admin flow
packages/
  shared/     @zporter/shared — TypeScript wire-contract types used by api + web
```

pnpm workspaces cover `apps/api`, `apps/web`, `packages/*`. The Flutter app is a plain
package under `apps/player`.

## Architecture

The Flutter and Next.js apps **never talk to Firebase directly** — they only call the
NestJS API. Only the API holds Firebase credentials; Firestore and Storage rules deny
all client access.

```
  Flutter app  \                         / Next.js web
                >--- HTTPS / REST + JWT --<
  (player)     /                         \ (creator)
                          |
                          v
                     NestJS API   -- only holder of Firebase credentials
              controller -> service -> repository
                          |
                          v
              Firebase: Firestore · Storage · FCM
```

- **Player (Flutter):** organized by feature, in layers — screen → state → interface →
  data — using Riverpod for state, one state object per screen.
- **Backend (NestJS):** modular layered architecture — controller → service →
  repository — with dependency injection. Multi-document writes run in Firestore
  transactions.
- **Creator web (Next.js):** App Router with React Server Components and Server Actions;
  tokens kept in httpOnly cookies; one server-only API gateway.

## Tech stack

| Layer | Choice |
| --- | --- |
| Player app | Flutter 3.35+, Riverpod, Dio, go_router |
| Creator web | Next.js 16 (App Router), Tailwind v4, TypeScript |
| Backend API | NestJS 12, TypeScript, class-validator, Swagger |
| Auth | Backend-owned JWT — access + rotating refresh token, `argon2id` |
| Data / storage / push | Firebase — Firestore, Cloud Storage, FCM (via Admin SDK) |
| Hosting | API → Google Cloud Run · Web → Vercel |

## Prerequisites

- Node 20+ and **pnpm 9**
- **Flutter 3.35+**
- A Firebase project with a service-account key (for running the API locally)
- JDK 21 for Android Gradle builds

## Getting started

### 1. Install JS dependencies

```bash
pnpm install
```

### 2. Backend API (`apps/api`)

```bash
cp apps/api/.env.example apps/api/.env
# fill in: FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, a credential source
# (GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY), JWT_ACCESS_SECRET


pnpm --filter @zporter/api start:dev   # http://localhost:3000  ·  Swagger at /docs
```

### 3. Creator web (`apps/web`)

```bash
cp apps/web/.env.example apps/web/.env.local
# set NEXT_PUBLIC_API_URL (http://127.0.0.1:3000 for the local API)

pnpm --filter @zporter/web dev         # http://localhost:3100
```

### 4. Player app (`apps/player`)

```bash
cd apps/player
flutter pub get
flutter run                                             # uses the hosted Cloud Run API by default
flutter run --dart-define-from-file=config/local.json   # local API — set API_BASE_URL inside
```

`API_BASE_URL` for a local API: `http://10.0.2.2:3000` (Android emulator),
`http://localhost:3000` (iOS simulator), or your machine's LAN IP for a physical device.

## Tests

```bash
pnpm -r test                                    # api + web (Vitest)
cd apps/player && flutter analyze && flutter test
```
