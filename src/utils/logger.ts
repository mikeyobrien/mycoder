import chalk, { ChalkInstance } from "chalk";

export type LogColor = "white" | "blue" | "cyan" | "green" | "magenta";

const randomColor = (): LogColor => {
  const colors: LogColor[] = ["white", "blue", "cyan", "green", "magenta"];
  return colors[Math.floor(Math.random() * colors.length)] as LogColor;
};

export type LogLevel = "info" | "verbose" | "warn" | "error" | "debug";

export type LoggerProps = {
  name: string;
  color?: LogColor;
  logLevel?: LogLevel;
  parent?: Logger;
};

const LogLevelIndex = {
  error: 4,
  warn: 3,
  info: 2,
  verbose: 1,
  debug: 0,
};

export class Logger {
  private readonly offset: string;
  private readonly chalkColor;
  private readonly logLevel: LogLevel;
  private readonly logLevelIndex: number;
  private readonly parent?: Logger;
  private readonly name: string;

  constructor({
    name,
    color = randomColor(),
    parent = undefined,
    logLevel = parent?.logLevel ?? "info",
  }: LoggerProps) {
    this.name = name;
    this.parent = parent;
    this.logLevel = logLevel;
    this.logLevelIndex = LogLevelIndex[this.logLevel];
    this.chalkColor = chalk[color];

    // Calculate offset based on parent chain
    let offsetSpaces = 0;
    let currentParent = parent;
    while (currentParent) {
      offsetSpaces += 2;
      currentParent = currentParent.parent;
    }

    this.offset = " ".repeat(offsetSpaces);
  }

  private toStrings(messages: any[]) {
    return messages
      .map((message) =>
        typeof message === "object"
          ? JSON.stringify(message, null, 2)
          : String(message),
      )
      .join(" ");
  }

  private formatMessages(
    prefixChalk: ChalkInstance,
    prefix: string,
    messagesChalk: ChalkInstance,
    messages: any[],
    showPrefix: boolean = true,
  ): string {
    const formatted = this.toStrings(messages);

    // Split into lines and add prefix to each line if showPrefix is true
    return formatted
      .split("\n")
      .map((line) =>
        showPrefix
          ? `${prefixChalk(prefix)} ${messagesChalk(`${line}`)}`
          : `${this.offset}${messagesChalk(`${line}`)}`,
      )
      .join("\n");
  }

  private prefix(): string {
    return this.offset + `[${this.name}]`;
  }

  debug(...messages: any[]): void {
    if (this.logLevelIndex > LogLevelIndex.debug) return;

    console.log(
      this.formatMessages(
        this.chalkColor.dim,
        this.prefix(),
        this.chalkColor.dim,
        messages,
        true, // Always show prefix for debug
      ),
    );
  }

  verbose(...messages: any[]): void {
    if (this.logLevelIndex > LogLevelIndex.verbose) return;

    console.log(
      this.formatMessages(
        this.chalkColor.dim,
        this.prefix(),
        this.chalkColor.dim,
        messages,
        true, // Always show prefix for verbose
      ),
    );
  }

  info(...messages: any[]): void {
    if (this.logLevelIndex > LogLevelIndex.info) return;

    console.log(
      this.formatMessages(
        this.chalkColor,
        this.prefix(),
        this.chalkColor,
        messages,
        false, // Don't show prefix for info
      ),
    );
  }

  warn(...messages: any[]): void {
    if (this.logLevelIndex > LogLevelIndex.warn) return;

    console.warn(
      this.formatMessages(
        this.chalkColor.dim,
        this.prefix(),
        chalk.yellow,
        messages,
        false, // Don't show prefix for warn
      ),
    );
  }

  error(...messages: any[]): void {
    console.error(
      this.formatMessages(
        this.chalkColor.dim,
        this.prefix(),
        chalk.red,
        messages,
        false, // Don't show prefix for error
      ),
    );
  }
}
