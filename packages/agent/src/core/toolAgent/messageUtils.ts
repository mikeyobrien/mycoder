import { CoreMessage, ToolCallPart } from 'ai';

/**
 * Creates a cache control message from a system prompt
 * This is used for token caching with the Vercel AI SDK
 */
export function createCacheControlMessageFromSystemPrompt(
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
export function addCacheControlToMessages(
  messages: CoreMessage[],
): CoreMessage[] {
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

/**
 * Formats tool calls from the AI into the ToolUseContent format
 */
export function formatToolCalls(toolCalls: any[]): any[] {
  return toolCalls.map((call) => ({
    type: 'tool_use',
    name: call.toolName,
    id: call.toolCallId,
    input: call.args,
  }));
}

/**
 * Creates tool call parts for the assistant message
 */
export function createToolCallParts(toolCalls: any[]): Array<ToolCallPart> {
  return toolCalls.map((toolCall) => ({
    type: 'tool-call',
    toolCallId: toolCall.toolCallId,
    toolName: toolCall.toolName,
    args: toolCall.args,
  }));
}
