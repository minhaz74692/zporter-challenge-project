import type {
  ChallengeLocation,
  ChallengeMainCategory,
  ChallengeVisibility,
  ResultType,
  ResultUnit,
  ScoringDirection,
} from '@zporter/shared';

export const MAIN_CATEGORIES: { value: ChallengeMainCategory; label: string }[] = [
  { value: 'physical', label: 'Physical' },
  { value: 'technical', label: 'Technical' },
  { value: 'tactical', label: 'Tactical' },
  { value: 'mental', label: 'Mental' },
  { value: 'rehab', label: 'Rehab' },
  { value: 'other', label: 'Other' },
];

export const VISIBILITIES: { value: ChallengeVisibility; label: string }[] = [
  { value: 'private', label: 'Private' },
  { value: 'friends', label: 'Friends' },
  { value: 'fans', label: 'Fans' },
  { value: 'all', label: 'All' },
];

export const LOCATIONS: { value: ChallengeLocation; label: string }[] = [
  { value: 'anywhere', label: 'Anywhere' },
  { value: 'field', label: 'Field' },
  { value: 'gym', label: 'Gym' },
  { value: 'court', label: 'Court' },
  { value: 'home', label: 'Home' },
];

export const RESULT_TYPES: { value: ResultType; label: string }[] = [
  { value: 'count', label: 'Count' },
  { value: 'time', label: 'Time' },
  { value: 'boolean', label: 'Yes / no' },
  { value: 'score', label: 'Score' },
];

export const RESULT_UNITS: ResultUnit[] = [
  'reps',
  'count',
  'seconds',
  'kg',
  'meters',
  'points',
  'boolean',
];

export const SCORING: { value: ScoringDirection; label: string }[] = [
  { value: 'higher_better', label: 'Higher is better' },
  { value: 'lower_better', label: 'Lower is better' },
];

export const POINT_STEPS = [5, 10, 20, 50, 100, 150];

/** Figma "Time" dropdown — presets mapped to `durationMinutes`. */
export const TIME_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90];

/** Figma "Target group" dropdown — mapped to `position` ("All" → unset). */
export const TARGET_GROUPS = [
  'All',
  'Goalkeepers',
  'Defenders',
  'Midfielders',
  'Forwards',
];

/** Figma "Age from" / "Age to" dropdowns ("All" → unset). */
export const AGE_OPTIONS = [6, 8, 10, 12, 14, 16, 18, 21];

export const COLLECTIONS = [
  'Ballcontrol', 'Build up', 'Activation', 'Set pieces', 'Passing',
  'Possession', 'Strength', 'Games', 'Dribble', 'Attack', 'Speed',
  'Perception', 'Shooting', 'Finish', 'Power', 'Aerobt', '1v1', 'Heading',
  'Turnovers', 'Anaerobt', 'Rondo', 'Defence', 'Press', 'Match', 'Rehab', '2v1',
];

export const EQUIPMENT_TAGS = [
  '#Balls', '#Bench', '#Bibs', '#Clock', '#Cones', '#Goals', '#Hurdles',
  '#Ladders', '#Mannequins', '#Measure Tape', '#Net Targets', '#Poles',
  '#Pop Up Goals', '#Pugs', '#Smart Phone', '#Wests', '#Bands', '#Bouncer',
  '#Barbell', '#Dumbbell', '#Kettlebell', '#Weights', '#Resistance bands',
  '#Skipping Rope', '#Mat', '#Box', '#Roller',
];
