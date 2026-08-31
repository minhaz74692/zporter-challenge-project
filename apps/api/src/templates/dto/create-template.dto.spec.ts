import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateTemplateDto } from './create-template.dto.js';
import { ListTemplatesQuery } from './list-templates.query.js';

const errorProps = (dto: object) => validateSync(dto).map((e) => e.property);

const VALID = {
  title: 'Keepie-Uppies Century',
  description: 'Do 100 keepie-uppies without the ball touching the ground.',
  rules: 'One touch counts once; a ground touch ends the attempt.',
  mainCategory: 'technical',
  resultType: 'count',
  resultUnit: 'reps',
  scoringDirection: 'higher_better',
};

describe('CreateTemplateDto', () => {
  it('accepts a well-formed template', () => {
    expect(errorProps(plainToInstance(CreateTemplateDto, VALID))).toEqual([]);
  });

  it('requires title, description, rules and the three result descriptors', () => {
    expect(errorProps(plainToInstance(CreateTemplateDto, {}))).toEqual(
      expect.arrayContaining([
        'title',
        'description',
        'rules',
        'mainCategory',
        'resultType',
        'resultUnit',
        'scoringDirection',
      ]),
    );
  });

  it('rejects an out-of-enum scoringDirection', () => {
    expect(
      errorProps(plainToInstance(CreateTemplateDto, { ...VALID, scoringDirection: 'random' })),
    ).toContain('scoringDirection');
  });

  it('enforces the maxLength on title (120) and description (2000)', () => {
    const dto = plainToInstance(CreateTemplateDto, {
      ...VALID,
      title: 'x'.repeat(121),
      description: 'y'.repeat(2001),
    });
    expect(errorProps(dto)).toEqual(expect.arrayContaining(['title', 'description']));
  });

  it('rejects a non-boolean isPublic and negative points', () => {
    const dto = plainToInstance(CreateTemplateDto, {
      ...VALID,
      isPublic: 'yes',
      rewardPoints: -1,
    });
    expect(errorProps(dto)).toEqual(expect.arrayContaining(['isPublic', 'rewardPoints']));
  });
});

describe('ListTemplatesQuery', () => {
  it('defaults mine to false when absent', () => {
    const q = plainToInstance(ListTemplatesQuery, {});
    expect(q.mine).toBe(false);
    expect(errorProps(q)).toEqual([]);
  });

  it('coerces the "true" string from the query string to a boolean', () => {
    const q = plainToInstance(ListTemplatesQuery, { mine: 'true' });
    expect(q.mine).toBe(true);
    expect(errorProps(q)).toEqual([]);
  });

  it('coerces any other string to false', () => {
    expect(plainToInstance(ListTemplatesQuery, { mine: 'false' }).mine).toBe(false);
    expect(plainToInstance(ListTemplatesQuery, { mine: '1' }).mine).toBe(false);
  });
});
