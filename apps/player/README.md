# Zporter Challenges — player app (Flutter)

The mobile app for players: discover challenges, accept/decline invites, submit
results, watch the leaderboard.

## Prerequisites

- Flutter 3.35+ (`flutter --version`)
- The API running locally — from the repo root:
  `pnpm --filter @zporter/api start:dev` (listens on `:3000`)

## Configure the API URL

The app talks only to the NestJS API. Which host that is depends on where the
app runs:

| Running on | `API_BASE_URL` |
| --- | --- |
| Deployed API (any target) | `https://zporter-api-d4awjs3cxa-uc.a.run.app` — use `config/cloud.json` |
| Android emulator + local API | `http://10.0.2.2:3000` (the default — no config needed) |
| iOS simulator + local API | `http://localhost:3000` |
| Physical device + local API | `http://<your-mac-LAN-IP>:3000` — find it with `ipconfig getifaddr en0` / `ifconfig` |

The value is read from `--dart-define`. The convenient way is a config file:
`config/cloud.json` (committed, points at Cloud Run) or the git-ignored
`config/local.json` (copy `config/local.example.json` for a local API).

```jsonc
// config/cloud.json
{ "API_BASE_URL": "https://zporter-api-d4awjs3cxa-uc.a.run.app" }
```

## Run

```bash
# against the deployed API — works on emulator, simulator, and physical devices
flutter run --dart-define-from-file=config/cloud.json

# against a local API on the Android emulator — default URL
flutter run

# against a local API from a device / iOS simulator
flutter run --dart-define-from-file=config/local.json

# or inline
flutter run --dart-define=API_BASE_URL=http://192.168.0.104:3000
```

Physical device notes:
- the device and the Mac must be on the **same Wi-Fi**;
- cleartext HTTP is already allowed for **debug/profile** builds only
  (`usesCleartextTraffic` on Android, `NSAllowsLocalNetworking` on iOS);
  release builds stay HTTPS-only.

Seed login (from `pnpm --filter @zporter/api seed`): `player1@zporter.test` /
`password123#` (prefilled on the login screen).

## Test

```bash
flutter analyze
flutter test
```

## Architecture

Feature-first, four layers per feature (`presentation → application → domain →
data`), `domain/` holding repository interfaces. Riverpod for state (plain
providers, no code generation). See `../../project-plan.md` §4 and the
architecture notes.
