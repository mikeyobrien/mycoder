import { z } from 'zod';
import { JsonSchema7Type } from 'zod-to-json-schema';
import { CoreMessage } from 'ai';

import { Logger } from '../../utils/logger.js';
import { TokenTracker } from '../tokens.js';

// Re-export existing types from the original types.ts
export type TokenLevel = 'debug' | 'verbose' | 'info' | 'warn' | 'error';
export type pageFilter = 'simple' | 'none' | 'readability';

export type ToolContext = {
  logger: Logger;
  workingDirectory: string;
  headless: boolean;
  userSession: boolean;
  pageFilter: pageFilter;
  tokenTracker: TokenTracker;
};

export type Tool<TParams = Record<string, any>, TReturn = any> = {
  name: string;
  description: string;
  parameters: z.ZodType<TParams>;
  returns: z.ZodType<TReturn>;
  logPrefix?: string;

  logParameters?: (params: TParams, context: ToolContext) => void;
  logReturns?: (returns: TReturn, context: ToolContext) => void;

  execute: (params: TParams, context: ToolContext) => Promise<TReturn>;

  // Keep JsonSchema7Type for backward compatibility and Vercel AI SDK integration
  parametersJsonSchema?: JsonSchema7Type;
  returnsJsonSchema?: JsonSchema7Type;
};

export type ToolCall = {
  id: string;
  name: string;
  input: any;
};

export type TextContent = {
  type: 'text';
  text: string;
};

export type ToolUseContent = {
  type: 'tool_use';
} & ToolCall;

export type AssistantMessage = {
  role: 'assistant';
  content: (TextContent | ToolUseContent)[];
};

export type ToolResultContent = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
};

export type UserMessage = {
  role: 'user';
  content: (TextContent | ToolResultContent)[];
};

export type Message = AssistantMessage | UserMessage;

// New types specific to toolAgent
export interface ToolAgentResult {
  result: string;
  interactions: number;
}

export interface ToolCallResult {
  sequenceCompleted: boolean;
  completionResult?: string;
  toolResults: any[];
  respawn?: { context: string };
}

export type ErrorResult = {
  errorMessage: string;
  errorType: string;
};
