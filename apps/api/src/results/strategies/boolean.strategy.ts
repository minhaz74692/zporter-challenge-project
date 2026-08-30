import { BadRequestException, Injectable } from '@nestjs/common';
import type { ResultStrategy, ResultValue } from './result-strategy.js';

/** Yes/no completion — e.g. "did you do all your sessions this week?". */
@Injectable()
export class BooleanResultStrategy implements ResultStrategy {
  readonly type = 'boolean' as const;

  parse(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new BadRequestException('boolean result must be true or false');
  }

  toScore(value: ResultValue): number {
    return value ? 1 : 0;
  }

  isCompletion(value: ResultValue): boolean {
    return value === true;
  }
}
