import { execSync } from 'child_process';

import { anthropic } from '@ai-sdk/anthropic';
import {
  CoreMessage,
  CoreToolMessage,
  generateText,
  ToolResultPart,
  ToolSet,
  tool as makeTool,
  ToolCallPart,
} from 'ai';
import chalk from 'chalk';

import { getAnthropicApiKeyError } from '../utils/errors.js';

import { executeToolCall } from './executeToolCall.js';
import { TokenTracker } from './tokens.js';
import {
  Tool,
  ToolUseContent,
  ToolResultContent,
  ToolContext,
} from './types.js';

export interface ToolAgentResult {
  result: string;
  interactions: number;
}

const CONFIG = {
  maxIterations: 200,
  model: anthropic('claude-3-7-sonnet-20250219'),
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
  toolResults: ToolResultPart[];
}
/*
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
*/

type ErrorResult = {
  errorMessage: string;
  errorType: string;
};

async function executeTools(
  toolCalls: ToolUseContent[],
  tools: Tool[],
  messages: CoreMessage[],
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
          type: 'tool-result',
          toolCallId: respawnCall.id,
          toolName: respawnCall.name,
          result: { success: true },
        } satisfies ToolResultPart,
      ],
      respawn: {
        context: respawnCall.input.respawnContext,
      },
    };
  }

  const toolResults: ToolResultPart[] = await Promise.all(
    toolCalls.map(async (call) => {
      let toolResult = '';
      try {
        toolResult = await executeToolCall(call, tools, {
          ...context,
          tokenTracker: new TokenTracker(call.name, context.tokenTracker),
        });
      } catch (error: any) {
        toolResult = JSON.stringify({
          errorMessage: error.message,
          errorType: error.constructor.name,
        });
      }

      return {
        type: 'tool-result',
        toolCallId: call.id,
        toolName: call.name,
        result: JSON.parse(toolResult) satisfies ToolResultContent,
      } satisfies ToolResultPart;
    }),
  );

  const sequenceCompletedTool = toolResults.find(
    (r) => r.toolName === 'sequenceComplete',
  );
  const completionResult = (sequenceCompletedTool?.result as { result: string })
    .result;

  messages.push({
    role: 'tool',
    content: toolResults,
  } satisfies CoreToolMessage);

  if (sequenceCompletedTool) {
    logger.verbose('Sequence completed', { completionResult });
  }

  return {
    sequenceCompleted: sequenceCompletedTool !== undefined,
    completionResult,
    toolResults,
  };
}

function createCacheControlMessageFromSystemPrompt(
  systemPrompt: string,
): CoreMessage {
  return {
    role: 'system',
    content: systemPrompt,
    providerOptions: {
      anthropic: { cacheControl: { type: 'ephemeral' } },
    },
  };
}

/**
 * Adds cache control to the messages for token caching with the Vercel AI SDK
 * This marks the last two messages as ephemeral which allows the conversation up to that
 * point to be cached (with a ~5 minute window), reducing token usage when making multiple API calls
 */
function addCacheControlToMessages(messages: CoreMessage[]): CoreMessage[] {
  if (messages.length <= 1) return messages;

  // Create a deep copy of the messages array to avoid mutating the original
  const result = JSON.parse(JSON.stringify(messages)) as CoreMessage[];

  // Get the last two messages (if available)
  const lastTwoMessageIndices = [messages.length - 1, messages.length - 2];

  // Add providerOptions with anthropic cache control to the last two messages
  lastTwoMessageIndices.forEach((index) => {
    if (index >= 0) {
      const message = result[index];
      if (message) {
        // For the Vercel AI SDK, we need to add the providerOptions.anthropic property
        // with cacheControl: 'ephemeral' to enable token caching
        message.providerOptions = {
          ...message.providerOptions,
          anthropic: { cacheControl: { type: 'ephemeral' } },
        };
      }
    }
  });

  return result;
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

  //  const client = new Anthropic({ apiKey });
  const messages: CoreMessage[] = [
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

    const toolSet: ToolSet = {};
    tools.forEach((tool) => {
      toolSet[tool.name] = makeTool({
        description: tool.description,
        parameters: tool.parameters,
      });
    });
    // Apply cache control to messages for token caching
    const messagesWithCacheControl = [
      createCacheControlMessageFromSystemPrompt(systemPrompt),
      ...addCacheControlToMessages(messages),
    ];

    const generateTextProps = {
      model: config.model,
      temperature: config.temperature,
      messages: messagesWithCacheControl,
      tools: toolSet,
    };
    const { text, toolCalls, ...other } = await generateText(generateTextProps);

    //console.log(
    //  'providerMetadata',
    //  JSON.stringify(other.providerMetadata, null, 2),
    //);
    //console.log('other data', JSON.stringify(other, null, 2));

    const localToolCalls: ToolUseContent[] = toolCalls.map((call) => ({
      type: 'tool_use',
      name: call.toolName,
      id: call.toolCallId,
      input: call.args,
    }));

    if (!text.length) {
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
    //const tokenUsagePerMessage = TokenUsage.fromMessage(response);
    //tokenTracker.tokenUsage.add(tokenUsagePerMessage);

    messages.push({
      role: 'assistant',
      content: [{ type: 'text', text: text }],
    });

    if (text) {
      logger.info(text);
    }

    if (toolCalls.length > 0) {
      const toolCallParts: Array<ToolCallPart> = toolCalls.map((toolCall) => ({
        type: 'tool-call',
        toolCallId: toolCall.toolCallId,
        toolName: toolCall.toolName,
        args: toolCall.args,
      }));

      messages.push({
        role: 'assistant',
        content: toolCallParts,
      });
    }

    /*logger.log(
      tokenTracker.logLevel,
      chalk.blue(`[Token Usage/Message] ${tokenUsagePerMessage.toString()}`),
    );*/

    const { sequenceCompleted, completionResult, respawn } = await executeTools(
      localToolCalls,
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
      const result: ToolAgentResult = {
        result: completionResult ?? 'Sequence explicitly completed',
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
