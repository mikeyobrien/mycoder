import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { MockLogger } from '../../utils/mockLogger.js';
import { sleep } from '../../utils/sleep.js';

import { shellMessageTool, NodeSignals } from './shellMessage.js';
import { processStates, shellStartTool } from './shellStart.js';

const logger = new MockLogger();

// Helper function to get instanceId from shellStart result
const getInstanceId = (
  result: Awaited<ReturnType<typeof shellStartTool.execute>>,
) => {
  if (result.mode === 'async') {
    return result.instanceId;
  }
  throw new Error('Expected async mode result');
};

describe('shellMessageTool', () => {
  let testInstanceId = '';

  beforeEach(() => {
    processStates.clear();
  });

  afterEach(() => {
    for (const processState of processStates.values()) {
      processState.process.kill();
    }
    processStates.clear();
  });

  it('should interact with a running process', async () => {
    // Start a test process - force async mode with timeout
    const startResult = await shellStartTool.execute(
      {
        command: 'cat', // cat will echo back input
        description: 'Test interactive process',
        timeout: 50, // Force async mode for interactive process
      },
      { logger },
    );

    testInstanceId = getInstanceId(startResult);

    // Send input and get response
    const result = await shellMessageTool.execute(
      {
        instanceId: testInstanceId,
        stdin: 'hello world',
        description: 'Test interaction',
      },
      { logger },
    );

    expect(result.stdout).toBe('hello world');
    expect(result.stderr).toBe('');
    expect(result.completed).toBe(false);
  });

  it('should handle nonexistent process', async () => {
    const result = await shellMessageTool.execute(
      {
        instanceId: 'nonexistent-id',
        description: 'Test invalid process',
      },
      { logger },
    );

    expect(result.error).toBeDefined();
    expect(result.completed).toBe(false);
  });

  it('should handle process completion', async () => {
    // Start a quick process - force async mode
    const startResult = await shellStartTool.execute(
      {
        command: 'echo "test" && sleep 0.1',
        description: 'Test completion',
        timeout: 0, // Force async mode
      },
      { logger },
    );

    const instanceId = getInstanceId(startResult);

    // Wait a moment for process to complete
    await sleep(150);

    const result = await shellMessageTool.execute(
      {
        instanceId,
        description: 'Check completion',
      },
      { logger },
    );

    expect(result.completed).toBe(true);
    // Process should still be in processStates even after completion
    expect(processStates.has(instanceId)).toBe(true);
  });

  it('should handle SIGTERM signal correctly', async () => {
    // Start a long-running process
    const startResult = await shellStartTool.execute(
      {
        command: 'sleep 10',
        description: 'Test SIGTERM handling',
        timeout: 0, // Force async mode
      },
      { logger },
    );

    const instanceId = getInstanceId(startResult);

    const result = await shellMessageTool.execute(
      {
        instanceId,
        signal: NodeSignals.SIGTERM,
        description: 'Send SIGTERM',
      },
      { logger },
    );
    expect(result.signaled).toBe(true);

    await sleep(50);

    const result2 = await shellMessageTool.execute(
      {
        instanceId,
        description: 'Check on status',
      },
      { logger },
    );

    expect(result2.completed).toBe(true);
    expect(result2.error).toBeUndefined();
  });

  it('should handle signals on terminated process gracefully', async () => {
    // Start a process
    const startResult = await shellStartTool.execute(
      {
        command: 'sleep 1',
        description: 'Test signal handling on terminated process',
        timeout: 0, // Force async mode
      },
      { logger },
    );

    const instanceId = getInstanceId(startResult);

    // Try to send signal to completed process
    const result = await shellMessageTool.execute(
      {
        instanceId,
        signal: NodeSignals.SIGTERM,
        description: 'Send signal to terminated process',
      },
      { logger },
    );

    expect(result.signaled).toBe(true);
    expect(result.completed).toBe(true);
  });

  it('should verify signaled flag after process termination', async () => {
    // Start a process
    const startResult = await shellStartTool.execute(
      {
        command: 'sleep 5',
        description: 'Test signal flag verification',
        timeout: 0, // Force async mode
      },
      { logger },
    );

    const instanceId = getInstanceId(startResult);

    // Send SIGTERM
    await shellMessageTool.execute(
      {
        instanceId,
        signal: NodeSignals.SIGTERM,
        description: 'Send SIGTERM',
      },
      { logger },
    );

    await sleep(50);

    // Check process state after signal
    const checkResult = await shellMessageTool.execute(
      {
        instanceId,
        description: 'Check signal state',
      },
      { logger },
    );

    expect(checkResult.signaled).toBe(true);
    expect(checkResult.completed).toBe(true);
    expect(processStates.has(instanceId)).toBe(true);
  });
});
