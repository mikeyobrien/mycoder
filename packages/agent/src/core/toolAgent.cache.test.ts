import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MockLogger } from '../utils/mockLogger.js';

import { toolAgent } from './toolAgent.js';

const logger = new MockLogger();

process.env.ANTHROPIC_API_KEY = 'sk-ant-api03-1234567890';

// Mock Anthropic client
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockImplementation(() => {
          return {
            id: 'msg_123',
            model: 'claude-3-7-sonnet-latest',
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: 'I will help with that.',
              },
              {
                type: 'tool_use',
                id: 'tu_123',
                name: 'sequenceComplete',
                input: {
                  result: 'Test complete',
                },
              },
            ],
            usage: {
              input_tokens: 100,
              output_tokens: 50,
              // Simulating cached tokens
              cache_read_input_tokens: 30,
              cache_creation_input_tokens: 70,
            },
          };
        }),
      };
      constructor() {}
    },
  };
});

// Mock tool
const mockTool = {
  name: 'sequenceComplete',
  description: 'Completes the sequence',
  parameters: {
    type: 'object' as const,
    properties: {
      result: {
        type: 'string' as const,
      },
    },
    additionalProperties: false,
    required: ['result'],
  },
  returns: {
    type: 'string' as const,
  },
  execute: vi.fn().mockImplementation(async (params) => {
    console.log('   Parameters:');
    Object.entries(params).forEach(([key, value]) => {
      console.log(`     - ${key}: ${JSON.stringify(value)}`);
    });
    console.log();
    console.log('   Results:');
    console.log(`     - ${params.result}`);
    console.log();
    return params.result;
  }),
};

describe('toolAgent input token caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track cached tokens in the result', async () => {
    const result = await toolAgent('test prompt', [mockTool], undefined, {
      logger,
      headless: true,
      workingDirectory: '.',
      tokenLevel: 'debug',
    });

    // Verify that cached tokens are tracked
    expect(result.tokens.inputCacheReads).toBeDefined();
    expect(result.tokens.inputCacheReads).toBe(30);

    // Verify total token counts
    expect(result.tokens.input).toBe(100);
    expect(result.tokens.output).toBe(50);
  });
});
