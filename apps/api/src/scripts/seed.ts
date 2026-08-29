/**
 * Dev seed — idempotent. Populates the reference data the prototype needs
 * before anything works: demo accounts, recognition badges, reusable challenge
 * templates, and one squad.
 *
 *   pnpm --filter @zporter/api seed
 *
 * Users go through `UsersService` (same argon2id path as signup). Badges /
 * templates / team use fixed doc ids and `.set()`, so re-running overwrites
 * rather than duplicating. Live challenges are NOT seeded here — that needs the
 * Phase 2 domain services; extend this script once they exist.
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { SignupRequest } from '@zporter/shared';
import type { Firestore } from 'firebase-admin/firestore';
import { AppModule } from '../app.module.js';
import { FIRESTORE } from '../firebase/firebase.constants.js';
import { UsersService } from '../users/users.service.js';

const PASSWORD = 'password123#';

const USERS: SignupRequest[] = [
  { email: 'admin@zporter.test', password: PASSWORD, displayName: 'Amara Admin', role: 'admin' },
  { email: 'coach@zporter.test', password: PASSWORD, displayName: 'Coach Carter', role: 'coach' },
  { email: 'player1@zporter.test', password: PASSWORD, displayName: 'Priya Nair', role: 'player' },
  { email: 'player2@zporter.test', password: PASSWORD, displayName: 'Diego Duarte', role: 'player' },
  { email: 'player3@zporter.test', password: PASSWORD, displayName: 'Mia Moeller', role: 'player' },
  { email: 'player4@zporter.test', password: PASSWORD, displayName: 'Sam Silva', role: 'player' },
];

const BADGES = [
  { id: 'first-finish', name: 'First Finish', icon: '🏁', description: 'Completed your first challenge.' },
  { id: 'sharp-shooter', name: 'Sharp Shooter', icon: '🎯', description: 'Nailed a technique challenge.' },
  { id: 'iron-will', name: 'Iron Will', icon: '🛡️', description: 'Logged every session in a streak challenge.' },
  { id: 'top-of-the-table', name: 'Top of the Table', icon: '👑', description: 'Finished #1 on a leaderboard.' },
];

interface TemplateSeed {
  id: string;
  title: string;
  description: string;
  category: string;
  resultType: 'count' | 'time' | 'boolean';
  scoringDirection: 'higher_better' | 'lower_better';
  rules: string;
  defaultRewardBadgeId?: string;
}

const TEMPLATES: TemplateSeed[] = [
  {
    id: 'keepie-uppies-century',
    title: 'Keepie-Uppies Century',
    description: 'How many consecutive keepie-uppies can you do in one go?',
    category: 'Technique',
    resultType: 'count',
    scoringDirection: 'higher_better',
    rules: 'One attempt, no hands, ball must not touch the ground. Report your best count.',
    defaultRewardBadgeId: 'sharp-shooter',
  },
  {
    id: 'sprint-40m',
    title: '40m Sprint',
    description: 'Fastest 40 metres from a standing start.',
    category: 'Speed',
    resultType: 'time',
    scoringDirection: 'lower_better',
    rules: 'Flat ground, standing start, stop the clock at 40m. Report seconds (one decimal).',
    defaultRewardBadgeId: 'top-of-the-table',
  },
  {
    id: 'cone-dribble-slalom',
    title: 'Cone Dribble Slalom',
    description: 'Dribble through 8 cones and back as fast as you can.',
    category: 'Technique',
    resultType: 'time',
    scoringDirection: 'lower_better',
    rules: '8 cones, 1m apart. Touch the ball at every gate. Report your fastest run.',
    defaultRewardBadgeId: 'sharp-shooter',
  },
  {
    id: 'weekly-training-log',
    title: 'Weekly Training Log',
    description: 'Did you complete all your prescribed sessions this week?',
    category: 'Consistency',
    resultType: 'boolean',
    scoringDirection: 'higher_better',
    rules: 'Mark complete only if every session in your plan was done. Honesty system.',
    defaultRewardBadgeId: 'iron-will',
  },
];

const TEAM = { id: 'team-falcons', name: 'Zporter Falcons U19' };
const TEAM_MEMBER_EMAILS = [
  'coach@zporter.test',
  'player1@zporter.test',
  'player2@zporter.test',
  'player3@zporter.test',
];

async function seed(): Promise<void> {
  const logger = new Logger('seed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const users = app.get(UsersService);
    const db = app.get<Firestore>(FIRESTORE);
    const now = new Date().toISOString();

    // --- Users (skip if the email already exists) ---
    const idByEmail: Record<string, string> = {};
    for (const input of USERS) {
      const existing = await users.findByEmail(input.email);
      const record = existing ?? (await users.create(input));
      idByEmail[input.email] = record.id;
      logger.log(`${existing ? 'kept   ' : 'created'} user ${input.email} (${record.role})`);
    }

    const coachId = idByEmail['coach@zporter.test'];

    // --- Badges ---
    await Promise.all(
      BADGES.map((badge) => db.collection('badges').doc(badge.id).set(badge)),
    );
    logger.log(`upserted ${BADGES.length} badges`);

    // --- Challenge templates (owned by the coach) ---
    await Promise.all(
      TEMPLATES.map((template) =>
        db.collection('challengeTemplates').doc(template.id).set({
          ...template,
          isPublic: true,
          createdBy: coachId,
          createdAt: now,
        }),
      ),
    );
    logger.log(`upserted ${TEMPLATES.length} challenge templates`);

    // --- Team + membership join ---
    await db.collection('teams').doc(TEAM.id).set({
      name: TEAM.name,
      coachId,
      createdAt: now,
    });
    await Promise.all(
      TEAM_MEMBER_EMAILS.map((email) => {
        const userId = idByEmail[email];
        return db
          .collection('teams')
          .doc(TEAM.id)
          .collection('members')
          .doc(userId)
          .set({
            userId,
            teamId: TEAM.id,
            role: email === 'coach@zporter.test' ? 'coach' : 'player',
            joinedAt: now,
          });
      }),
    );
    logger.log(`upserted team "${TEAM.name}" with ${TEAM_MEMBER_EMAILS.length} members`);

    logger.log(`done. all demo accounts use password "${PASSWORD}".`);
  } finally {
    await app.close();
  }
}

seed().catch((error) => {
  new Logger('seed').error(error);
  process.exit(1);
});
