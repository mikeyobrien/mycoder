import { describe, it, expect } from "vitest";
import { shellExecuteTool } from "./shellExecute.js";
import { MockLogger } from "../../utils/mockLogger.js";

const logger = new MockLogger();

describe("shellExecute", () => {
  it("should execute shell commands", async () => {
    const { stdout } = await shellExecuteTool.execute(
      { command: "echo 'test'", description: "test" },
      { logger },
    );
    expect(stdout).toContain("test");
  });

  it("should handle command errors", async () => {
    const { error } = await shellExecuteTool.execute(
      { command: "nonexistentcommand", description: "test" },
      { logger },
    );
    expect(error).toContain("Command failed:");
  });
});
