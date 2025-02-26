import { describe, it, expect } from 'vitest';

import { stringify2 } from './stringifyLimited.js';

describe('stringify2', () => {
  it('should stringify simple objects', () => {
    const obj = { a: 1, b: 'test' };
    const result = stringify2(obj);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ a: '1', b: '"test"' });
  });

  it('should handle nested objects', () => {
    const obj = {
      a: 1,
      b: {
        c: 'test',
        d: [1, 2, 3],
      },
    };
    const result = stringify2(obj);
    const parsed = JSON.parse(result);
    expect(parsed.a).toBeTruthy();
    expect(parsed.b).toBeTruthy();
  });

  it('should truncate long values', () => {
    const longString = 'x'.repeat(2000);
    const obj = { str: longString };
    const result = stringify2(obj, 100);
    const parsed = JSON.parse(result);
    expect(parsed.str.length <= 100).toBeTruthy();
  });

  it('should handle null and undefined', () => {
    const obj = {
      nullValue: null,
      undefinedValue: undefined,
    };
    const result = stringify2(obj);
    const parsed = JSON.parse(result);
    expect(parsed.nullValue).toBe('null');
    expect(parsed.undefinedValue).toBe(undefined);
  });

  it('should handle arrays', () => {
    const obj = {
      arr: [1, 'test', { nested: true }],
    };
    const result = stringify2(obj);
    const parsed = JSON.parse(result);
    expect(parsed.arr).toBeTruthy();
  });

  it('should handle Date objects', () => {
    const date = new Date('2024-01-01');
    const obj = { date };
    const result = stringify2(obj);
    const parsed = JSON.parse(result);
    expect(parsed.date.includes('2024-01-01')).toBeTruthy();
  });
});
