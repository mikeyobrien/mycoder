import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import { Tool } from "../../core/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { v4 as uuidv4 } from "uuid";

// Global maps to store process state
declare global {
  var startedProcesses: Map<string, ChildProcess>;
  var processOutputs: Map<string, { stdout: string[]; stderr: string[] }>;
  var processState: Map<string, { completed: boolean; signaled: boolean }>;
}

if (!global.startedProcesses) {
  global.startedProcesses = new Map<string, ChildProcess>();
}

if (!global.processOutputs) {
  global.processOutputs = new Map<string, { stdout: string[]; stderr: string[] }>();
}

if (!global.processState) {
  global.processState = new Map<string, { completed: boolean; signaled: boolean }>();
}

const parameterSchema = z.object({
  command: z.string().describe("The shell command to execute"),
  description: z
    .string()
    .max(80)
    .describe("The reason this shell command is being run (max 80 chars)"),
});

const returnSchema = z
  .object({
    instanceId: z.string(),
    stdout: z.string(),
    stderr: z.string(),
    error: z.string().optional(),
  })
  .describe("Process start results including instance ID and initial output");

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const shellStartTool: Tool<Parameters, ReturnType> = {
  name: "shellStart",
  description:
    "Starts a long-running shell command and returns a process instance ID",
  parameters: zodToJsonSchema(parameterSchema),
  returns: zodToJsonSchema(returnSchema),

  // eslint-disable-next-line max-lines-per-function
  execute: async ({ command }, { logger }): Promise<ReturnType> => {
    logger.verbose(`Starting shell command: ${command}`);

    // eslint-disable-next-line max-lines-per-function
    return new Promise((resolve) => {
      try {
        const instanceId = uuidv4();
        let hasResolved = false;

        // Initialize output buffers and process state
        global.processOutputs.set(instanceId, { stdout: [], stderr: [] });
        global.processState.set(instanceId, { completed: false, signaled: false });

        // Split command into command and args
        // Use command directly with shell: true
        const process = spawn(command, [], { shell: true });

        // Handle process events
        if (process.stdout)
          process.stdout.on("data", (data) => {
            const output = data.toString();
            const processOutput = global.processOutputs.get(instanceId);
            if (processOutput) {
              processOutput.stdout.push(output);
            }
            logger.verbose(`[${instanceId}] stdout: ${output.trim()}`);
          });

        if (process.stderr)
          process.stderr.on("data", (data) => {
            const output = data.toString();
            const processOutput = global.processOutputs.get(instanceId);
            if (processOutput) {
              processOutput.stderr.push(output);
            }
            logger.verbose(`[${instanceId}] stderr: ${output.trim()}`);
          });

        process.on("error", (error) => {
          logger.error(`[${instanceId}] Process error: ${error.message}`);
          const state = global.processState.get(instanceId);
          if (state) {
            state.completed = true;
          }
          if (!hasResolved) {
            hasResolved = true;
            const outputs = global.processOutputs.get(instanceId) || { stdout: [], stderr: [] };
            resolve({
              instanceId,
              stdout: outputs.stdout.join("").trim(),
              stderr: outputs.stderr.join("").trim(),
              error: error.message,
            });
          }
        });

        process.on("exit", (code, signal) => {
          logger.verbose(`[${instanceId}] Process exited with code ${code} and signal ${signal}`);
          const state = global.processState.get(instanceId);
          if (state) {
            state.completed = true;
            state.signaled = signal !== null;
          }
          if (code !== 0 && !hasResolved) {
            hasResolved = true;
            const outputs = global.processOutputs.get(instanceId) || { stdout: [], stderr: [] };
            resolve({
              instanceId,
              stdout: outputs.stdout.join("").trim(),
              stderr: outputs.stderr.join("").trim(),
              error: `Process exited with code ${code}${signal ? ` and signal ${signal}` : ""}`,
            });
          }
        });

        // Store process in global map
        global.startedProcesses.set(instanceId, process);

        // Set timeout to return initial results
        setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            const outputs = global.processOutputs.get(instanceId) || { stdout: [], stderr: [] };
            resolve({
              instanceId,
              stdout: outputs.stdout.join("").trim(),
              stderr: outputs.stderr.join("").trim(),
            });
          }
        }, 1000); // Wait 1 second for initial output
      } catch (error) {
        logger.error(`Failed to start process: ${error}`);
        resolve({
          instanceId: "",
          stdout: "",
          stderr: "",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  },

  logParameters: (input, { logger }) => {
    logger.info(`Starting "${input.command}", ${input.description}`);
  },
  logReturns: (output, { logger }) => {
    logger.info(`Process started with instance ID: ${output.instanceId}`);
  },
};
