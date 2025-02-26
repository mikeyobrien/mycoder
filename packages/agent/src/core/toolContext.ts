import { Logger } from "../utils/logger.js";

import { ToolContext } from "./types.js";

export function createToolContext(
  logger: Logger,
  workingDirectory?: string,
): ToolContext {
  return {
    logger,
    workingDirectory,
  };
}

export function loggerToToolContext(
  logger: Logger,
  workingDirectory?: string,
): ToolContext {
  return createToolContext(logger, workingDirectory);
}
