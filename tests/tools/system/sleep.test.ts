import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sleepTool } from '../../../src/tools/system/sleep';

describe('sleep tool', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should sleep for the specified duration', async () => {
    const startTime = Date.now();
    const sleepPromise = sleepTool.execute({ seconds: 2 });
    
    await vi.advanceTimersByTimeAsync(2000);
    const result = await sleepPromise;
    
    expect(result).toEqual({ sleptFor: 2 });
  });

  it('should reject negative sleep duration', async () => {
    await expect(sleepTool.execute({ seconds: -1 })).rejects.toThrow();
  });

  it('should reject sleep duration over 1 hour', async () => {
    await expect(sleepTool.execute({ seconds: 3601 })).rejects.toThrow();
  });

  it('should format log parameters correctly', () => {
    expect(sleepTool.logParameters({ seconds: 5 })).toBe('sleeping for 5 seconds');
  });

  it('should format log returns correctly', () => {
    expect(sleepTool.logReturns({ sleptFor: 5 })).toBe('');
  });
});
