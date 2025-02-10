import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import { Tool } from "../../core/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { v4 as uuidv4 } from "uuid";

// Define ProcessState type
type ProcessState = {
  process: ChildProcess;

  stdout: string[];
  stderr: string[];

  state: {
    completed: boolean;
    signaled: boolean;
  };
};

// Global map to store process state

export const processStates: Map<string, ProcessState> = new Map();

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
    "Starts a long-running shell command and returns a process instance ID, progress can be checked with shellMessage command",
  parameters: zodToJsonSchema(parameterSchema),
  returns: zodToJsonSchema(returnSchema),

  execute: async ({ command }, { logger }): Promise<ReturnType> => {
    logger.verbose(`Starting shell command: ${command}`);

    return new Promise((resolve) => {
      try {
        const instanceId = uuidv4();
        let hasResolved = false;

        // Split command into command and args
        // Use command directly with shell: true
        const process = spawn(command, [], { shell: true });

        const processState: ProcessState = {
          process,
          stdout: [],
          stderr: [],
          state: { completed: false, signaled: false },
        };

        // Initialize combined process state
        processStates.set(instanceId, processState);

        // Handle process events
        if (process.stdout)
          process.stdout.on("data", (data) => {
            const output = data.toString();
            processState.stdout.push(output);
            logger.verbose(`[${instanceId}] stdout: ${output.trim()}`);
          });

        if (process.stderr)
          process.stderr.on("data", (data) => {
            const output = data.toString();
            processState.stderr.push(output);
            logger.verbose(`[${instanceId}] stderr: ${output.trim()}`);
          });

        process.on("error", (error) => {
          logger.error(`[${instanceId}] Process error: ${error.message}`);
          processState.state.completed = true;
          if (!hasResolved) {
            hasResolved = true;
            resolve({
              instanceId,
              stdout: processState.stdout.join("").trim(),
              stderr: processState.stderr.join("").trim(),
              error: error.message,
            });
          }
        });

        process.on("exit", (code, signal) => {
          logger.verbose(
            `[${instanceId}] Process exited with code ${code} and signal ${signal}`
          );

          processState.state.completed = true;
          processState.state.signaled = signal !== null;

          if (code !== 0 && !hasResolved) {
            hasResolved = true;

            resolve({
              instanceId,
              stdout: processState.stdout.join("").trim(),
              stderr: processState.stderr.join("").trim(),
              error: `Process exited with code ${code}${signal ? ` and signal ${signal}` : ""}`,
            });
          }
        });

        // Set timeout to return initial results
        setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            resolve({
              instanceId,
              stdout: processState.stdout.join("").trim(),
              stderr: processState.stderr.join("").trim(),
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
