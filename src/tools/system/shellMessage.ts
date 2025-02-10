import { Tool } from "../../core/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Define valid NodeJS signals as a union type
type NodeSignals =
  | 'SIGABRT'
  | 'SIGALRM'
  | 'SIGBUS'
  | 'SIGCHLD'
  | 'SIGCONT'
  | 'SIGFPE'
  | 'SIGHUP'
  | 'SIGILL'
  | 'SIGINT'
  | 'SIGIO'
  | 'SIGIOT'
  | 'SIGKILL'
  | 'SIGPIPE'
  | 'SIGPOLL'
  | 'SIGPROF'
  | 'SIGPWR'
  | 'SIGQUIT'
  | 'SIGSEGV'
  | 'SIGSTKFLT'
  | 'SIGSTOP'
  | 'SIGSYS'
  | 'SIGTERM'
  | 'SIGTRAP'
  | 'SIGTSTP'
  | 'SIGTTIN'
  | 'SIGTTOU'
  | 'SIGUNUSED'
  | 'SIGURG'
  | 'SIGUSR1'
  | 'SIGUSR2'
  | 'SIGVTALRM'
  | 'SIGWINCH'
  | 'SIGXCPU'
  | 'SIGXFSZ';

const parameterSchema = z.object({
  instanceId: z.string().describe("The ID returned by shellStart"),
  stdin: z.string().optional().describe("Input to send to process"),
  signal: z.enum([
    'SIGABRT', 'SIGALRM', 'SIGBUS', 'SIGCHLD', 'SIGCONT',
    'SIGFPE', 'SIGHUP', 'SIGILL', 'SIGINT', 'SIGIO',
    'SIGIOT', 'SIGKILL', 'SIGPIPE', 'SIGPOLL', 'SIGPROF',
    'SIGPWR', 'SIGQUIT', 'SIGSEGV', 'SIGSTKFLT', 'SIGSTOP',
    'SIGSYS', 'SIGTERM', 'SIGTRAP', 'SIGTSTP', 'SIGTTIN',
    'SIGTTOU', 'SIGUNUSED', 'SIGURG', 'SIGUSR1', 'SIGUSR2',
    'SIGVTALRM', 'SIGWINCH', 'SIGXCPU', 'SIGXFSZ'
  ] as const).optional().describe("Signal to send to the process (e.g., SIGTERM, SIGINT)"),
  description: z
    .string()
    .max(80)
    .describe("The reason for this shell interaction (max 80 chars)"),
});

const returnSchema = z
  .object({
    stdout: z.string(),
    stderr: z.string(),
    completed: z.boolean(),
    error: z.string().optional(),
    signaled: z.boolean().optional(),
  })
  .describe(
    "Process interaction results including stdout, stderr, and completion status"
  );

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const shellMessageTool: Tool<Parameters, ReturnType> = {
  name: "shellMessage",
  description:
    "Interacts with a running shell process, sending input and receiving output",
  parameters: zodToJsonSchema(parameterSchema),
  returns: zodToJsonSchema(returnSchema),

  execute: async ({ instanceId, stdin, signal }, { logger }): Promise<ReturnType> => {
    logger.verbose(
      `Interacting with shell process ${instanceId}${stdin ? " with input" : ""}${signal ? ` with signal ${signal}` : ""}`
    );

    try {
      const process = global.startedProcesses.get(instanceId);
      if (!process) {
        throw new Error(`No process found with ID ${instanceId}`);
      }

      const processOutput = global.processOutputs.get(instanceId);
      if (!processOutput) {
        throw new Error(`No output buffers found for process ${instanceId}`);
      }

      const processState = global.processState.get(instanceId);
      if (!processState) {
        throw new Error(`No state information found for process ${instanceId}`);
      }

      // Send signal if provided
      if (signal) {
        const wasKilled = process.kill(signal);
        if (!wasKilled) {
          return {
            stdout: "",
            stderr: "",
            completed: processState.completed,
            signaled: false,
            error: `Failed to send signal ${signal} to process (process may have already terminated)`
          };
        }
        processState.signaled = true;
      }

      // Send input if provided
      if (stdin) {
        if (!process.stdin?.writable) {
          throw new Error("Process stdin is not available");
        }
        process.stdin.write(`${stdin}\n`);
      }

      // Wait a brief moment for output to be processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get accumulated output
      const stdout = processOutput.stdout.join("");
      const stderr = processOutput.stderr.join("");

      // Clear the buffers
      processOutput.stdout = [];
      processOutput.stderr = [];

      logger.verbose("Interaction completed successfully");
      if (stdout) {
        logger.verbose(`stdout: ${stdout.trim()}`);
      }
      if (stderr) {
        logger.verbose(`stderr: ${stderr.trim()}`);
      }

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        completed: processState.completed,
        signaled: processState.signaled,
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.verbose(`Process interaction failed: ${error.message}`);

        return {
          stdout: "",
          stderr: "",
          completed: false,
          error: error.message,
        };
      }

      const errorMessage = String(error);
      logger.error(`Unknown error during process interaction: ${errorMessage}`);
      return {
        stdout: "",
        stderr: "",
        completed: false,
        error: `Unknown error occurred: ${errorMessage}`,
      };
    }
  },

  logParameters: (input, { logger }) => {
    logger.info(
      `Interacting with process ${input.instanceId}, ${input.description}`
    );
  },
  logReturns: () => {},
};
