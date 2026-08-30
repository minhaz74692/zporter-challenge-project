import { Injectable, NotFoundException } from '@nestjs/common';
import type { ChallengeTemplate, CreateTemplateRequest } from '@zporter/shared';
import { TemplatesRepository } from './templates.repository.js';

@Injectable()
export class TemplatesService {
  constructor(private readonly repo: TemplatesRepository) {}

  /**
   * `mine` → only the caller's own templates. Otherwise the public library plus
   * any of the caller's own (private ones included), deduped.
   */
  async list(userId: string, mine: boolean): Promise<ChallengeTemplate[]> {
    if (mine) return this.repo.listByCreator(userId);

    const [publicTemplates, ownTemplates] = await Promise.all([
      this.repo.listPublic(),
      this.repo.listByCreator(userId),
    ]);
    const byId = new Map<string, ChallengeTemplate>();
    for (const t of [...publicTemplates, ...ownTemplates]) byId.set(t.id, t);
    return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getById(id: string): Promise<ChallengeTemplate> {
    const template = await this.repo.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  create(input: CreateTemplateRequest, createdBy: string): Promise<ChallengeTemplate> {
    return this.repo.create({
      title: input.title.trim(),
      ingress: input.ingress?.trim(),
      description: input.description.trim(),
      rules: input.rules.trim(),
      mainCategory: input.mainCategory,
      collections: input.collections ?? [],
      equipmentTags: input.equipmentTags ?? [],
      resultType: input.resultType,
      resultUnit: input.resultUnit,
      scoringDirection: input.scoringDirection,
      durationMinutes: input.durationMinutes ?? 20,
      location: input.location ?? 'anywhere',
      pointsToParticipate: input.pointsToParticipate ?? 0,
      rewardPoints: input.rewardPoints ?? 0,
      defaultRewardBadgeId: input.defaultRewardBadgeId,
      isPublic: input.isPublic ?? true,
      createdBy,
    });
  }
}
