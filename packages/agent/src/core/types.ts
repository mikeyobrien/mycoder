import { JsonSchema7Type } from 'zod-to-json-schema';

import { Logger } from '../utils/logger.js';

import { TokenTracker } from './tokens.js';

export type TokenLevel = 'debug' | 'verbose' | 'info' | 'warn' | 'error';

export type ToolContext = {
  logger: Logger;
  workingDirectory: string;
  headless: boolean;
  tokenTracker: TokenTracker;
};

export type Tool<TParams = Record<string, any>, TReturn = any> = {
  name: string;
  description: string;
  parameters: JsonSchema7Type;
  returns: JsonSchema7Type;

  logParameters?: (params: TParams, context: ToolContext) => void;
  logReturns?: (returns: TReturn, context: ToolContext) => void;

  execute: (params: TParams, context: ToolContext) => Promise<TReturn>;
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
