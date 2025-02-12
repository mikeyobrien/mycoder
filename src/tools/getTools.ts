import { subAgentTool } from '../tools/interaction/subAgent.js';
import { readFileTool } from '../tools/io/readFile.js';
import { userPromptTool } from '../tools/interaction/userPrompt.js';
import { sequenceCompleteTool } from '../tools/system/sequenceComplete.js';
import { fetchTool } from '../tools/io/fetch.js';
import { Tool } from '../core/types.js';
import { updateFileTool } from './io/updateFile.js';
import { shellStartTool } from './system/shellStart.js';
import { shellMessageTool } from './system/shellMessage.js';
import { browseMessageTool } from './browser/browseMessage.js';
import { browseStartTool } from './browser/browseStart.js';
import { respawnTool } from './system/respawn.js';

export function getTools(): Tool[] {
  return [
    subAgentTool,
    readFileTool,
    updateFileTool,
    userPromptTool,
    sequenceCompleteTool,
    fetchTool,
    shellStartTool,
    shellMessageTool,
    browseStartTool,
    browseMessageTool,
    respawnTool,
  ] as Tool[];
}
