import { Injectable, NotFoundException } from '@nestjs/common';
import type { Badge } from '@zporter/shared';
import { BadgesRepository } from './badges.repository.js';

/**
 * Recognition badges (seed data). Read-only in this slice — a badge is granted
 * to a participant by `ChallengesService.verifyResult` when their result is
 * approved.
 */
@Injectable()
export class BadgesService {
  constructor(private readonly repo: BadgesRepository) {}

  list(): Promise<Badge[]> {
    return this.repo.list();
  }

  /** For the `GET /badges/:id` route — 404s on a miss. */
  async require(id: string): Promise<Badge> {
    const badge = await this.repo.findById(id);
    if (!badge) throw new NotFoundException('Badge not found');
    return badge;
  }

  /** For internal callers that treat a missing badge as "no reward". */
  getById(id: string): Promise<Badge | null> {
    return this.repo.findById(id);
  }
}
