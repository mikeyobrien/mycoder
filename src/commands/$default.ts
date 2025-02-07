import * as fs from "fs/promises";
import { createInterface } from "readline/promises";
import { ArgumentsCamelCase } from "yargs";
import { toolAgent } from "../core/toolAgent.js";
import { SharedOptions } from "../options.js";
import { createRequire } from "module";
import { Logger } from "../utils/logger.js";
import { getTools } from "../tools/getTools.js";

import { getAnthropicApiKeyError } from "../utils/errors.js";

interface Options extends SharedOptions {
  prompt?: string;
}

export const command = "* [prompt]";
export const describe = "Execute a prompt or start interactive mode";

export const builder = (yargs) => {
  return yargs.positional("prompt", {
    type: "string",
    description: "The prompt to execute",
  }); // Type assertion needed due to yargs typing complexity
};

export const handler = async (argv: ArgumentsCamelCase<Options>) => {
  const logger = new Logger({ name: "Default", color: "white" });

  try {
    // Early API key check
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.error(getAnthropicApiKeyError());
      process.exit(1);
    }

    let prompt: string | undefined;

    // If promptFile is specified, read from file
    if (argv.file) {
      try {
        prompt = await fs.readFile(argv.file, "utf-8");
      } catch (error) {
        logger.error(`Failed to read prompt file: ${argv.file}`);
        process.exit(1);
      }
    }

    // If interactive mode
    if (argv.interactive) {
      const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      try {
        const require = createRequire(import.meta.url);
        const packageInfo = require("../../package.json");

        logger.info(
          `MyCoder v${packageInfo.version} - AI-powered coding assistant`
        );
        logger.info(
          "Type your request below or 'help' for usage information. Use Ctrl+C to exit."
        );
        prompt = await readline.question("\n> ");
      } finally {
        readline.close();
      }
    } else if (!prompt) {
      // Use command line prompt if provided
      prompt = argv.prompt;
    }

    if (!prompt) {
      logger.error(
        "No prompt provided. Either specify a prompt, use --promptFile, or run in --interactive mode."
      );
      process.exit(1);
    }

    // Add the standard suffix to all prompts
    prompt += [
      "\nPlease ask for clarifications if required or if the tasks is confusing.",
      "Once the task is complete ask the user, via the userPrompt tool if the results are acceptable or if changes are needed or if there are additional follow on tasks.",
    ].join("\n");

    const tools = await getTools();
    const result = await toolAgent(prompt, tools, logger);
    const output =
      typeof result.result === "string"
        ? result.result
        : JSON.stringify(result.result, null, 2);
    logger.info("\n=== Result ===\n", output);
  } catch (error) {
    logger.error("An error occurred:", error);
    process.exit(1);
  }
};
