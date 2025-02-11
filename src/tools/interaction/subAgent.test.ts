import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { subAgentTool } from "./subAgent.js";
import { MockLogger } from "../../utils/mockLogger.js";

const logger = new MockLogger();

// Mock Anthropic client response
const mockResponse = {
  content: [
    {
      type: "tool_use",
      name: "sequenceComplete",
      id: "1",
      input: { result: "Sub-agent task complete" },
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

describe("subAgent", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should create and execute a sub-agent", async () => {
    const result = await subAgentTool.execute(
      {
        prompt: "Test sub-agent task",
        description: "A test agent for unit testing",
      },
      { logger },
    );

    expect(result.toString()).toContain("Sub-agent task complete");
  });

  it("should handle errors gracefully", async () => {
    // Remove API key to trigger error
    delete process.env.ANTHROPIC_API_KEY;

    await expect(
      subAgentTool.execute(
        {
          prompt: "Test task",
          description: "An agent that should fail",
        },
        { logger },
      ),
    ).rejects.toThrow("ANTHROPIC_API_KEY environment variable is not set");
  });

  it("should validate description length", async () => {
    const longDescription =
      "This is a very long description that exceeds the maximum allowed length of 80 characters and should cause validation to fail";

    await expect(
      subAgentTool.execute(
        {
          prompt: "Test task",
          description: longDescription,
        },
        { logger },
      ),
    ).rejects.toThrow();
  });
});
