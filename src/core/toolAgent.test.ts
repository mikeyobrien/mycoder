/* eslint-disable max-lines-per-function */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { executeToolCall } from "./executeToolCall.js";
import { Tool } from "./types.js";
import { Logger } from "../utils/logger.js";
import { toolAgent } from "./toolAgent.js";

const logger = new Logger({ name: "toolAgent", logLevel: "warn" });

// Mock configuration for testing
const testConfig = {
  maxIterations: 50,
  model: "claude-3-5-sonnet-20241022",
  maxTokens: 4096,
  temperature: 0.7,
  getSystemPrompt: async () => "Test system prompt",
};

// Mock Anthropic client response
const mockResponse = {
  content: [
    {
      type: "tool_use",
      name: "sequenceComplete",
      id: "1",
      input: { result: "Test complete" },
    },
  ],
  usage: { input_tokens: 10, output_tokens: 10 },
};

// Mock Anthropic SDK
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: async () => mockResponse,
    };
  },
}));

describe("toolAgent", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Mock tool for testing
  const mockTool: Tool = {
    name: "mockTool",
    description: "A mock tool for testing",
    parameters: {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "Test input",
        },
      },
      required: ["input"],
    },
    returns: {
      type: "string",
      description: "The processed result",
    },
    execute: async ({ input }) => `Processed: ${input}`,
  };

  const sequenceCompleteTool: Tool = {
    name: "sequenceComplete",
    description: "Completes the sequence",
    parameters: {
      type: "object",
      properties: {
        result: {
          type: "string",
          description: "The final result",
        },
      },
      required: ["result"],
    },
    returns: {
      type: "string",
      description: "The final result",
    },
    execute: async ({ result }) => result,
  };

  it("should execute tool calls", async () => {
    const result = await executeToolCall(
      {
        id: "1",
        name: "mockTool",
        input: { input: "test" },
      },
      [mockTool],
      logger,
    );

    expect(result.includes("Processed: test")).toBeTruthy();
  });

  it("should handle unknown tools", async () => {
    await expect(
      executeToolCall(
        {
          id: "1",
          name: "nonexistentTool",
          input: {},
        },
        [mockTool],
        logger,
      ),
    ).rejects.toThrow("No tool with the name 'nonexistentTool' exists.");
  });

  it("should handle tool execution errors", async () => {
    const errorTool: Tool = {
      name: "errorTool",
      description: "A tool that always fails",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      returns: {
        type: "string",
        description: "Error message",
      },
      execute: async () => {
        throw new Error("Deliberate failure");
      },
    };

    await expect(
      executeToolCall(
        {
          id: "1",
          name: "errorTool",
          input: {},
        },
        [errorTool],
        logger,
      ),
    ).rejects.toThrow("Deliberate failure");
  });

  // New tests for async system prompt
  it("should handle async system prompt", async () => {
    const result = await toolAgent(
      "Test prompt",
      [sequenceCompleteTool],
      logger,
      testConfig,
    );

    expect(result.result).toBe("Test complete");
    expect(result.tokens.input).toBe(10);
    expect(result.tokens.output).toBe(10);
  });
});
