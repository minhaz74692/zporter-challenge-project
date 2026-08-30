/**
 * Dev seed — idempotent. Populates the reference data the prototype needs
 * before anything works: demo accounts (with profile fields), recognition
 * badges, reusable challenge templates, and one squad.
 *
 *   pnpm --filter @zporter/api seed
 *
 * Users go through `UsersService` (same argon2id path as signup); profile
 * fields are merge-written afterwards so re-runs backfill them. Badges /
 * templates / team use fixed doc ids and `.set()`.
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type {
  ChallengeLocation,
  ChallengeMainCategory,
  ResultType,
  ResultUnit,
  ScoringDirection,
  SignupRequest,
} from '@zporter/shared';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { AppModule } from '../app.module.js';
import { FIRESTORE } from '../firebase/firebase.constants.js';
import { UsersService } from '../users/users.service.js';

const PASSWORD = 'password123#';

interface UserSeed extends SignupRequest {
  handle: string;
  country: string;
  city: string;
  club: string;
  position: string;
}

const seedUser = (
  email: string,
  displayName: string,
  role: SignupRequest['role'],
  handle: string,
  city: string,
  club: string,
  position: string,
): UserSeed => ({
  email,
  password: PASSWORD,
  displayName,
  role,
  handle,
  country: 'SE',
  city,
  club,
  position,
});

const USERS: UserSeed[] = [
  seedUser('admin@zporter.test', 'Amara Admin', 'admin', '#AmaAdm900001', 'Stockholm', 'Zporter HQ', 'Admin'),
  seedUser('coach@zporter.test', 'Coach Carter', 'coach', '#CoaCar900002', 'Stockholm', 'Maj FC', 'Head Coach'),
  seedUser('player1@zporter.test', 'Priya Nair', 'player', '#PriNai900003', 'Goteborg', 'Maj FC', 'FW'),
  seedUser('player2@zporter.test', 'Diego Duarte', 'player', '#DieDua900004', 'Malmo', 'Maj FC', 'CM'),
  seedUser('player3@zporter.test', 'Mia Moeller', 'player', '#MiaMoe900005', 'Uppsala', 'Maj FC', 'GK'),
  seedUser('player4@zporter.test', 'Sam Silva', 'player', '#SamSil900006', 'Ostersund', 'Ope IF', 'DF'),
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
  ingress: string;
  description: string;
  rules: string;
  mainCategory: ChallengeMainCategory;
  collections: string[];
  equipmentTags: string[];
  resultType: ResultType;
  resultUnit: ResultUnit;
  scoringDirection: ScoringDirection;
  durationMinutes: number;
  location: ChallengeLocation;
  pointsToParticipate: number;
  rewardPoints: number;
  defaultRewardBadgeId?: string;
}

const TEMPLATES: TemplateSeed[] = [
  {
    id: 'keepie-uppies-century',
    title: 'Keepie-Uppies Century',
    ingress: 'How high can you count without the ball touching the ground?',
    description: 'How many consecutive keepie-uppies can you do in one go?',
    rules: 'One attempt, no hands, ball must not touch the ground. Report your best count.',
    mainCategory: 'technical',
    collections: ['ballcontrol'],
    equipmentTags: ['#Balls'],
    resultType: 'count',
    resultUnit: 'reps',
    scoringDirection: 'higher_better',
    durationMinutes: 10,
    location: 'anywhere',
    pointsToParticipate: 5,
    rewardPoints: 50,
    defaultRewardBadgeId: 'sharp-shooter',
  },
  {
    id: 'sprint-40m',
    title: '40m Sprint',
    ingress: 'Standing start to the 40m line — how fast?',
    description: 'Fastest 40 metres from a standing start.',
    rules: 'Flat ground, standing start, stop the clock at 40m. Report seconds (one decimal).',
    mainCategory: 'physical',
    collections: ['speed'],
    equipmentTags: ['#Clock', '#Cones'],
    resultType: 'time',
    resultUnit: 'seconds',
    scoringDirection: 'lower_better',
    durationMinutes: 5,
    location: 'field',
    pointsToParticipate: 10,
    rewardPoints: 100,
    defaultRewardBadgeId: 'top-of-the-table',
  },
  {
    id: 'cone-dribble-slalom',
    title: 'Cone Dribble Slalom',
    ingress: 'Eight cones, there and back, close control.',
    description: 'Dribble through 8 cones and back as fast as you can.',
    rules: '8 cones, 1m apart. Touch the ball at every gate. Report your fastest run.',
    mainCategory: 'technical',
    collections: ['dribble'],
    equipmentTags: ['#Cones', '#Balls'],
    resultType: 'time',
    resultUnit: 'seconds',
    scoringDirection: 'lower_better',
    durationMinutes: 15,
    location: 'field',
    pointsToParticipate: 5,
    rewardPoints: 60,
    defaultRewardBadgeId: 'sharp-shooter',
  },
  {
    id: 'weekly-training-log',
    title: 'Weekly Training Log',
    ingress: 'Did you complete every prescribed session this week?',
    description: 'Did you complete all your prescribed sessions this week?',
    rules: 'Mark complete only if every session in your plan was done. Honesty system.',
    mainCategory: 'physical',
    collections: ['strength'],
    equipmentTags: [],
    resultType: 'boolean',
    resultUnit: 'boolean',
    scoringDirection: 'higher_better',
    durationMinutes: 30,
    location: 'anywhere',
    pointsToParticipate: 10,
    rewardPoints: 40,
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

    // --- Users (create if new; always merge-write the profile fields) ---
    const idByEmail: Record<string, string> = {};
    for (const input of USERS) {
      const existing = await users.findByEmail(input.email);
      const record = existing ?? (await users.create(input));
      idByEmail[input.email] = record.id;
      // No avatar — users start empty and upload their own; clear any stale one.
      await db.collection('users').doc(record.id).set(
        {
          handle: input.handle,
          avatarUrl: FieldValue.delete(),
          country: input.country,
          city: input.city,
          club: input.club,
          position: input.position,
        },
        { merge: true },
      );
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
