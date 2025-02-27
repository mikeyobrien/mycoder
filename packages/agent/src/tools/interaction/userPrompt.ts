import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { userPrompt } from '../../utils/userPrompt.js';

const parameterSchema = z.object({
  prompt: z.string().describe('The prompt message to display to the user'),
});

const returnSchema = z.string().describe("The user's response");

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const userPromptTool: Tool<Parameters, ReturnType> = {
  name: 'userPrompt',
  description: 'Prompts the user for input and returns their response',
  parameters: zodToJsonSchema(parameterSchema),
  returns: zodToJsonSchema(returnSchema),
  execute: async ({ prompt }, { logger }) => {
    logger.verbose(`Prompting user with: ${prompt}`);

    const response = await userPrompt(prompt);

    logger.verbose(`Received user response: ${response}`);

    return response;
  },
  logParameters: () => {},
  logReturns: () => {},
};
