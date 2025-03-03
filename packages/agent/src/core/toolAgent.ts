import { execSync } from 'child_process';

import { anthropic } from '@ai-sdk/anthropic';
import {
  CoreMessage,
  CoreToolMessage,
  generateText,
  ToolResultPart,
  ToolSet,
  tool as makeTool,
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
        toolResult = `Error: Exception thrown during tool execution.  Type: ${error.constructor.name}, Message: ${error.message}`;
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
  const completionResult = sequenceCompletedTool?.result as string;

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

/*
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
}*/

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
    const generateTextProps = {
      model: config.model,
      temperature: config.temperature,
      messages,
      system: systemPrompt,
      tools: toolSet,
    };
    const { text, reasoning, reasoningDetails, toolCalls, toolResults } =
      await generateText(generateTextProps);

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
