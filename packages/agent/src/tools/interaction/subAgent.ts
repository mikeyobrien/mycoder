import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { toolAgent } from "../../core/toolAgent.js";
import { Tool } from "../../core/types.js";
import { getTools } from "../getTools.js";

const parameterSchema = z.object({
  description: z
    .string()
    .max(80)
    .describe("A brief description of the sub-agent's purpose (max 80 chars)"),
  goal: z
    .string()
    .describe("The main objective that the sub-agent needs to achieve"),
  requirements: z
    .array(z.string())
    .optional()
    .describe("Specific requirements or constraints that must be met"),
  context: z
    .object({
      workingDirectory: z
        .string()
        .optional()
        .describe("The directory where the sub-agent should operate"),
      relevantFiles: z
        .array(z.string())
        .optional()
        .describe("List of files that are relevant to the task"),
      projectContext: z
        .string()
        .optional()
        .describe("Additional context about the project or environment"),
    })
    .optional(),
  successCriteria: z
    .array(z.string())
    .optional()
    .describe("Specific criteria that indicate successful completion"),
  suggestedApproach: z
    .string()
    .optional()
    .describe("Optional guidance on how to approach the task"),
});

const returnSchema = z
  .string()
  .describe(
    "The response from the sub-agent including its reasoning and tool usage",
  );

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

// Sub-agent specific configuration
const subAgentConfig = {
  maxIterations: 50,
  model: process.env.AGENT_MODEL || "claude-3-opus-20240229",
  maxTokens: 4096,
  temperature: 0.7,
  getSystemPrompt: () => {
    return [
      "You are a focused AI sub-agent handling a specific task.",
      "You have access to the same tools as the main agent but should focus only on your assigned task.",
      "When complete, call the sequenceComplete tool with your results.",
      "Follow any specific conventions or requirements provided in the task context.",
      "Ask the main agent for clarification if critical information is missing.",
    ].join("\n");
  },
};

export const subAgentTool: Tool<Parameters, ReturnType> = {
  name: "subAgent",
  description:
    "Creates a sub-agent that has access to all tools to solve a specific task",
  parameters: zodToJsonSchema(parameterSchema),
  returns: zodToJsonSchema(returnSchema),
  execute: async (params, { logger }) => {
    // Validate parameters
    const { goal, requirements, context, successCriteria, suggestedApproach } =
      parameterSchema.parse(params);

    // Construct a well-structured prompt
    const prompt = [
      `Goal: ${goal}`,
      requirements?.length
        ? `\nRequirements:\n${requirements.map((r) => `- ${r}`).join("\n")}`
        : "",
      context
        ? `\nContext:\n${[
            context.workingDirectory
              ? `- Working Directory: ${context.workingDirectory}`
              : "",
            context.relevantFiles?.length
              ? `- Relevant Files:\n  ${context.relevantFiles.map((f) => `- ${f}`).join("\n  ")}`
              : "",
            context.projectContext
              ? `- Project Context: ${context.projectContext}`
              : "",
          ]
            .filter(Boolean)
            .join("\n")}`
        : "",
      successCriteria?.length
        ? `\nSuccess Criteria:\n${successCriteria.map((c) => `- ${c}`).join("\n")}`
        : "",
      suggestedApproach ? `\nSuggested Approach: ${suggestedApproach}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const tools = getTools().filter((tool) => tool.name !== "userPrompt");

    // Update config if timeout is specified
    const config = {
      ...subAgentConfig,
    };

    const result = await toolAgent(prompt, tools, logger, config);
    return result.result; // Return the result string directly
  },
  logParameters: (input, { logger }) => {
    logger.info(`Delegating task "${input.description}"`);
  },
  logReturns: () => {},
};
