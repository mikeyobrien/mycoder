import * as readline from "readline";

import chalk from "chalk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { Tool } from "../../core/types.js";

const parameterSchema = z.object({
  prompt: z.string().describe("The prompt message to display to the user"),
});

const returnSchema = z.string().describe("The user's response");

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const userPromptTool: Tool<Parameters, ReturnType> = {
  name: "userPrompt",
  description: "Prompts the user for input and returns their response",
  parameters: zodToJsonSchema(parameterSchema),
  returns: zodToJsonSchema(returnSchema),
  execute: async ({ prompt }, { logger }) => {
    logger.verbose(`Prompting user with: ${prompt}`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    // Disable the readline interface's internal input processing
    if (rl.terminal) {
      process.stdin.setRawMode(false);
    }

    const response = await new Promise<string>((resolve) => {
      rl.question(chalk.green(prompt + " "), (answer) => {
        resolve(answer);
      });
    });

    logger.verbose(`Received user response: ${response}`);

    rl.close();
    return response;
  },
  logParameters: () => {},
  logReturns: () => {},
};
