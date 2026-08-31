import type { Challenge, ChallengeTemplate } from '@zporter/shared';
import { describe, expect, it } from 'vitest';
import { prefillFromChallenge, prefillFromTemplate } from './prefill';

const TEMPLATE = {
  id: 'tpl-1',
  title: 'Keepie-Uppies Century',
  ingress: 'Juggle to 100',
  description: 'Do 100 keepie-uppies.',
  rules: 'A ground touch ends the attempt.',
  resultType: 'count',
  resultUnit: 'reps',
  scoringDirection: 'higher_better',
  durationMinutes: 20,
  location: 'anywhere',
  pointsToParticipate: 0,
  rewardPoints: 50,
  equipmentTags: ['#Balls'],
  collections: ['Ballcontrol'],
  mainCategory: 'technical',
} as unknown as ChallengeTemplate;

const CHALLENGE = {
  id: 'c-1',
  title: 'Sprint Test',
  ingress: 'Fast',
  description: 'Run 40m.',
  resultType: 'time',
  resultUnit: 'seconds',
  scoringDirection: 'lower_better',
  durationMinutes: 10,
  location: 'field',
  pointsToParticipate: 5,
  rewardPoints: 100,
  minParticipants: 4,
  ageFrom: 12,
  ageTo: 16,
  position: 'FW',
  equipmentTags: ['#Cones'],
  collections: ['Speed'],
  mainCategory: 'physical',
  startAt: '2026-01-01T09:00:00.000Z',
  deadline: '2026-02-01T09:00:00.000Z',
  visibility: 'friends',
} as unknown as Challenge;

describe('prefillFromTemplate', () => {
  it('keeps the templateId so the API can merge server-side gaps', () => {
    expect(prefillFromTemplate(TEMPLATE).templateId).toBe('tpl-1');
  });

  it('folds description + rules into one description block', () => {
    expect(prefillFromTemplate(TEMPLATE).description).toBe(
      'Do 100 keepie-uppies.\n\nA ground touch ends the attempt.',
    );
  });

  it('defaults minParticipants to 2 and leaves schedule/visibility unset', () => {
    const p = prefillFromTemplate(TEMPLATE);
    expect(p.minParticipants).toBe(2);
    expect(p.startAt).toBeUndefined();
    expect(p.deadline).toBeUndefined();
    expect(p.visibility).toBeUndefined();
  });

  it('carries the result descriptors and tag arrays across', () => {
    const p = prefillFromTemplate(TEMPLATE);
    expect(p).toMatchObject({
      resultType: 'count',
      resultUnit: 'reps',
      scoringDirection: 'higher_better',
      equipmentTags: ['#Balls'],
      collections: ['Ballcontrol'],
    });
  });

  it('tolerates a template with no ingress / tags', () => {
    const bare = { ...TEMPLATE, ingress: undefined, equipmentTags: undefined, collections: undefined } as unknown as ChallengeTemplate;
    const p = prefillFromTemplate(bare);
    expect(p.ingress).toBe('');
    expect(p.equipmentTags).toEqual([]);
    expect(p.collections).toEqual([]);
  });
});

describe('prefillFromChallenge', () => {
  it('appends "(copy)" to the title in copy mode and drops the schedule', () => {
    const p = prefillFromChallenge(CHALLENGE, 'copy');
    expect(p.title).toBe('Sprint Test (copy)');
    expect(p.startAt).toBeUndefined();
    expect(p.deadline).toBeUndefined();
    expect(p.visibility).toBeUndefined();
    expect(p.templateId).toBeUndefined();
  });

  it('keeps the real title, schedule and visibility in edit mode', () => {
    const p = prefillFromChallenge(CHALLENGE, 'edit');
    expect(p.title).toBe('Sprint Test');
    expect(p.startAt).toBe('2026-01-01T09:00:00.000Z');
    expect(p.deadline).toBe('2026-02-01T09:00:00.000Z');
    expect(p.visibility).toBe('friends');
  });

  it('defaults to copy mode when no mode is given', () => {
    expect(prefillFromChallenge(CHALLENGE).title).toBe('Sprint Test (copy)');
  });

  it('passes through the challenge description verbatim (no rules merge)', () => {
    expect(prefillFromChallenge(CHALLENGE, 'edit').description).toBe('Run 40m.');
  });

  it('preserves age bounds and minParticipants from the source challenge', () => {
    const p = prefillFromChallenge(CHALLENGE, 'edit');
    expect(p).toMatchObject({ ageFrom: 12, ageTo: 16, minParticipants: 4, position: 'FW' });
  });
});
