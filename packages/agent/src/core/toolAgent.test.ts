import { anthropic } from '@ai-sdk/anthropic';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

import { MockLogger } from '../utils/mockLogger.js';

import { executeToolCall } from './executeToolCall.js';
import { TokenTracker } from './tokens.js';
import { Tool, ToolContext } from './types.js';

const toolContext: ToolContext = {
  logger: new MockLogger(),
  headless: true,
  workingDirectory: '.',
  userSession: false,
  pageFilter: 'simple',
  tokenTracker: new TokenTracker(),
};

// Mock tool for testing
const mockTool: Tool = {
  name: 'mockTool',
  description: 'A mock tool for testing',
  parameters: z.object({
    input: z.string().describe('Test input'),
  }),
  returns: z.string().describe('The processed result'),
  parametersJsonSchema: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Test input',
      },
    },
    required: ['input'],
  },
  returnsJsonSchema: {
    type: 'string',
    description: 'The processed result',
  },
  execute: ({ input }) => Promise.resolve(`Processed: ${input}`),
};

const errorTool: Tool = {
  name: 'errorTool',
  description: 'A tool that always fails',
  parameters: z.object({}),
  returns: z.string().describe('Error message'),
  parametersJsonSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  returnsJsonSchema: {
    type: 'string',
    description: 'Error message',
  },
  execute: () => {
    throw new Error('Deliberate failure');
  },
};

describe('toolAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should execute tool calls', async () => {
    const result = await executeToolCall(
      {
        id: '1',
        name: 'mockTool',
        input: { input: 'test' },
      },
      [mockTool],
      toolContext,
    );

    expect(result.includes('Processed: test')).toBeTruthy();
  });

  it('should handle unknown tools', async () => {
    await expect(
      executeToolCall(
        {
          id: '1',
          name: 'nonexistentTool',
          input: {},
        },
        [mockTool],
        toolContext,
      ),
    ).rejects.toThrow("No tool with the name 'nonexistentTool' exists.");
  });

  it('should handle tool execution errors', async () => {
    await expect(
      executeToolCall(
        {
          id: '1',
          name: 'errorTool',
          input: {},
        },
        [errorTool],
        toolContext,
      ),
    ).rejects.toThrow('Deliberate failure');
  });
});
