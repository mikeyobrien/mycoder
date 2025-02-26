import { Tool } from "../core/types.js";

import { browseMessageTool } from "./browser/browseMessage.js";
import { browseStartTool } from "./browser/browseStart.js";
import { subAgentTool } from "./interaction/subAgent.js";
import { userPromptTool } from "./interaction/userPrompt.js";
import { fetchTool } from "./io/fetch.js";
import { readFileTool } from "./io/readFile.js";
import { updateFileTool } from "./io/updateFile.js";
import { respawnTool } from "./system/respawn.js";
import { sequenceCompleteTool } from "./system/sequenceComplete.js";
import { shellMessageTool } from "./system/shellMessage.js";
import { shellStartTool } from "./system/shellStart.js";
import { sleepTool } from "./system/sleep.js";

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
