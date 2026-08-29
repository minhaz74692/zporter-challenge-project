/**
 * `@zporter/shared` — the wire contract shared by `@zporter/api` and
 * `@zporter/web` (and mirrored by the Flutter models).
 *
 * These types mirror the Firestore data model in `project-plan.md` §6 and the
 * API contract in §7. The NestJS DTOs + Swagger spec are the source of truth;
 * these interfaces must stay in sync with them. Pure types only — no runtime
 * code, so consumers import with `import type`.
 */

export * from './common.js';
export * from './auth.js';
export * from './badge.js';
export * from './team.js';
export * from './template.js';
export * from './challenge.js';
export * from './participant.js';
export * from './result.js';
export * from './notification.js';
