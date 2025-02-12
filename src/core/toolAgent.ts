import Anthropic from "@anthropic-ai/sdk";
import { executeToolCall } from "./executeToolCall.js";
import { Logger } from "../utils/logger.js";
import {
  Tool,
  TextContent,
  ToolUseContent,
  ToolResultContent,
  Message,
} from "./types.js";
import { execSync } from "child_process";

import { getAnthropicApiKeyError } from "../utils/errors.js";

export interface ToolAgentResult {
  result: string;
  tokens: {
    input: number;
    output: number;
  };
  interactions: number;
}

const CONFIG = {
  maxIterations: 50,
  model: "claude-3-5-sonnet-20241022",
  maxTokens: 4096,
  temperature: 0.7,
  getSystemPrompt: async () => {
    // Gather context with error handling
    const getCommandOutput = (command: string, label: string): string => {
      try {
        return execSync(command).toString().trim();
      } catch (error) {
        return `[Error getting ${label}: ${(error as Error).message}]`;
      }
    };

    const context = {
      pwd: getCommandOutput("pwd", "current directory"),
      files: getCommandOutput("ls -la", "file listing"),
      system: getCommandOutput("uname -a", "system information"),
      datetime: new Date().toString(),
    };

    return [
      "You are an AI agent that can use tools to accomplish tasks.",
      "",
      "Current Context:",
      `Directory: ${context.pwd}`,
      "Files:",
      context.files,
      `System: ${context.system}`,
      `DateTime: ${context.datetime}`,
      "",
      "You prefer to call tools in parallel when possible because it leads to faster execution and less resource usage.",
      "When done, call the sequenceComplete tool with your results to indicate that the sequence has completed.",
      "",
      "For coding tasks:",
      "0. Try to break large tasks into smaller sub-tasks that can be completed and verified sequentially.",
      "   - trying to make lots of changes in one go can make it really hard to identify when something doesn't work",
      "   - use sub-agents for each sub-task, leaving the main agent in a supervisory role",
      "   - when possible ensure the project compiles/builds and the tests pass after each sub-task",
      "   - give the sub-agents the guidance and context necessary be successful",
      "1. First understand the context by:",
      "   - Reading README.md, CONTRIBUTING.md, and similar documentation",
      "   - Checking project configuration files (e.g., package.json)",
      "   - Understanding coding standards",
      "2. Ensure changes:",
      "   - Follow project conventions",
      "   - Build successfully",
      "   - Pass all tests",
      "3. Update documentation as needed",
      "4. Consider adding documentation if you encountered setup/understanding challenges",
      "",
      "Feel free to use Google and Bing via the browser tools to search for information or for ideas when you get stuck.",
      "",
      "When you run into issues or unexpected results, take a step back and read the project documentation and configuration files and look at other source files in the project for examples of what works.",
      "",
      "Use sub-agents for parallel tasks, providing them with specific context they need rather than having them rediscover it.",
    ].join("\\n");
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
    if (message.type === "text") {
      content.push({ type: "text", text: message.text });
    } else if (message.type === "tool_use") {
      const toolUse: ToolUseContent = {
        type: "tool_use",
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
  logger: Logger
): Promise<ToolCallResult> {
  if (toolCalls.length === 0) {
    return { sequenceCompleted: false, toolResults: [] };
  }

  logger.verbose(`Executing ${toolCalls.length} tool calls`);

  const results = await Promise.all(
    toolCalls.map(async (call) => {
      let toolResult = "";
      try {
        toolResult = await executeToolCall(call, tools, logger);
      } catch (error: any) {
        toolResult = `Error: Exception thrown during tool execution.  Type: ${error.constructor.name}, Message: ${error.message}`;
      }
      return {
        type: "tool_result" as const,
        tool_use_id: call.id,
        content: toolResult,
        isComplete: call.name === "sequenceComplete",
      };
    })
  );

  const toolResults = results.map(({ type, tool_use_id, content }) => ({
    type,
    tool_use_id,
    content,
  }));

  const sequenceCompleted = results.some((r) => r.isComplete);
  const completionResult = results.find((r) => r.isComplete)?.content;

  messages.push({ role: "user", content: toolResults });

  if (sequenceCompleted) {
    logger.verbose("Sequence completed", { completionResult });
  }

  return { sequenceCompleted, completionResult, toolResults };
}

// eslint-disable-next-line max-lines-per-function
export const toolAgent = async (
  initialPrompt: string,
  tools: Tool[],
  logger: Logger,
  config = CONFIG
): Promise<ToolAgentResult> => {
  logger.verbose("Starting agent execution");
  logger.verbose("Initial prompt:", initialPrompt);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let interactions = 0;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error(getAnthropicApiKeyError());

  const client = new Anthropic({ apiKey });
  const messages: Message[] = [
    {
      role: "user",
      content: [{ type: "text", text: initialPrompt }],
    },
  ];

  logger.debug("User message:", initialPrompt);

  // Get the system prompt once at the start
  const systemPrompt = await config.getSystemPrompt();

  for (let i = 0; i < config.maxIterations; i++) {
    logger.verbose(
      `Requesting completion ${i + 1} with ${messages.length} messages with ${
        JSON.stringify(messages).length
      } bytes`
    );

    interactions++;
    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages,
      system: systemPrompt,
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters as Anthropic.Tool.InputSchema,
      })),
      tool_choice: { type: "auto" },
    });

    if (!response.content.length) {
      const result = {
        result:
          "Agent returned empty message implying it is done its given task",
        tokens: {
          input: totalInputTokens,
          output: totalOutputTokens,
        },
        interactions,
      };
      logger.verbose(
        `Agent completed with ${result.tokens.input} input tokens, ${result.tokens.output} output tokens in ${result.interactions} interactions`
      );
      return result;
    }

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;
    logger.verbose(
      `  Token usage: ${response.usage.input_tokens} input, ${response.usage.output_tokens} output`
    );

    const { content, toolCalls } = processResponse(response);
    messages.push({ role: "assistant", content });

    // Log the assistant's message
    const assistantMessage = content
      .filter((c) => c.type === "text")
      .map((c) => (c as TextContent).text)
      .join("\\n");
    if (assistantMessage) {
      logger.info(assistantMessage);
    }

    const { sequenceCompleted, completionResult } = await executeTools(
      toolCalls,
      tools,
      messages,
      logger
    );

    if (sequenceCompleted) {
      const result = {
        result:
          completionResult ??
          "Sequence explicitly completed with an empty result",
        tokens: {
          input: totalInputTokens,
          output: totalOutputTokens,
        },
        interactions,
      };
      logger.verbose(
        `Agent completed with ${result.tokens.input} input tokens, ${result.tokens.output} output tokens in ${result.interactions} interactions`
      );
      return result;
    }
  }

  logger.warn("Maximum iterations reached");
  const result = {
    result: "Maximum sub-agent iterations reach without successful completion",
    tokens: {
      input: totalInputTokens,
      output: totalOutputTokens,
    },
    interactions,
  };
  logger.verbose(
    `Agent completed with ${result.tokens.input} input tokens, ${result.tokens.output} output tokens in ${result.interactions} interactions`
  );
  return result;
};
