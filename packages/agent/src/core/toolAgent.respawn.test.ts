import { anthropic } from '@ai-sdk/anthropic';
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
        model: anthropic('claude-3-7-sonnet-20250219'),
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
