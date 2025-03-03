import { anthropic } from '@ai-sdk/anthropic';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

import { MockLogger } from '../utils/mockLogger.js';

import { executeToolCall } from './executeToolCall.js';
import { TokenTracker } from './tokens.js';
import { toolAgent } from './toolAgent.js';
import { Tool, ToolContext } from './types.js';

const toolContext: ToolContext = {
  logger: new MockLogger(),
  headless: true,
  workingDirectory: '.',
  userSession: false,
  pageFilter: 'simple',
  tokenTracker: new TokenTracker(),
};

// Mock configuration for testing
const testConfig = {
  maxIterations: 50,
  model: anthropic('claude-3-7-sonnet-20250219'),
  maxTokens: 4096,
  temperature: 0.7,
  getSystemPrompt: () => 'Test system prompt',
};

// Mock Anthropic client response
const mockResponse = {
  content: [
    {
      type: 'tool_use',
      name: 'sequenceComplete',
      id: '1',
      input: { result: 'Test complete' },
    },
  ],
  usage: { input_tokens: 10, output_tokens: 10 },
  model: 'claude-3-7-sonnet-latest',
  role: 'assistant',
  id: 'msg_123',
};

// Mock Anthropic SDK
const mockCreate = vi.fn().mockImplementation(() => mockResponse);
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: mockCreate,
    };
  },
}));

describe('toolAgent', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

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

  const sequenceCompleteTool: Tool = {
    name: 'sequenceComplete',
    description: 'Completes the sequence',
    parameters: z.object({
      result: z.string().describe('The final result'),
    }),
    returns: z.string().describe('The final result'),
    parametersJsonSchema: {
      type: 'object',
      properties: {
        result: {
          type: 'string',
          description: 'The final result',
        },
      },
      required: ['result'],
    },
    returnsJsonSchema: {
      type: 'string',
      description: 'The final result',
    },
    execute: ({ result }) => Promise.resolve(result),
  };

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

  // Test empty response handling
  it('should handle empty responses by sending a reminder', async () => {
    // Reset the mock and set up the sequence of responses
    mockCreate.mockReset();
    mockCreate
      .mockResolvedValueOnce({
        content: [],
        usage: { input_tokens: 5, output_tokens: 5 },
      })
      .mockResolvedValueOnce(mockResponse);

    const result = await toolAgent(
      'Test prompt',
      [sequenceCompleteTool],
      testConfig,
      toolContext,
    );

    // Verify that create was called twice (once for empty response, once for completion)
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.result).toBe('Test complete');
  });

  // New tests for async system prompt
  it('should handle async system prompt', async () => {
    // Reset mock and set expected response
    mockCreate.mockReset();
    mockCreate.mockResolvedValue(mockResponse);

    const result = await toolAgent(
      'Test prompt',
      [sequenceCompleteTool],
      testConfig,
      toolContext,
    );

    expect(result.result).toBe('Test complete');
  });
});
