import { Tool } from "../../core/types.js";
import chalk from "chalk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const parameterSchema = z.object({
  text: z.string().describe("The text to output to the user"),
});

const returnSchema = z.void();

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const userOutputTool: Tool<Parameters, ReturnType> = {
  name: "userOutput",
  description: "Outputs text to the user via stdout",
  parameters: zodToJsonSchema(parameterSchema),
  returns: zodToJsonSchema(returnSchema),
  execute: async ({ text }, { logger }) => {
    logger.verbose(`Outputting text to user: ${text}`);
    console.log(chalk.blue(text));
  },
};
