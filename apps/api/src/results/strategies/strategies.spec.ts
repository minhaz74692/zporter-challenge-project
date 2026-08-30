import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { BooleanResultStrategy } from './boolean.strategy.js';
import { CountResultStrategy } from './count.strategy.js';
import { ResultStrategyRegistry } from './result-strategy.registry.js';
import { TimeResultStrategy } from './time.strategy.js';

describe('CountResultStrategy', () => {
  const s = new CountResultStrategy();
  it('accepts non-negative integers (incl. numeric strings)', () => {
    expect(s.parse(0)).toBe(0);
    expect(s.parse(42)).toBe(42);
    expect(s.parse('7')).toBe(7);
  });
  it('rejects negatives, decimals, and non-numbers', () => {
    for (const bad of [-1, 2.5, 'abc', true, null]) {
      expect(() => s.parse(bad)).toThrow(BadRequestException);
    }
  });
  it('scores by the count; only a positive count is a completion', () => {
    expect(s.toScore(9)).toBe(9);
    expect(s.isCompletion(0)).toBe(false);
    expect(s.isCompletion(1)).toBe(true);
  });
});

describe('TimeResultStrategy', () => {
  const s = new TimeResultStrategy();
  it('accepts positive numbers (decimals ok)', () => {
    expect(s.parse(5.4)).toBe(5.4);
    expect(s.parse('12.1')).toBe(12.1);
  });
  it('rejects zero, negatives, non-numbers', () => {
    for (const bad of [0, -3, 'x', false]) {
      expect(() => s.parse(bad)).toThrow(BadRequestException);
    }
  });
  it('always counts as a completion', () => {
    expect(s.isCompletion(9.9)).toBe(true);
  });
});

describe('BooleanResultStrategy', () => {
  const s = new BooleanResultStrategy();
  it('accepts booleans and "true"/"false"', () => {
    expect(s.parse(true)).toBe(true);
    expect(s.parse('false')).toBe(false);
  });
  it('rejects anything else', () => {
    for (const bad of [1, 'yes', null, {}]) {
      expect(() => s.parse(bad)).toThrow(BadRequestException);
    }
  });
  it('scores 1/0; only true is a completion', () => {
    expect(s.toScore(true)).toBe(1);
    expect(s.toScore(false)).toBe(0);
    expect(s.isCompletion(false)).toBe(false);
  });
});

describe('ResultStrategyRegistry', () => {
  const registry = new ResultStrategyRegistry([
    new CountResultStrategy(),
    new TimeResultStrategy(),
    new BooleanResultStrategy(),
  ]);
  it('resolves a supported type', () => {
    expect(registry.get('count')).toBeInstanceOf(CountResultStrategy);
    expect(registry.get('time')).toBeInstanceOf(TimeResultStrategy);
  });
  it('rejects an unsupported type', () => {
    expect(() => registry.get('proof')).toThrow(BadRequestException);
  });
});
