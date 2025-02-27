import { describe, it, expect } from 'vitest';

import { TokenTracker } from '../../core/tokens.js';
import { MockLogger } from '../../utils/mockLogger';

import { readFileTool } from './readFile.js';

const toolContext = {
  logger: new MockLogger(),
  headless: true,
  workingDirectory: '.',
  tokenTracker: new TokenTracker(),
};

describe('readFile', () => {
  it('should read a file', async () => {
    const { content } = await readFileTool.execute(
      { path: 'package.json', description: 'test' },
      toolContext,
    );
    expect(content).toContain('mycoder');
  });

  it('should handle missing files', async () => {
    try {
      await readFileTool.execute(
        { path: 'nonexistent.txt', description: 'test' },
        toolContext,
      );
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain('ENOENT');
    }
  });
});
