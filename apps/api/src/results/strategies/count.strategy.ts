import { BadRequestException, Injectable } from '@nestjs/common';
import type { ResultStrategy, ResultValue } from './result-strategy.js';

/** e.g. keepie-uppies — a non-negative integer count. */
@Injectable()
export class CountResultStrategy implements ResultStrategy {
  readonly type = 'count' as const;

  parse(value: unknown): number {
    const n = typeof value === 'string' ? Number(value) : value;
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
      throw new BadRequestException('count result must be a non-negative integer');
    }
    return n;
  }

  toScore(value: ResultValue): number {
    return value as number;
  }

  isCompletion(value: ResultValue): boolean {
    return (value as number) > 0;
  }
}
