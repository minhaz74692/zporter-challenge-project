import { Module } from '@nestjs/common';
import { ResultsRepository } from './results.repository.js';
import { ResultsService } from './results.service.js';
import { BooleanResultStrategy } from './strategies/boolean.strategy.js';
import { CountResultStrategy } from './strategies/count.strategy.js';
import { ResultStrategyRegistry } from './strategies/result-strategy.registry.js';
import { TimeResultStrategy } from './strategies/time.strategy.js';

// Add a `resultType` by adding its strategy class here — nothing else changes.
const STRATEGIES = [CountResultStrategy, TimeResultStrategy, BooleanResultStrategy];

/**
 * No controller of its own — `POST /challenges/:id/results` lives on
 * `ChallengesController`, which delegates through `ChallengesService`.
 */
@Module({
  providers: [
    ResultsService,
    ResultsRepository,
    ...STRATEGIES,
    {
      provide: ResultStrategyRegistry,
      useFactory: (...strategies: InstanceType<(typeof STRATEGIES)[number]>[]) =>
        new ResultStrategyRegistry(strategies),
      inject: STRATEGIES,
    },
  ],
  exports: [ResultsService],
})
export class ResultsModule {}
