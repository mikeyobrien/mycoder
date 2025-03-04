import { CoreMessage } from 'ai';

// Re-export all types from the original types.ts file
export * from '../types.js';

// Only define new types specific to toolAgent here
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
