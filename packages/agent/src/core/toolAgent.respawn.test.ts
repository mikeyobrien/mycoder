import { describe, it, expect, vi, beforeEach } from 'vitest';

import { toolAgent } from '../../src/core/toolAgent.js';
import { getTools } from '../../src/tools/getTools.js';
import { MockLogger } from '../utils/mockLogger.js';

import { TokenTracker } from './tokens.js';
import { ToolContext } from './types.js';

const toolContext: ToolContext = {
  logger: new MockLogger(),
  headless: true,
  workingDirectory: '.',
  userSession: false,
  pageFilter: 'simple',
  tokenTracker: new TokenTracker(),
};
// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi
          .fn()
          .mockResolvedValueOnce({
            content: [
              {
                type: 'tool_use',
                name: 'respawn',
                id: 'test-id',
                input: { respawnContext: 'new context' },
              },
            ],
            usage: { input_tokens: 10, output_tokens: 10 },
          })
          .mockResolvedValueOnce({
            content: [],
            usage: { input_tokens: 5, output_tokens: 5 },
          }),
      },
    })),
  };
});

describe('toolAgent respawn functionality', () => {
  const tools = getTools();

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.clearAllMocks();
  });

  it('should handle respawn tool calls', async () => {
    const result = await toolAgent(
      'initial prompt',
      tools,
      {
        maxIterations: 2, // Need at least 2 iterations for respawn + empty response
        model: 'test-model',
        maxTokens: 100,
        temperature: 0,
        getSystemPrompt: () => 'test system prompt',
      },
      toolContext,
    );

    expect(result.result).toBe(
      'Maximum sub-agent iterations reach without successful completion',
    );
  });
});
