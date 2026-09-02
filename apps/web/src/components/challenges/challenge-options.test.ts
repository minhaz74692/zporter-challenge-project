import { describe, expect, it } from 'vitest';
import {
  AGE_OPTIONS,
  LOCATIONS,
  MAIN_CATEGORIES,
  POINT_STEPS,
  RESULT_TYPES,
  RESULT_UNITS,
  SCORING,
  TIME_OPTIONS,
  VISIBILITIES,
} from './challenge-options';

describe('challenge form option lists', () => {
  it('offers the six main categories matching the API enum', () => {
    expect(MAIN_CATEGORIES.map((o) => o.value)).toEqual([
      'physical',
      'technical',
      'tactical',
      'mental',
      'rehab',
      'other',
    ]);
  });

  it('offers the visibility levels, "all" last', () => {
    expect(VISIBILITIES.map((o) => o.value)).toEqual([
      'private',
      'team',
      'friends',
      'fans',
      'all',
    ]);
  });

  it('maps the five challenge locations', () => {
    expect(LOCATIONS.map((o) => o.value)).toEqual(['anywhere', 'field', 'gym', 'court', 'home']);
  });

  it('pairs every result type and scoring direction with a human label', () => {
    for (const o of [...RESULT_TYPES, ...SCORING]) {
      expect(o.label.length).toBeGreaterThan(0);
    }
    expect(RESULT_TYPES.map((o) => o.value)).toContain('count');
    expect(SCORING.map((o) => o.value)).toEqual(['higher_better', 'lower_better']);
  });

  it('keeps the result units aligned with the shared ResultUnit union', () => {
    expect(RESULT_UNITS).toEqual(['reps', 'count', 'seconds', 'kg', 'meters', 'points', 'boolean']);
  });

  it('exposes ascending, de-duplicated numeric pickers', () => {
    for (const list of [POINT_STEPS, TIME_OPTIONS, AGE_OPTIONS]) {
      const sorted = [...list].sort((a, b) => a - b);
      expect(list).toEqual(sorted);
      expect(new Set(list).size).toBe(list.length);
    }
  });
});
