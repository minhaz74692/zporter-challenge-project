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
  Challenge,
  ChallengeLocation,
  ChallengeMainCategory,
  ChallengeVisibility,
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

/**
 * Three squads, each a coach + three players — every account male. Coach signup
 * creates a team, player signup joins one; here they are seeded directly.
 * `coach@` and `player1@`–`player4@` keep their addresses so the demo
 * challenges/templates (all owned by `coach@`) still resolve.
 */
interface TeamSeed {
  id: string;
  name: string;
  club: string;
  city: string;
  coach: { email: string; displayName: string; handle: string };
  players: { email: string; displayName: string; handle: string; position: string }[];
}

const TEAMS: TeamSeed[] = [
  {
    id: 'team-maj-fc',
    name: 'Maj FC',
    club: 'Maj FC',
    city: 'Goteborg',
    coach: { email: 'coach@zporter.test', displayName: 'Carl Carter', handle: '#CarCar900002' },
    players: [
      { email: 'player1@zporter.test', displayName: 'Diego Duarte', handle: '#DieDua900003', position: 'CM' },
      { email: 'player2@zporter.test', displayName: 'Sam Silva', handle: '#SamSil900004', position: 'FW' },
      { email: 'player3@zporter.test', displayName: 'Leo Lindqvist', handle: '#LeoLin900005', position: 'GK' },
    ],
  },
  {
    id: 'team-ope-if',
    name: 'Ope IF',
    club: 'Ope IF',
    city: 'Ostersund',
    coach: { email: 'coach2@zporter.test', displayName: 'Erik Ericsson', handle: '#EriEri900006' },
    players: [
      { email: 'player4@zporter.test', displayName: 'Marcus Berg', handle: '#MarBer900007', position: 'FW' },
      { email: 'player5@zporter.test', displayName: 'Oskar Nyman', handle: '#OskNym900008', position: 'DF' },
      { email: 'player6@zporter.test', displayName: 'Anton Holm', handle: '#AntHol900009', position: 'CM' },
    ],
  },
  {
    id: 'team-ifk-nord',
    name: 'IFK Nord',
    club: 'IFK Nord',
    city: 'Umea',
    coach: { email: 'coach3@zporter.test', displayName: 'Johan Nilsson', handle: '#JohNil900010' },
    players: [
      { email: 'player7@zporter.test', displayName: 'Viktor Sund', handle: '#VikSun900011', position: 'MF' },
      { email: 'player8@zporter.test', displayName: 'Elias Lund', handle: '#EliLun900012', position: 'DF' },
      { email: 'player9@zporter.test', displayName: 'Hugo Falk', handle: '#HugFal900013', position: 'FW' },
    ],
  },
];

