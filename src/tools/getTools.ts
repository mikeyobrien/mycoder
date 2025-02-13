import { subAgentTool } from './interaction/subAgent.js';
import { readFileTool } from './io/readFile.js';
import { userPromptTool } from './interaction/userPrompt.js';
import { sequenceCompleteTool } from './system/sequenceComplete.js';
import { fetchTool } from './io/fetch.js';
import { Tool } from '../core/types.js';
import { updateFileTool } from './io/updateFile.js';
import { shellStartTool } from './system/shellStart.js';
import { shellMessageTool } from './system/shellMessage.js';
import { browseMessageTool } from './browser/browseMessage.js';
import { browseStartTool } from './browser/browseStart.js';
import { respawnTool } from './system/respawn.js';
import { sleepTool } from './system/sleep.js';

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
    sleepTool,
  ] as Tool[];
}
