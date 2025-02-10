import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { processStates, shellStartTool } from "./shellStart.js";
import { MockLogger } from "../../utils/mockLogger.js";
import { shellMessageTool } from "./shellMessage.js";

// eslint-disable-next-line max-lines-per-function
describe("shellMessageTool", () => {
  const mockLogger = new MockLogger();

  let testInstanceId = "";

  beforeEach(() => {
    processStates.clear();
  });

  afterEach(() => {
    for (const processState of processStates.values()) {
      processState.process.kill();
    }
    processStates.clear();
  });

  it("should interact with a running process", async () => {
    // Start a test process
    const startResult = await shellStartTool.execute(
      {
        command: "cat", // cat will echo back input
        description: "Test interactive process",
      },
      { logger: mockLogger }
    );

    testInstanceId = startResult.instanceId;

    // Send input and get response
    const result = await shellMessageTool.execute(
      {
        instanceId: testInstanceId,
        stdin: "hello world",
        description: "Test interaction",
      },
      { logger: mockLogger }
    );

    expect(result.stdout).toBe("hello world");
    expect(result.stderr).toBe("");
    expect(result.completed).toBe(false);
  });

  it("should handle nonexistent process", async () => {
    const result = await shellMessageTool.execute(
      {
        instanceId: "nonexistent-id",
        description: "Test invalid process",
      },
      { logger: mockLogger }
    );

    expect(result.error).toBeDefined();
    expect(result.completed).toBe(false);
  });

  it("should handle process completion", async () => {
    // Start a quick process
    const startResult = await shellStartTool.execute(
      {
        command: 'echo "test" && exit',
        description: "Test completion",
      },
      { logger: mockLogger }
    );

    // Wait a moment for process to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    const result = await shellMessageTool.execute(
      {
        instanceId: startResult.instanceId,
        description: "Check completion",
      },
      { logger: mockLogger }
    );

    expect(result.completed).toBe(true);
    // Process should still be in processStates even after completion
    expect(processStates.has(startResult.instanceId)).toBe(true);
  });

  it("should handle SIGTERM signal correctly", async () => {
    // Start a long-running process
    const startResult = await shellStartTool.execute(
      {
        command: "sleep 10",
        description: "Test SIGTERM handling",
      },
      { logger: mockLogger }
    );

    const result = await shellMessageTool.execute(
      {
        instanceId: startResult.instanceId,
        signal: "SIGTERM",
        description: "Send SIGTERM",
      },
      { logger: mockLogger }
    );
    expect(result.signaled).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const result2 = await shellMessageTool.execute(
      {
        instanceId: startResult.instanceId,
        description: "Check on status",
      },
      { logger: mockLogger }
    );

    expect(result2.completed).toBe(true);
    expect(result2.error).toBeUndefined();
  });

  it("should handle signals on terminated process gracefully", async () => {
    // Start a process
    const startResult = await shellStartTool.execute(
      {
        command: "sleep 1",
        description: "Test signal handling on terminated process",
      },
      { logger: mockLogger }
    );

    // Wait for process to complete
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Try to send signal to completed process
    const result = await shellMessageTool.execute(
      {
        instanceId: startResult.instanceId,
        signal: "SIGTERM",
        description: "Send signal to terminated process",
      },
      { logger: mockLogger }
    );

    expect(result.error).toBeDefined();
    expect(result.signaled).toBe(false);
    expect(result.completed).toBe(true);
  });

  it("should verify signaled flag after process termination", async () => {
    // Start a process
    const startResult = await shellStartTool.execute(
      {
        command: "sleep 5",
        description: "Test signal flag verification",
      },
      { logger: mockLogger }
    );

    // Send SIGTERM
    await shellMessageTool.execute(
      {
        instanceId: startResult.instanceId,
        signal: "SIGTERM",
        description: "Send SIGTERM",
      },
      { logger: mockLogger }
    );

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Check process state after signal
    const checkResult = await shellMessageTool.execute(
      {
        instanceId: startResult.instanceId,
        description: "Check signal state",
      },
      { logger: mockLogger }
    );

    expect(checkResult.signaled).toBe(true);
    expect(checkResult.completed).toBe(true);
    expect(processStates.has(startResult.instanceId)).toBe(true);
  });
});
