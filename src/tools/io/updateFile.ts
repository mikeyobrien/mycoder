import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { Tool } from '../../core/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const updateOperationSchema = z.discriminatedUnion('command', [
  z.object({
    command: z.literal('update'),
    oldStr: z.string().describe('Existing text to replace (must be unique)'),
    newStr: z.string().describe('New text to insert'),
  }),
  z.object({
    command: z.literal('rewrite'),
    content: z.string().describe('Complete new file content'),
  }),
  z.object({
    command: z.literal('append'),
    content: z.string().describe('Content to append to file'),
  }),
]);

const parameterSchema = z.object({
  path: z.string().describe('Path to the file'),
  operation: updateOperationSchema.describe('Update operation to perform'),
  description: z
    .string()
    .max(80)
    .describe('The reason you are modifying this file (max 80 chars)'),
});

const returnSchema = z.object({
  path: z.string().describe('Path to the updated file'),
  operation: z.enum(['update', 'rewrite', 'append']),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const updateFileTool: Tool<Parameters, ReturnType> = {
  name: 'updateFile',
  description:
    'Creates a file or updates a file by rewriting, patching, or appending content',
  parameters: zodToJsonSchema(parameterSchema),
  returns: zodToJsonSchema(returnSchema),
  execute: async ({ path: filePath, operation }, { logger }) => {
    const absolutePath = path.resolve(path.normalize(filePath));
    logger.verbose(`Updating file: ${absolutePath}`);

    await fsPromises.mkdir(path.dirname(absolutePath), { recursive: true });

    if (operation.command === 'update') {
      const content = await fsPromises.readFile(absolutePath, 'utf8');
      const occurrences = content.split(operation.oldStr).length - 1;
      if (occurrences !== 1) {
        throw new Error(
          `Found ${occurrences} occurrences of oldStr, expected exactly 1`,
        );
      }
      await fsPromises.writeFile(
        absolutePath,
        content.replace(operation.oldStr, operation.newStr),
        'utf8',
      );
    } else if (operation.command === 'append') {
      await fsPromises.appendFile(absolutePath, operation.content, 'utf8');
    } else {
      await fsPromises.writeFile(absolutePath, operation.content, 'utf8');
    }

    logger.verbose(`Operation complete: ${operation.command}`);
    return { path: filePath, operation: operation.command };
  },
  logParameters: (input, { logger }) => {
    const isFile = fs.existsSync(input.path);
    logger.info(
      `${isFile ? 'Modifying' : 'Creating'} "${input.path}", ${input.description}`,
    );
  },
  logReturns: () => {},
};
