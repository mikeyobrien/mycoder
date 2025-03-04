import { CoreMessage, CoreToolMessage, ToolResultPart } from 'ai';

import { executeToolCall } from '../executeToolCall.js';
import { TokenTracker } from '../tokens.js';

import { Tool, ToolCallResult, ToolContext, ToolUseContent } from './types.js';

/**
 * Executes a list of tool calls and returns the results
 */
export async function executeTools(
  toolCalls: ToolUseContent[],
  tools: Tool[],
  messages: CoreMessage[],
  context: ToolContext,
): Promise<ToolCallResult> {
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
        result: JSON.parse(toolResult),
      } satisfies ToolResultPart;
    }),
  );

  const sequenceCompletedTool = toolResults.find(
    (r) => r.toolName === 'sequenceComplete',
  );
  const completionResult = sequenceCompletedTool
    ? (sequenceCompletedTool.result as { result: string }).result
    : undefined;

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
