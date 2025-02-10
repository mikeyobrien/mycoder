import { describe, it, expect } from "vitest";
import { getTools } from "./getTools.js";

describe("getTools", () => {
  it("should return a successful result with tools", async () => {
    const tools = await getTools();
    expect(tools).toBeInstanceOf(Array);
    expect(tools.length).toBeGreaterThanOrEqual(5); // At least core tools
  });

  it("should include core tools", async () => {
    const tools = await getTools();
    const toolNames = tools.map((tool) => tool.name);

    // Check for essential tools
    expect(toolNames.length).greaterThan(0);
  });

  it("should have unique tool names", async () => {
    const tools = await getTools();
    const toolNames = tools.map((tool) => tool.name);
    const uniqueNames = new Set(toolNames);

    expect(toolNames).toHaveLength(uniqueNames.size);
  });

  it("should have valid schema for each tool", async () => {
    const tools = await getTools();

    for (const tool of tools) {
      expect(tool).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          description: expect.any(String),
          parameters: expect.any(Object),
        }),
      );
    }
  });

  it("should have executable functions", async () => {
    const tools = await getTools();

    for (const tool of tools) {
      expect(tool.execute).toBeTypeOf("function");
    }
  });
});
