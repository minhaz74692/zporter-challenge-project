import type {
  Challenge,
  ChallengeLocation,
  ChallengeMainCategory,
  ChallengeTemplate,
  ResultType,
  ResultUnit,
  ScoringDirection,
} from '@zporter/shared';

/**
 * The subset of challenge content the create form pre-fills. Sourced from a
 * template ("copy from Library") or an existing challenge ("COPY" / relaunch);
 * the form itself stays agnostic to which.
 */
export interface ChallengePrefill {
  /** Set only when copying a template — lets the API merge gaps server-side. */
  templateId?: string;
  title: string;
  ingress: string;
  description: string;
  resultType: ResultType;
  resultUnit: ResultUnit;
  scoringDirection: ScoringDirection;
  durationMinutes: number;
  location: ChallengeLocation;
  pointsToParticipate: number;
  rewardPoints: number;
  minParticipants: number;
  ageFrom?: number;
  ageTo?: number;
  position: string;
  equipmentTags: string[];
  collections: string[];
  mainCategory: ChallengeMainCategory;
}

export function prefillFromTemplate(t: ChallengeTemplate): ChallengePrefill {
  return {
    templateId: t.id,
    title: t.title,
    ingress: t.ingress ?? '',
    description: [t.description, t.rules].filter(Boolean).join('\n\n'),
    resultType: t.resultType,
    resultUnit: t.resultUnit,
    scoringDirection: t.scoringDirection,
    durationMinutes: t.durationMinutes,
    location: t.location,
    pointsToParticipate: t.pointsToParticipate,
    rewardPoints: t.rewardPoints,
    minParticipants: 2,
    position: '',
    equipmentTags: t.equipmentTags ?? [],
    collections: t.collections ?? [],
    mainCategory: t.mainCategory,
  };
}

export function prefillFromChallenge(c: Challenge): ChallengePrefill {
  return {
    title: `${c.title} (copy)`,
    ingress: c.ingress ?? '',
    description: c.description,
    resultType: c.resultType,
    resultUnit: c.resultUnit,
    scoringDirection: c.scoringDirection,
    durationMinutes: c.durationMinutes,
    location: c.location,
    pointsToParticipate: c.pointsToParticipate,
    rewardPoints: c.rewardPoints,
    minParticipants: c.minParticipants,
    ageFrom: c.ageFrom,
    ageTo: c.ageTo,
    position: c.position ?? '',
    equipmentTags: c.equipmentTags,
    collections: c.collections,
    mainCategory: c.mainCategory,
  };
}
