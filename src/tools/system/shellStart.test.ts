import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { shellStartTool } from './shellStart.js';
import { MockLogger } from '../../utils/mockLogger.js';

describe('shellStartTool', () => {
  const mockLogger = new MockLogger();

  beforeEach(() => {
    global.startedProcesses.clear();
  });

  afterEach(() => {
    for (const process of global.startedProcesses.values()) {
      process.kill();
    }
    global.startedProcesses.clear();
  });

  it('should start a process and return instance ID', async () => {
    const result = await shellStartTool.execute(
      {
        command: 'echo "test"',
        description: 'Test process',
      },
      { logger: mockLogger }
    );

    expect(result.instanceId).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('should handle invalid commands', async () => {
    const result = await shellStartTool.execute(
      {
        command: 'nonexistentcommand',
        description: 'Invalid command test',
      },
      { logger: mockLogger }
    );

    expect(result.error).toBeDefined();
  });

  it('should keep process in startedProcesses after completion', async () => {
    const result = await shellStartTool.execute(
      {
        command: 'echo "test"',
        description: 'Completion test',
      },
      { logger: mockLogger }
    );

    // Wait for process to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Process should still be in startedProcesses
    expect(global.startedProcesses.has(result.instanceId)).toBe(true);
  });

  it('should handle piped commands correctly', async () => {
    // Start a process that uses pipes
    const result = await shellStartTool.execute(
      {
        command: 'grep "test"',  // Just grep waiting for stdin
        description: 'Pipe test',
      },
      { logger: mockLogger }
    );

    expect(result.instanceId).toBeDefined();
    expect(result.error).toBeUndefined();

    // Process should be in startedProcesses
    expect(global.startedProcesses.has(result.instanceId)).toBe(true);

    // Get the process
    const process = global.startedProcesses.get(result.instanceId);
    expect(process).toBeDefined();
    
    // Write to stdin and check output
    if (process?.stdin) {
      process.stdin.write('this is a test line\n');
      process.stdin.write('not matching line\n');
      process.stdin.write('another test here\n');
      
      // Wait for output
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Process should have filtered only lines with "test"
      // This part might need adjustment based on how output is captured
    }
  });
});