export type SharedOptions = {
  readonly logLevel: string;
  readonly interactive: boolean;
  readonly file?: string;
  readonly tokenUsage?: boolean;
  readonly headless?: boolean;
};

export const sharedOptions = {
  logLevel: {
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
  headless: {
    type: 'boolean',
    description: 'Use browser in headless mode with no UI showing',
    default: true,
  } as const,
};
