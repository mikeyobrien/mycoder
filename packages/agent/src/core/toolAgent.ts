import { execSync } from 'child_process';

import Anthropic from '@anthropic-ai/sdk';
import { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages/messages.js';
import chalk from 'chalk';

import { getAnthropicApiKeyError } from '../utils/errors.js';

import { executeToolCall } from './executeToolCall.js';
import { TokenTracker, TokenUsage } from './tokens.js';
import {
  Tool,
  TextContent,
  ToolUseContent,
  ToolResultContent,
  Message,
  ToolContext,
} from './types.js';

export interface ToolAgentResult {
  result: string;
  interactions: number;
}

const CONFIG = {
  maxIterations: 200,
  model: 'claude-3-7-sonnet-latest',
  maxTokens: 4096,
  temperature: 0.7,
  getSystemPrompt: () => {
    // Gather context with error handling
    const getCommandOutput = (command: string, label: string): string => {
      try {
        return execSync(command).toString().trim();
      } catch (error) {
        return `[Error getting ${label}: ${(error as Error).message}]`;
      }
    };

    const context = {
      pwd: getCommandOutput('pwd', 'current directory'),
      files: getCommandOutput('ls -la', 'file listing'),
      system: getCommandOutput('uname -a', 'system information'),
      datetime: new Date().toString(),
    };

    return [
      'You are an AI agent that can use tools to accomplish tasks.',
      '',
      'Current Context:',
      `Directory: ${context.pwd}`,
      'Files:',
      context.files,
      `System: ${context.system}`,
      `DateTime: ${context.datetime}`,
      '',
      'You prefer to call tools in parallel when possible because it leads to faster execution and less resource usage.',
      'When done, call the sequenceComplete tool with your results to indicate that the sequence has completed.',
      '',
      'For coding tasks:',
      '0. Try to break large tasks into smaller sub-tasks that can be completed and verified sequentially.',
      "   - trying to make lots of changes in one go can make it really hard to identify when something doesn't work",
      '   - use sub-agents for each sub-task, leaving the main agent in a supervisory role',
      '   - when possible ensure the project compiles/builds and the tests pass after each sub-task',
      '   - give the sub-agents the guidance and context necessary be successful',
      '1. First understand the context by:',
      '   - Reading README.md, CONTRIBUTING.md, and similar documentation',
      '   - Checking project configuration files (e.g., package.json)',
      '   - Understanding coding standards',
      '2. Ensure changes:',
      '   - Follow project conventions',
      '   - Build successfully',
      '   - Pass all tests',
      '3. Update documentation as needed',
      '4. Consider adding documentation if you encountered setup/understanding challenges',
      '',
      'Feel free to use Google and Bing via the browser tools to search for information or for ideas when you get stuck.',
      '',
      'When you run into issues or unexpected results, take a step back and read the project documentation and configuration files and look at other source files in the project for examples of what works.',
      '',
      'Use sub-agents for parallel tasks, providing them with specific context they need rather than having them rediscover it.',
    ].join('\\n');
  },
};

interface ToolCallResult {
  sequenceCompleted: boolean;
  completionResult?: string;
  toolResults: ToolResultContent[];
}

function processResponse(response: Anthropic.Message) {
  const content: (TextContent | ToolUseContent)[] = [];
  const toolCalls: ToolUseContent[] = [];

  for (const message of response.content) {
    if (message.type === 'text') {
      content.push({ type: 'text', text: message.text });
    } else if (message.type === 'tool_use') {
      const toolUse: ToolUseContent = {
        type: 'tool_use',
        name: message.name,
        id: message.id,
        input: message.input,
      };
      content.push(toolUse);
      toolCalls.push(toolUse);
    }
  }

  return { content, toolCalls };
}

async function executeTools(
  toolCalls: ToolUseContent[],
  tools: Tool[],
  messages: Message[],
  context: ToolContext,
): Promise<ToolCallResult & { respawn?: { context: string } }> {
  if (toolCalls.length === 0) {
    return { sequenceCompleted: false, toolResults: [] };
  }

  const { logger } = context;

  logger.verbose(`Executing ${toolCalls.length} tool calls`);

  // Check for respawn tool call
  const respawnCall = toolCalls.find((call) => call.name === 'respawn');
  if (respawnCall) {
    return {
      sequenceCompleted: false,
      toolResults: [
        {
          type: 'tool_result',
          tool_use_id: respawnCall.id,
          content: 'Respawn initiated',
        },
      ],
      respawn: {
        context: respawnCall.input.respawnContext,
      },
    };
  }

  const results = await Promise.all(
    toolCalls.map(async (call) => {
      let toolResult = '';
      try {
        toolResult = await executeToolCall(call, tools, {
          ...context,
          tokenTracker: new TokenTracker(call.name, context.tokenTracker),
        });
      } catch (error: any) {
        toolResult = `Error: Exception thrown during tool execution.  Type: ${error.constructor.name}, Message: ${error.message}`;
      }
      return {
        type: 'tool_result' as const,
        tool_use_id: call.id,
        content: toolResult,
        isComplete: call.name === 'sequenceComplete',
      };
    }),
  );

  const toolResults = results.map(({ type, tool_use_id, content }) => ({
    type,
    tool_use_id,
    content,
  }));

  const sequenceCompleted = results.some((r) => r.isComplete);
  const completionResult = results.find((r) => r.isComplete)?.content;

  messages.push({
    role: 'user',
    content: toolResults,
  });

  if (sequenceCompleted) {
    logger.verbose('Sequence completed', { completionResult });
  }

  return { sequenceCompleted, completionResult, toolResults };
}

// a function that takes a list of messages and returns a list of messages but with the last message having a cache_control of ephemeral
function addCacheControlToTools<T>(messages: T[]): T[] {
  return messages.map((m, i) => ({
    ...m,
    ...(i === messages.length - 1
      ? { cache_control: { type: 'ephemeral' } }
      : {}),
  }));
}

function addCacheControlToContentBlocks(
  content: ContentBlockParam[],
): ContentBlockParam[] {
  return content.map((c, i) => {
    if (i === content.length - 1) {
      if (
        c.type === 'text' ||
        c.type === 'document' ||
        c.type === 'image' ||
        c.type === 'tool_use' ||
        c.type === 'tool_result' ||
        c.type === 'thinking' ||
        c.type === 'redacted_thinking'
      ) {
        return { ...c, cache_control: { type: 'ephemeral' } };
      }
    }
    return c;
  });
}
function addCacheControlToMessages(
  messages: Anthropic.Messages.MessageParam[],
): Anthropic.Messages.MessageParam[] {
  return messages.map((m, i) => {
    if (typeof m.content === 'string') {
      return {
        ...m,
        content: [
          {
            type: 'text',
            text: m.content,
            cache_control: { type: 'ephemeral' },
          },
        ] as ContentBlockParam[],
      };
    }
    return {
      ...m,
      content:
        i >= messages.length - 2
          ? addCacheControlToContentBlocks(m.content)
          : m.content,
    };
  });
}

export const toolAgent = async (
  initialPrompt: string,
  tools: Tool[],
  config = CONFIG,
  context: ToolContext,
): Promise<ToolAgentResult> => {
  const { logger, tokenTracker } = context;

  logger.verbose('Starting agent execution');
  logger.verbose('Initial prompt:', initialPrompt);

  let interactions = 0;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error(getAnthropicApiKeyError());

  const client = new Anthropic({ apiKey });
  const messages: Message[] = [
    {
      role: 'user',
      content: [{ type: 'text', text: initialPrompt }],
    },
  ];

  logger.debug('User message:', initialPrompt);

  // Get the system prompt once at the start
  const systemPrompt = config.getSystemPrompt();

  for (let i = 0; i < config.maxIterations; i++) {
    logger.verbose(
      `Requesting completion ${i + 1} with ${messages.length} messages with ${
        JSON.stringify(messages).length
      } bytes`,
    );

    interactions++;

    // Create request parameters
    const requestParams: Anthropic.MessageCreateParams = {
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: addCacheControlToMessages(messages),
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: addCacheControlToTools(
        tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters as Anthropic.Tool.InputSchema,
        })),
      ),
      tool_choice: { type: 'auto' },
    };

    const response = await client.messages.create(requestParams);

    if (!response.content.length) {
      // Instead of treating empty response as completion, remind the agent
      logger.verbose('Received empty response from agent, sending reminder');
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'I notice you sent an empty response. If you are done with your tasks, please call the sequenceComplete tool with your results. If you are waiting for other tools to complete, you can use the sleep tool to wait before checking again.',
          },
        ],
      });
      continue;
    }

    // Track both regular and cached token usage
    const tokenUsagePerMessage = TokenUsage.fromMessage(response);
    tokenTracker.tokenUsage.add(tokenUsagePerMessage);

    const { content, toolCalls } = processResponse(response);
    messages.push({
      role: 'assistant',
      content,
    });

    // Log the assistant's message
    const assistantMessage = content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\\n');
    if (assistantMessage) {
      logger.info(assistantMessage);
    }

    logger.log(
      tokenTracker.logLevel,
      chalk.blue(`[Token Usage/Message] ${tokenUsagePerMessage.toString()}`),
    );

    const { sequenceCompleted, completionResult, respawn } = await executeTools(
      toolCalls,
      tools,
      messages,
      context,
    );

    if (respawn) {
      logger.info('Respawning agent with new context');
      // Reset messages to just the new context
      messages.length = 0;
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: respawn.context }],
      });
      continue;
    }

    if (sequenceCompleted) {
      const result = {
        result:
          completionResult ??
          'Sequence explicitly completed with an empty result',
        interactions,
      };
      logger.log(
        tokenTracker.logLevel,
        chalk.blueBright(`[Token Usage/Agent] ${tokenTracker.toString()}`),
      );
      return result;
    }
  }

  logger.warn('Maximum iterations reached');
  const result = {
    result: 'Maximum sub-agent iterations reach without successful completion',
    interactions,
  };
  // Use the appropriate log level based on tokenUsage flag
  logger.log(
    tokenTracker.logLevel,
    chalk.blueBright(`[Token Usage/Agent] ${tokenTracker.toString()}`),
  );
  return result;
};
