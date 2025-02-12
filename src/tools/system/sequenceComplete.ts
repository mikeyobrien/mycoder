import { Tool } from '../../core/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const parameterSchema = z.object({
  result: z.string().describe('The final result to return from the tool agent'),
});

const returnSchema = z
  .string()
  .describe('This is returned to the caller of the tool agent.');

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const sequenceCompleteTool: Tool<Parameters, ReturnType> = {
  name: 'sequenceComplete',
  description: 'Completes the tool use sequence and returns the final result',
  parameters: zodToJsonSchema(parameterSchema),
  returns: zodToJsonSchema(returnSchema),
  execute: ({ result }) =>  Promise.resolve(result),
  logParameters: () => {},
  logReturns: (output, { logger }) => {
    logger.info(`Completed: ${output}`);
  },
};
