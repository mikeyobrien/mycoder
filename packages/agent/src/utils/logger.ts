import chalk, { ChalkInstance } from "chalk";

export enum LogLevel {
  debug = 0,
  verbose = 1,
  info = 2,
  warn = 3,
  error = 4,
}
export type LoggerStyler = {
  getColor(level: LogLevel, indentLevel: number): ChalkInstance;
  formatPrefix(prefix: string, level: LogLevel): string;
  showPrefix(level: LogLevel): boolean;
};

export const BasicLoggerStyler = {
  getColor: (level: LogLevel, _nesting: number = 0): ChalkInstance => {
    switch (level) {
      case LogLevel.error:
        return chalk.red;
      case LogLevel.warn:
        return chalk.yellow;
      case LogLevel.debug:
      case LogLevel.verbose:
        return chalk.white.dim;
      default:
        return chalk.white;
    }
  },
  formatPrefix: (
    prefix: string,
    level: LogLevel,
    _nesting: number = 0,
  ): string =>
    level === LogLevel.debug || level === LogLevel.verbose
      ? chalk.dim(prefix)
      : "",
};

const loggerStyle = BasicLoggerStyler;

export type LoggerProps = {
  name: string;
  logLevel?: LogLevel;
  parent?: Logger;
};

export class Logger {
  private readonly prefix: string;
  private readonly logLevel: LogLevel;
  private readonly logLevelIndex: LogLevel;
  private readonly parent?: Logger;
  private readonly name: string;
  private readonly nesting: number;

  constructor({
    name,
    parent = undefined,
    logLevel = parent?.logLevel ?? LogLevel.info,
  }: LoggerProps) {
    this.name = name;
    this.parent = parent;
    this.logLevel = logLevel;
    this.logLevelIndex = logLevel;

    // Calculate indent level and offset based on parent chain
    this.nesting = 0;
    let offsetSpaces = 0;
    let currentParent = parent;
    while (currentParent) {
      offsetSpaces += 2;
      this.nesting++;
      currentParent = currentParent.parent;
    }

    this.prefix = " ".repeat(offsetSpaces);
  }

  private toStrings(messages: unknown[]) {
    return messages
      .map((message) =>
        typeof message === "object"
          ? JSON.stringify(message, null, 2)
          : String(message),
      )
      .join(" ");
  }

  private formatMessages(level: LogLevel, messages: unknown[]): string {
    const formatted = this.toStrings(messages);
    const messageColor = loggerStyle.getColor(level, this.nesting);
    const prefix = loggerStyle.formatPrefix(
      `[${this.name}]`,
      level,
      this.nesting,
    );

    return formatted
      .split("\n")
      .map((line) => `${this.prefix}${prefix} ${messageColor(line)}`)
      .join("\n");
  }

  debug(...messages: unknown[]): void {
    if (this.logLevelIndex > LogLevel.debug) return;
    console.log(this.formatMessages(LogLevel.debug, messages));
  }

  verbose(...messages: unknown[]): void {
    if (this.logLevelIndex > LogLevel.verbose) return;
    console.log(this.formatMessages(LogLevel.verbose, messages));
  }

  info(...messages: unknown[]): void {
    if (this.logLevelIndex > LogLevel.info) return;
    console.log(this.formatMessages(LogLevel.info, messages));
  }

  warn(...messages: unknown[]): void {
    if (this.logLevelIndex > LogLevel.warn) return;
    console.warn(this.formatMessages(LogLevel.warn, messages));
  }

  error(...messages: unknown[]): void {
    console.error(this.formatMessages(LogLevel.error, messages));
  }
}
