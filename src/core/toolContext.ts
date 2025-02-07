import { Logger } from "../utils/logger.js";
import { ToolContext } from "./types.js";

export function createToolContext(logger: Logger): ToolContext {
  return {
    logger,
  };
}

export function loggerToToolContext(logger: Logger): ToolContext {
  return createToolContext(logger);
}
