import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import type {
  Challenge,
  Participant,
  ScoringDirection,
  SubmitResultRequest,
} from '@zporter/shared';
import { ResultsRepository, type RankedEntry } from './results.repository.js';
import { ResultStrategyRegistry } from './strategies/result-strategy.registry.js';
import type { RankInput, ResultStrategy } from './strategies/result-strategy.js';

/**
 * Submitting a result. The caller (`ChallengesService`) passes the already
 * loaded + status-computed challenge, so this service needs no dependency on the
 * challenges module.
 */
@Injectable()
export class ResultsService {
  constructor(
    private readonly strategies: ResultStrategyRegistry,
    private readonly repo: ResultsRepository,
  ) {}

  async submit(
    challenge: Challenge,
    userId: string,
    dto: SubmitResultRequest,
  ): Promise<Participant> {
    if (challenge.status === 'ended') {
      throw new ConflictException('This challenge has ended');
    }
    // Figma: both are hard requirements on the report form.
    if (!dto.videoUrl?.trim()) {
      throw new BadRequestException('Video must be added to report Challenge');
    }
    if (!dto.controllerRef?.trim()) {
      throw new BadRequestException('Controller must be added to report Challenge');
    }

    const strategy = this.strategies.get(challenge.resultType);
    const value = strategy.parse(dto.value);

    const submission = {
      value,
      unit: challenge.resultUnit,
      videoUrl: dto.videoUrl.trim(),
      performedAt: dto.performedAt,
      arena: dto.arena?.trim(),
      controllerRef: dto.controllerRef.trim(),
      note: dto.note?.trim(),
      submittedAt: new Date().toISOString(),
    };
    const resultState = strategy.isCompletion(value) ? 'completed' : 'submitted';

    return this.repo.submit(
      challenge.id,
      userId,
      submission,
      resultState,
      this.ranker(strategy, challenge.scoringDirection),
    );
  }

  /** Score every submission, sort by the challenge's direction, assign 1..n. */
  private ranker(strategy: ResultStrategy, direction: ScoringDirection) {
    return (entries: RankInput[]): RankedEntry[] => {
      const scored = entries.map((e) => ({ ...e, score: strategy.toScore(e.value) }));
      scored.sort((a, b) =>
        direction === 'higher_better' ? b.score - a.score : a.score - b.score,
      );
      return scored.map((e, index) => ({
        userId: e.userId,
        displayName: e.displayName,
        handle: e.handle,
        avatarUrl: e.avatarUrl,
        club: e.club,
        value: e.score,
        rank: index + 1,
      }));
    };
  }
}
