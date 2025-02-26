import { LogLevel } from 'mycoder-agent';

export type SharedOptions = {
  readonly log: LogLevel;
  readonly interactive: boolean;
  readonly file?: string;
  readonly tokenUsage?: boolean;
};

export const sharedOptions = {
  log: {
    type: 'string',
    alias: 'l',
    description: 'Set minimum logging level',
    default: 'info',
    choices: ['debug', 'verbose', 'info', 'warn', 'error'],
  } as const,
  interactive: {
    type: 'boolean',
    alias: 'i',
    description: 'Run in interactive mode, asking for prompts',
    default: false,
  } as const,
  file: {
    type: 'string',
    alias: 'f',
    description: 'Read prompt from a file',
  } as const,
  tokenUsage: {
    type: 'boolean',
    description: 'Output token usage at info log level',
    default: false,
  } as const,
};
