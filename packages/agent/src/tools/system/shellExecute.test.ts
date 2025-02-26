import { describe, it, expect } from 'vitest';

import { MockLogger } from '../../utils/mockLogger.js';

import { shellExecuteTool } from './shellExecute.js';

const logger = new MockLogger();

describe('shellExecute', () => {
  it('should execute shell commands', async () => {
    const { stdout } = await shellExecuteTool.execute(
      { command: "echo 'test'", description: 'test' },
      { logger, headless: true, workingDirectory: '.', tokenLevel: 'debug' },
    );
    expect(stdout).toContain('test');
  });

  it('should handle command errors', async () => {
    const { error } = await shellExecuteTool.execute(
      { command: 'nonexistentcommand', description: 'test' },
      { logger, headless: true, workingDirectory: '.', tokenLevel: 'debug' },
    );
    expect(error).toContain('Command failed:');
  });
});
