import { describe, it, expect, vi } from 'vitest';
import { respawnTool } from '../../src/tools/system/respawn.js';
import { Logger } from '../../src/utils/logger.js';

describe('respawnTool', () => {
  const mockLogger = new Logger({ name: 'test' });

  it('should have correct name and description', () => {
    expect(respawnTool.name).toBe('respawn');
    expect(respawnTool.description).toContain('Resets the agent context');
  });

  it('should have correct parameter schema', () => {
    expect(respawnTool.parameters.type).toBe('object');
    expect(respawnTool.parameters.properties.respawnContext).toBeDefined();
    expect(respawnTool.parameters.required).toContain('respawnContext');
  });

  it('should execute and return confirmation message', async () => {
    const result = await respawnTool.execute(
      { respawnContext: 'new context' },
      { logger: mockLogger },
    );
    expect(result).toBe('Respawn initiated');
  });
});
