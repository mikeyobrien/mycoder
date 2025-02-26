import { describe, it, expect } from 'vitest';

import { Logger } from '../../utils/logger';

import { respawnTool } from './respawn';

describe('respawnTool', () => {
  const mockLogger = new Logger({ name: 'test' });

  it('should have correct name and description', () => {
    expect(respawnTool.name).toBe('respawn');
    expect(respawnTool.description).toContain('Resets the agent context');
  });

  it('should execute and return confirmation message', async () => {
    const result = await respawnTool.execute(
      { respawnContext: 'new context' },
      {
        logger: mockLogger,
        headless: true,
        workingDirectory: '.',
        tokenLevel: 'debug',
      },
    );
    expect(result).toBe('Respawn initiated');
  });
});
