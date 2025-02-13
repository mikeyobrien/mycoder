import { Tool, ToolContext } from '../../core/types.js';

export interface RespawnInput {
  respawnContext: string;
}

export const respawnTool: Tool = {
  name: 'respawn',
  description:
    'Resets the agent context to just the system prompt and provided context',
  parameters: {
    type: 'object',
    properties: {
      respawnContext: {
        type: 'string',
        description: 'The context to keep after respawning',
      },
    },
    required: ['respawnContext'],
    additionalProperties: false,
  },
  returns: {
    type: 'string',
    description: 'A message indicating that the respawn has been initiated',
  },
  execute: async (
    params: Record<string, any>,
    context: ToolContext,
  ): Promise<string> => {
    // This is a special case tool - the actual respawn logic is handled in toolAgent
    return 'Respawn initiated';
  },
};
