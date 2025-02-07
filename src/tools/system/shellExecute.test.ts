import { describe, it, expect } from "vitest";
import { Logger } from "../../utils/logger.js";
import { shellExecuteTool } from "./shellExecute.js";

const logger = new Logger({ name: "shellExecute" });

describe("shellExecute", () => {
  it("should execute shell commands", async () => {
    const { stdout } = await shellExecuteTool.execute(
      { command: "echo 'test'", description: "test" },
      { logger }
    );
    expect(stdout).toContain("test");
  });

  it("should handle command errors", async () => {
    const { error } = await shellExecuteTool.execute(
      { command: "nonexistentcommand", description: "test" },
      { logger }
    );
    expect(error).toContain("command not found");
  });
});
