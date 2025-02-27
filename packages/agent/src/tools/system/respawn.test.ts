import { describe, it, expect } from 'vitest';

import { TokenTracker } from '../../core/tokens';
import { MockLogger } from '../../utils/mockLogger';

import { respawnTool } from './respawn';

const toolContext = {
  logger: new MockLogger(),
  headless: true,
  workingDirectory: '.',
  tokenTracker: new TokenTracker(),
};
describe('respawnTool', () => {
  it('should have correct name and description', () => {
    expect(respawnTool.name).toBe('respawn');
    expect(respawnTool.description).toContain('Resets the agent context');
  });

  it('should execute and return confirmation message', async () => {
    const result = await respawnTool.execute(
      { respawnContext: 'new context' },
      toolContext,
    );
    expect(result).toBe('Respawn initiated');
  });
});
