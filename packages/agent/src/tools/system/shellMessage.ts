import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { sleep } from '../../utils/sleep.js';

import { processStates } from './shellStart.js';

// Define NodeJS signals as an enum
export enum NodeSignals {
  SIGABRT = 'SIGABRT',
  SIGALRM = 'SIGALRM',
  SIGBUS = 'SIGBUS',
  SIGCHLD = 'SIGCHLD',
  SIGCONT = 'SIGCONT',
  SIGFPE = 'SIGFPE',
  SIGHUP = 'SIGHUP',
  SIGILL = 'SIGILL',
  SIGINT = 'SIGINT',
  SIGIO = 'SIGIO',
  SIGIOT = 'SIGIOT',
  SIGKILL = 'SIGKILL',
  SIGPIPE = 'SIGPIPE',
  SIGPOLL = 'SIGPOLL',
  SIGPROF = 'SIGPROF',
  SIGPWR = 'SIGPWR',
  SIGQUIT = 'SIGQUIT',
  SIGSEGV = 'SIGSEGV',
  SIGSTKFLT = 'SIGSTKFLT',
  SIGSTOP = 'SIGSTOP',
  SIGSYS = 'SIGSYS',
  SIGTERM = 'SIGTERM',
  SIGTRAP = 'SIGTRAP',
  SIGTSTP = 'SIGTSTP',
  SIGTTIN = 'SIGTTIN',
  SIGTTOU = 'SIGTTOU',
  SIGUNUSED = 'SIGUNUSED',
  SIGURG = 'SIGURG',
  SIGUSR1 = 'SIGUSR1',
  SIGUSR2 = 'SIGUSR2',
  SIGVTALRM = 'SIGVTALRM',
  SIGWINCH = 'SIGWINCH',
  SIGXCPU = 'SIGXCPU',
  SIGXFSZ = 'SIGXFSZ',
}

const parameterSchema = z.object({
  instanceId: z.string().describe('The ID returned by shellStart'),
  stdin: z.string().optional().describe('Input to send to process'),
  signal: z
    .nativeEnum(NodeSignals)
    .optional()
    .describe('Signal to send to the process (e.g., SIGTERM, SIGINT)'),
  description: z
    .string()
    .max(80)
    .describe('The reason for this shell interaction (max 80 chars)'),
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
    'Process interaction results including stdout, stderr, and completion status',
  );

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const shellMessageTool: Tool<Parameters, ReturnType> = {
  name: 'shellMessage',
  description:
    'Interacts with a running shell process, sending input and receiving output',
  logPrefix: '💻',
  parameters: parameterSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returns: returnSchema,
  returnsJsonSchema: zodToJsonSchema(returnSchema),

  execute: async (
    { instanceId, stdin, signal },
    { logger },
  ): Promise<ReturnType> => {
    logger.verbose(
      `Interacting with shell process ${instanceId}${stdin ? ' with input' : ''}${signal ? ` with signal ${signal}` : ''}`,
    );

    try {
      const processState = processStates.get(instanceId);
      if (!processState) {
        throw new Error(`No process found with ID ${instanceId}`);
      }

      // Send signal if provided
      if (signal) {
        const wasKilled = processState.process.kill(signal);
        if (!wasKilled) {
          return {
            stdout: '',
            stderr: '',
            completed: processState.state.completed,
            signaled: false,
            error: `Failed to send signal ${signal} to process (process may have already terminated)`,
          };
        }
        processState.state.signaled = true;
      }

      // Send input if provided
      if (stdin) {
        if (!processState.process.stdin?.writable) {
          throw new Error('Process stdin is not available');
        }
        processState.process.stdin.write(`${stdin}\n`);
      }

      // Wait a brief moment for output to be processed
      await sleep(100);

      // Get accumulated output
      const stdout = processState.stdout.join('');
      const stderr = processState.stderr.join('');

      // Clear the buffers
      processState.stdout = [];
      processState.stderr = [];

      logger.verbose('Interaction completed successfully');
      if (stdout) {
        logger.verbose(`stdout: ${stdout.trim()}`);
      }
      if (stderr) {
        logger.verbose(`stderr: ${stderr.trim()}`);
      }

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        completed: processState.state.completed,
        signaled: processState.state.signaled,
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.verbose(`Process interaction failed: ${error.message}`);

        return {
          stdout: '',
          stderr: '',
          completed: false,
          error: error.message,
        };
      }

      const errorMessage = String(error);
      logger.error(`Unknown error during process interaction: ${errorMessage}`);
      return {
        stdout: '',
        stderr: '',
        completed: false,
        error: `Unknown error occurred: ${errorMessage}`,
      };
    }
  },

  logParameters: (input, { logger }) => {
    const processState = processStates.get(input.instanceId);
    logger.info(
      `Interacting with shell command "${processState ? processState.command : '<unknown instanceId>'}", ${input.description}`,
    );
  },
  logReturns: () => {},
};
