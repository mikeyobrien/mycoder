import { Logger } from '../utils/logger.js';

import { Tool, ToolCall, ToolContext } from './types.js';

const OUTPUT_LIMIT = 12 * 1024; // 10KB limit

/**
 * Executes a tool call and returns the formatted result
 */
export const executeToolCall = async (
  toolCall: ToolCall,
  tools: Tool[],
  context: ToolContext,
): Promise<string> => {
  const tool = tools.find((t) => t.name === toolCall.name);
  if (!tool) {
    throw new Error(`No tool with the name '${toolCall.name}' exists.`);
  }

  const logger = new Logger({
    name: `Tool:${toolCall.name}`,
    parent: context.logger,
    customPrefix: tool.logPrefix,
  });

  const toolContext = {
    ...context,
    logger,
  };

  // for each parameter log it and its name
  if (tool.logParameters) {
    tool.logParameters(toolCall.input, toolContext);
  } else {
    logger.info('Parameters:');
    Object.entries(toolCall.input).forEach(([name, value]) => {
      logger.info(`  - ${name}: ${JSON.stringify(value).substring(0, 60)}`);
    });
  }

  // TODO: validate JSON schema for input
  const output = await tool.execute(toolCall.input, toolContext);

  // for each result log it and its name
  if (tool.logReturns) {
    tool.logReturns(output, toolContext);
  } else {
    logger.info('Results:');
    if (typeof output === 'string') {
      logger.info(`  - ${output}`);
    } else if (typeof output === 'object') {
      Object.entries(output).forEach(([name, value]) => {
        logger.info(`  - ${name}: ${JSON.stringify(value).substring(0, 60)}`);
      });
    }
  }

  const toolOutput =
    typeof output === 'string' ? output : JSON.stringify(output, null, 2);
  return toolOutput.length > OUTPUT_LIMIT
    ? `${toolOutput.slice(0, OUTPUT_LIMIT)}...(truncated)`
    : toolOutput;
};