const USERS: UserSeed[] = [
  seedUser('admin@zporter.test', 'Adam Ackerman', 'admin', '#AdaAck900001', 'Stockholm', 'Zporter HQ', 'Admin'),
  ...TEAMS.flatMap((team) => [
    seedUser(team.coach.email, team.coach.displayName, 'coach', team.coach.handle, team.city, team.club, 'Head Coach'),
    ...team.players.map((p) =>
      seedUser(p.email, p.displayName, 'player', p.handle, team.city, team.club, p.position),
    ),
  ]),
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

/**
 * Live demo challenges (coach-owned, fixed ids, `.set()` idempotent). They give
 * the web grid and the player discovery tabs realistic content — including Feed
 * engagement counts and one already-ended challenge for the copy/relaunch flow.
 */
type ChallengeSeed = Omit<Challenge, 'createdBy' | 'createdAt' | 'startAt' | 'deadline'> & {
  /** days from run time; negative = in the past */
  startInDays: number;
  deadlineInDays: number;
};

const seedChallenge = (
  id: string,
  title: string,
  ingress: string,
  description: string,
  mainCategory: ChallengeMainCategory,
  resultType: ResultType,
  resultUnit: ResultUnit,
  scoringDirection: ScoringDirection,
  visibility: ChallengeVisibility,
  cover: string,
  extra: Partial<ChallengeSeed>,
): ChallengeSeed => ({
  id,
  title,
  ingress,
  description,
  mainCategory,
  collections: [],
  equipmentTags: [],
  resultType,
  resultUnit,
  scoringDirection,
  durationMinutes: 20,
  location: 'field',
  status: 'active',
  visibility,
  pointsToParticipate: 10,
  rewardPoints: 50,
  minParticipants: 2,
  ageFrom: 8,
  ageTo: 12,
  position: 'All',
  media: [{ url: cover, type: 'image' }],
  mediaImageUrl: cover,
  participantCount: 0,
  likeCount: 0,
  commentCount: 0,
  startInDays: -2,
  deadlineInDays: 20,
  ...extra,
});

const UNSPLASH = (photoId: string) =>
  `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=900&q=70`;

const CHALLENGES: ChallengeSeed[] = [
  seedChallenge(
    'demo-keepie-uppies-century',
    'Keepie-Uppies Century',
    'How high can you count without the ball touching the ground?',
    'One attempt, no hands, ball must not touch the ground. Report your best count.',
    'technical', 'count', 'reps', 'higher_better', 'all',
    UNSPLASH('1522778119026-d647f0596c20'),
    {
      collections: ['ballcontrol'],
      equipmentTags: ['#Balls'],
      durationMinutes: 10,
      location: 'anywhere',
      rewardPoints: 50,
      rewardBadgeId: 'sharp-shooter',
      likeCount: 48,
      commentCount: 15,
      ratingAverage: 4.6,
      ratingCount: 22,
      // A real multi-item gallery so the carousel is visible in the demo.
      media: [
        { url: UNSPLASH('1522778119026-d647f0596c20'), type: 'image' },
        { url: UNSPLASH('1526232761682-d26e03ac148e'), type: 'image' },
        {
          url: 'https://www.youtube.com/watch?v=b1Dp2Yl3ARw',
          type: 'youtube',
          thumbnailUrl: 'https://img.youtube.com/vi/b1Dp2Yl3ARw/hqdefault.jpg',
        },
      ],
    },
  ),
  seedChallenge(
    'demo-40m-sprint',
    '40m Sprint',
    'Standing start to the 40m line — how fast?',
    'Flat ground, standing start, stop the clock at 40m. Report seconds (one decimal).',
    'physical', 'time', 'seconds', 'lower_better', 'all',
    UNSPLASH('1461896836934-ffe607ba8211'),
    {
      collections: ['speed'],
      equipmentTags: ['#Clock', '#Cones'],
      durationMinutes: 5,
      rewardPoints: 100,
      rewardBadgeId: 'top-of-the-table',
      likeCount: 31,
      commentCount: 8,
      ratingAverage: 4.2,
      ratingCount: 13,
      media: [
        { url: UNSPLASH('1461896836934-ffe607ba8211'), type: 'image' },
        { url: UNSPLASH('1552674605-db6ffd4facb5'), type: 'image' },
      ],
    },
  ),
  seedChallenge(
    'demo-cone-dribble-slalom',
    'Cone Dribble Slalom',
    'Eight cones, there and back, close control.',
    '8 cones, 1m apart. Touch the ball at every gate. Report your fastest run.',
    'technical', 'time', 'seconds', 'lower_better', 'friends',
    UNSPLASH('1543326727-cf6c39e8f84c'),
    {
      collections: ['dribble'],
      equipmentTags: ['#Cones', '#Balls'],
      durationMinutes: 15,
      rewardPoints: 60,
      likeCount: 12,
      commentCount: 3,
    },
  ),
  seedChallenge(
    'demo-weekly-training-log',
    'Weekly Training Log',
    'Did you complete every prescribed session this week?',
    'Mark complete only if every session in your plan was done. Honesty system.',
    'physical', 'boolean', 'boolean', 'higher_better', 'all',
    UNSPLASH('1517838277536-f5f99be501cd'),
    {
      collections: ['strength'],
      durationMinutes: 30,
      location: 'anywhere',
      rewardPoints: 40,
      rewardBadgeId: 'iron-will',
      likeCount: 64,
      commentCount: 27,
      ratingAverage: 4.8,
      ratingCount: 41,
      startInDays: -16,
      deadlineInDays: -2,
    },
  ),
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
      // `displayName` is merged too so re-seeding an existing account also
      // refreshes the name (e.g. the switch to the all-male roster).
      await db.collection('users').doc(record.id).set(
        {
          displayName: input.displayName,
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

    // --- Live demo challenges (coach-owned) ---
    const daysFromNow = (n: number) => {
      const d = new Date(Date.now() + n * 86_400_000);
      d.setHours(18, 0, 0, 0);
      return d.toISOString();
    };
    await Promise.all(
      CHALLENGES.map(({ startInDays, deadlineInDays, ...challenge }) =>
        db.collection('challenges').doc(challenge.id).set({
          ...challenge,
          startAt: daysFromNow(startInDays),
          deadline: daysFromNow(deadlineInDays),
          createdBy: coachId,
          createdAt: now,
        }),
      ),
    );
    logger.log(`upserted ${CHALLENGES.length} demo challenges`);

    // --- Teams + membership join (coach + 3 players each) ---
    // Drop the pre-3-squad seed's single team so the directory shows exactly
    // the current TEAMS (Firestore keeps orphaned docs otherwise).
    const legacyTeam = db.collection('teams').doc('team-falcons');
    const legacyMembers = await legacyTeam.collection('members').get();
    await Promise.all([
      ...legacyMembers.docs.map((d) => d.ref.delete()),
      legacyTeam.delete(),
    ]);

    for (const team of TEAMS) {
      const teamCoachId = idByEmail[team.coach.email];
      await db.collection('teams').doc(team.id).set({
        name: team.name,
        coachId: teamCoachId,
        createdAt: now,
      });
      const members = [
        { userId: teamCoachId, role: 'coach' as const },
        ...team.players.map((p) => ({ userId: idByEmail[p.email], role: 'player' as const })),
      ];
      await Promise.all(
        members.map((m) =>
          db
            .collection('teams')
            .doc(team.id)
            .collection('members')
            .doc(m.userId)
            .set({ userId: m.userId, teamId: team.id, role: m.role, joinedAt: now }),
        ),
      );
      logger.log(`upserted team "${team.name}" with ${members.length} members`);
    }

    logger.log(`done. all demo accounts use password "${PASSWORD}".`);
  } finally {
    await app.close();
  }
}

seed().catch((error) => {
  new Logger('seed').error(error);
  process.exit(1);
});
