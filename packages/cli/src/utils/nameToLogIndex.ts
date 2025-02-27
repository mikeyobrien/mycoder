import { LogLevel } from 'mycoder-agent';

export const nameToLogIndex = (logLevelName: string) => {
  // look up the log level name in the enum to get the value
  return LogLevel[logLevelName as keyof typeof LogLevel];
};
