import { BadRequestException, Injectable } from '@nestjs/common';
import type { ResultType } from '@zporter/shared';
import type { ResultStrategy } from './result-strategy.js';

/** Resolves the right {@link ResultStrategy} for a challenge's `resultType`. */
@Injectable()
export class ResultStrategyRegistry {
  private readonly byType = new Map<ResultType, ResultStrategy>();

  constructor(strategies: ResultStrategy[]) {
    for (const strategy of strategies) this.byType.set(strategy.type, strategy);
  }

  get(type: ResultType): ResultStrategy {
    const strategy = this.byType.get(type);
    if (!strategy) {
      throw new BadRequestException(
        `Result type "${type}" is not supported in this prototype`,
      );
    }
    return strategy;
  }
}
