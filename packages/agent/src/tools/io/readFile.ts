import * as fs from 'fs/promises';
import * as path from 'path';

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';

const OUTPUT_LIMIT = 10 * 1024; // 10KB limit

const parameterSchema = z.object({
  path: z.string().describe('Path to the file to read'),
  range: z
    .object({
      start: z.number(),
      end: z.number(),
    })
    .optional()
    .describe('Range of bytes to read'),
  maxSize: z
    .number()
    .optional()
    .describe(
      'Maximum size to read, prevents reading arbitrarily large files that blow up the context window, max is 10KB',
    ),
  description: z
    .string()
    .max(80)
    .describe('The reason you are reading this file (max 80 chars)'),
});

const returnSchema = z.object({
  path: z.string(),
  content: z.string().optional(),
  size: z.number(),
  range: z
    .object({
      start: z.number(),
      end: z.number(),
    })
    .optional(),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const readFileTool: Tool<Parameters, ReturnType> = {
  name: 'readFile',
  description: 'Reads file content within size limits and optional range',
  parameters: zodToJsonSchema(parameterSchema),
  returns: zodToJsonSchema(returnSchema),
  execute: async (
    { path: filePath, range, maxSize = OUTPUT_LIMIT },
    context,
  ) => {
    const normalizedPath = path.normalize(filePath);
    const absolutePath = path.isAbsolute(normalizedPath)
      ? normalizedPath
      : context?.workingDirectory
        ? path.join(context.workingDirectory, normalizedPath)
        : path.resolve(normalizedPath);
    const stats = await fs.stat(absolutePath);

    const readSize = range ? range.end - range.start : stats.size;
    if (readSize > maxSize) {
      throw new Error(
        `Requested size ${readSize} bytes exceeds maximum ${maxSize} bytes, make a request for a subset of the file using the range parameter`,
      );
    }

    if (range) {
      const fileHandle = await fs.open(absolutePath);
      try {
        const buffer = Buffer.alloc(readSize);
        const { bytesRead } = await fileHandle.read(
          buffer,
          0,
          readSize,
          range.start,
        );
        return {
          path: filePath,
          content: buffer.toString('utf8', 0, bytesRead),
          size: stats.size,
          range,
        };
      } finally {
        await fileHandle.close();
      }
    }

    return {
      path: filePath,
      content: await fs.readFile(absolutePath, 'utf8'),
      size: stats.size,
    };
  },
  logParameters: (input, { logger }) => {
    logger.info(` 📖 Reading "${input.path}", ${input.description}`);
  },
  logReturns: () => {},
};
