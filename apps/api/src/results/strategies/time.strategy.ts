import { BadRequestException, Injectable } from '@nestjs/common';
import type { ResultStrategy, ResultValue } from './result-strategy.js';

/** e.g. a 40m sprint — a positive number of seconds (decimals allowed). */
@Injectable()
export class TimeResultStrategy implements ResultStrategy {
  readonly type = 'time' as const;

  parse(value: unknown): number {
    const n = typeof value === 'string' ? Number(value) : value;
    if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) {
      throw new BadRequestException('time result must be a positive number of seconds');
    }
    return n;
  }

  toScore(value: ResultValue): number {
    return value as number;
  }

  isCompletion(): boolean {
    return true;
  }
}
