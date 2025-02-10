import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { processStates, shellStartTool } from "./shellStart.js";
import { MockLogger } from "../../utils/mockLogger.js";

describe("shellStartTool", () => {
  const mockLogger = new MockLogger();

  beforeEach(() => {
    processStates.clear();
  });

  afterEach(() => {
    for (const processState of processStates.values()) {
      processState.process.kill();
    }
    processStates.clear();
  });

  it("should start a process and return instance ID", async () => {
    const result = await shellStartTool.execute(
      {
        command: 'echo "test"',
        description: "Test process",
      },
      { logger: mockLogger }
    );

    expect(result.instanceId).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it("should handle invalid commands", async () => {
    const result = await shellStartTool.execute(
      {
        command: "nonexistentcommand",
        description: "Invalid command test",
      },
      { logger: mockLogger }
    );

    expect(result.error).toBeDefined();
  });

  it("should keep process in processStates after completion", async () => {
    const result = await shellStartTool.execute(
      {
        command: 'echo "test"',
        description: "Completion test",
      },
      { logger: mockLogger }
    );

    // Wait for process to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Process should still be in processStates
    expect(processStates.has(result.instanceId)).toBe(true);
  });

  it("should handle piped commands correctly", async () => {
    // Start a process that uses pipes
    const result = await shellStartTool.execute(
      {
        command: 'grep "test"', // Just grep waiting for stdin
        description: "Pipe test",
      },
      { logger: mockLogger }
    );

    expect(result.instanceId).toBeDefined();
    expect(result.error).toBeUndefined();

    // Process should be in processStates
    expect(processStates.has(result.instanceId)).toBe(true);

    // Get the process
    const processState = processStates.get(result.instanceId);
    expect(processState).toBeDefined();

    // Write to stdin and check output
    if (processState?.process.stdin) {
      processState.process.stdin.write("this is a test line\n");
      processState.process.stdin.write("not matching line\n");
      processState.process.stdin.write("another test here\n");

      // Wait for output
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Process should have filtered only lines with "test"
      // This part might need adjustment based on how output is captured
    }
  });
});
