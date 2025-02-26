import { describe, it, expect } from 'vitest';

import { MockLogger } from '../../utils/mockLogger.js';

import { readFileTool } from './readFile.js';

const logger = new MockLogger();

describe('readFile', () => {
  it('should read a file', async () => {
    const { content } = await readFileTool.execute(
      { path: 'package.json', description: 'test' },
      { logger, headless: true, workingDirectory: '.', tokenLevel: 'debug' },
    );
    expect(content).toContain('mycoder');
  });

  it('should handle missing files', async () => {
    try {
      await readFileTool.execute(
        { path: 'nonexistent.txt', description: 'test' },
        { logger, headless: true, workingDirectory: '.', tokenLevel: 'debug' },
      );
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain('ENOENT');
    }
  });
});
