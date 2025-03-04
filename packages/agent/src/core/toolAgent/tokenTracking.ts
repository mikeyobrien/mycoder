import chalk from 'chalk';

import { TokenTracker, TokenUsage } from '../tokens.js';

/**
 * Enhanced utilities for token tracking and reporting
 */
export function logTokenUsage(tokenTracker: TokenTracker): void {
  console.log(
    chalk.blueBright(`[Token Usage/Agent] ${tokenTracker.toString()}`),
  );
}

/**
 * Creates a child token tracker for a specific tool call
 */
export function createToolTokenTracker(
  toolName: string,
  parentTracker: TokenTracker,
): TokenTracker {
  return new TokenTracker(toolName, parentTracker);
}

/**
 * Gets the total token usage for a token tracker and all its children
 */
export function getTotalTokenUsage(tokenTracker: TokenTracker): TokenUsage {
  return tokenTracker.getTotalUsage();
}

/**
 * Gets the total cost for a token tracker and all its children
 */
export function getTotalTokenCost(tokenTracker: TokenTracker): string {
  return tokenTracker.getTotalCost();
}
