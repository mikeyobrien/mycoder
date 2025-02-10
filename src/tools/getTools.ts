import { subAgentTool } from "../tools/interaction/subAgent.js";
import { shellExecuteTool } from "../tools/system/shellExecute.js";
import { readFileTool } from "../tools/io/readFile.js";
import { userPromptTool } from "../tools/interaction/userPrompt.js";
import { sequenceCompleteTool } from "../tools/system/sequenceComplete.js";
import { fetchTool } from "../tools/io/fetch.js";
import { Tool } from "../core/types.js";
import { updateFileTool } from "./io/updateFile.js";

export async function getTools(): Promise<Tool[]> {
  return [
    subAgentTool,
    readFileTool,
    updateFileTool,
    shellExecuteTool,
    userPromptTool,
    sequenceCompleteTool,
    fetchTool,
  ] as Tool[];
}
