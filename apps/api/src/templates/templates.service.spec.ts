import { NotFoundException } from '@nestjs/common';
import type { ChallengeTemplate, CreateTemplateRequest } from '@zporter/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import type { NewTemplate, TemplatesRepository } from './templates.repository.js';
import { TemplatesService } from './templates.service.js';

class FakeTemplatesRepository {
  readonly rows: ChallengeTemplate[] = [];
  private seq = 0;

  async findById(id: string): Promise<ChallengeTemplate | null> {
    return this.rows.find((t) => t.id === id) ?? null;
  }

  async listPublic(): Promise<ChallengeTemplate[]> {
    return this.rows.filter((t) => t.isPublic);
  }

  async listByCreator(userId: string): Promise<ChallengeTemplate[]> {
    return this.rows.filter((t) => t.createdBy === userId);
  }

  async create(data: NewTemplate): Promise<ChallengeTemplate> {
    const row: ChallengeTemplate = {
      id: `tpl${++this.seq}`,
      createdAt: new Date(2026, 0, this.seq).toISOString(),
      ...data,
    };
    this.rows.push(row);
    return row;
  }
}

const INPUT: CreateTemplateRequest = {
  title: '  Sprint  ',
  description: '  40m dash  ',
  category: '  Speed  ',
  resultType: 'time',
  scoringDirection: 'lower_better',
  rules: '  standing start  ',
};

describe('TemplatesService', () => {
  let repo: FakeTemplatesRepository;
  let service: TemplatesService;

  beforeEach(() => {
    repo = new FakeTemplatesRepository();
    service = new TemplatesService(repo as unknown as TemplatesRepository);
  });

  it('create trims text, defaults isPublic true, stamps the creator', async () => {
    const tpl = await service.create(INPUT, 'coach1');
    expect(tpl).toMatchObject({
      title: 'Sprint',
      description: '40m dash',
      category: 'Speed',
      rules: 'standing start',
      isPublic: true,
      createdBy: 'coach1',
    });
  });

  it('list(mine) returns only the caller`s templates', async () => {
    await service.create({ ...INPUT, isPublic: true }, 'coach1');
    await service.create({ ...INPUT, isPublic: true }, 'coach2');

    const mine = await service.list('coach1', true);
    expect(mine.map((t) => t.createdBy)).toEqual(['coach1']);
  });

  it('list() merges public + own (deduped) newest first', async () => {
    await service.create({ ...INPUT, isPublic: true }, 'coach2'); // tpl1 public
    await service.create({ ...INPUT, isPublic: false }, 'coach1'); // tpl2 own private

    const list = await service.list('coach1', false);
    expect(list.map((t) => t.id)).toEqual(['tpl2', 'tpl1']); // newest first, no dupes
    expect(list).toHaveLength(2);
  });

  it('getById throws NotFound for an unknown id', async () => {
    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
