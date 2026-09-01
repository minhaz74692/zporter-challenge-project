/**
 * One-off maintenance script. Two independent jobs:
 *
 *   1. Re-sync the identity fields denormalised onto every participant and
 *      leaderboard doc (displayName / handle / avatarUrl / club / position)
 *      back to the current `users/{userId}` document. Fixes stale names left
 *      behind when an account is renamed after those rows were written (e.g.
 *      old "Priya Nair" rows that now belong to "Diego Duarte"). Rows whose
 *      user no longer exists are reported, not deleted.
 *   2. Strip profile pictures from ALL users — unset `avatarUrl` and delete the
 *      backing `avatars/{userId}` object from Storage.
 *
 *   pnpm --filter @zporter/api cleanup            # dry run — prints what it would change
 *   pnpm --filter @zporter/api cleanup -- --apply # actually write to Firestore / Storage
 *
 * Runs against whatever project the Firebase Admin credentials resolve to
 * (apps/api/.env → GOOGLE_APPLICATION_CREDENTIALS), so point those at the
 * intended environment before running.
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { AppModule } from '../app.module.js';
import { FIRESTORE } from '../firebase/firebase.constants.js';
import { StorageService } from '../storage/storage.service.js';

const APPLY = process.argv.includes('--apply');

/** Identity fields copied onto denormalised rows, per collection. */
const SYNC_FIELDS: Record<string, readonly string[]> = {
  participants: [
    'displayName',
    'handle',
    'avatarUrl',
    'country',
    'city',
    'club',
    'position',
  ],
  leaderboard: ['displayName', 'handle', 'avatarUrl', 'club'],
};

type UserLite = Record<string, unknown> & { exists: boolean };

async function loadUsers(db: Firestore): Promise<Map<string, UserLite>> {
  const snap = await db.collection('users').get();
  const map = new Map<string, UserLite>();
  for (const d of snap.docs) map.set(d.id, { ...d.data(), exists: true });
  return map;
}

/** Build the patch needed to bring `row` in line with `user`; null if in sync. */
function diffRow(
  row: FirebaseFirestore.DocumentData,
  user: UserLite,
  fields: readonly string[],
): Record<string, unknown> | null {
  const patch: Record<string, unknown> = {};
  for (const f of fields) {
    const want = user[f];
    const have = row[f];
    if (want === undefined || want === null) {
      if (have !== undefined && have !== null) patch[f] = FieldValue.delete();
    } else if (have !== want) {
      patch[f] = want;
    }
  }
  return Object.keys(patch).length ? patch : null;
}

async function resyncIdentity(db: Firestore, logger: Logger): Promise<void> {
  logger.log('\n[1] Re-sync denormalised identity on participants + leaderboard');
  const users = await loadUsers(db);
  let changed = 0;
  let orphans = 0;

  for (const [cg, fields] of Object.entries(SYNC_FIELDS)) {
    const snap = await db.collectionGroup(cg).get();
    for (const doc of snap.docs) {
      const row = doc.data();
      const userId = (row.userId as string) ?? doc.id;
      const challengeId = doc.ref.parent.parent?.id ?? '?';
      const user = users.get(userId);

      if (!user) {
        orphans += 1;
        logger.warn(
          `  ORPHAN ${cg} ${challengeId}/${doc.id} — user ${userId} gone ` +
            `(name "${row.displayName ?? '?'}") — left as-is`,
        );
        continue;
      }

      const patch = diffRow(row, user, fields);
      if (!patch) continue;
      changed += 1;
      const rename =
        'displayName' in patch
          ? ` "${row.displayName ?? '?'}" → "${user.displayName as string}"`
          : ` [${Object.keys(patch).join(', ')}]`;
      logger.log(`  ${cg} ${challengeId}/${doc.id}${rename}`);
      if (APPLY) await doc.ref.set(patch, { merge: true });
    }
  }

  logger.log(`  ${changed} row(s) ${APPLY ? 'updated' : 'to update'}, ${orphans} orphan(s)`);
}

async function stripAvatars(
  db: Firestore,
  storage: StorageService,
  logger: Logger,
): Promise<void> {
  logger.log('\n[2] Remove profile pictures from ALL users');
  const users = await db.collection('users').get();
  let cleared = 0;

  for (const doc of users.docs) {
    if (!(doc.data() as { avatarUrl?: string }).avatarUrl) continue;
    cleared += 1;
    logger.log(`  ${doc.id}: clear avatarUrl + delete avatars/${doc.id}`);
    if (APPLY) {
      await storage.deleteObject(`avatars/${doc.id}`);
      await doc.ref.update({ avatarUrl: FieldValue.delete() });
    }
  }

  logger.log(`  ${cleared} user(s) had an avatar`);
}

async function main(): Promise<void> {
  const logger = new Logger('cleanup');
  logger.log(APPLY ? 'MODE: APPLY (writing changes)' : 'MODE: dry run (no writes)');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const db = app.get<Firestore>(FIRESTORE);
    const storage = app.get(StorageService);

    await resyncIdentity(db, logger);
    await stripAvatars(db, storage, logger);

    logger.log(
      APPLY
        ? '\ndone — changes applied.'
        : '\ndone — dry run only. Re-run with `-- --apply` to commit.',
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  new Logger('cleanup').error(error);
  process.exit(1);
});
