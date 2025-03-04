import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool, ToolContext } from '../../core/types.js';

export interface RespawnInput {
  respawnContext: string;
}

const parameterSchema = z.object({
  respawnContext: z.string().describe('The context to keep after respawning'),
});

const returnSchema = z.object({
  result: z
    .string()
    .describe('A message indicating that the respawn has been initiated'),
});

export const respawnTool: Tool = {
  name: 'respawn',
  description:
    'Resets the agent context to just the system prompt and provided context',
  logPrefix: '🔄',
  parameters: parameterSchema,
  returns: returnSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returnsJsonSchema: zodToJsonSchema(returnSchema),
  execute: (
    _params: Record<string, any>,
    _context: ToolContext,
  ): Promise<string> => {
    // This is a special case tool - the actual respawn logic is handled in toolAgent
    return Promise.resolve('Respawn initiated');
  },
};
