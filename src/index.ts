import * as dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Logger } from "./utils/logger.js";
import { createRequire } from "module";
import { join } from "path";
import { fileURLToPath } from "url";
import { fileCommands } from "yargs-file-commands";
import { checkForUpdates } from "./utils/versionCheck.js";

import sourceMapSupport from "source-map-support";

import type { PackageJson } from "type-fest";
import { sharedOptions } from "./options.js";
import { getTools } from "./tools/getTools.js";

sourceMapSupport.install();

const main = async () => {
  dotenv.config();

  const logger = new Logger({ name: "Main", color: "white" });

  const updateMessage = await checkForUpdates();
  if (updateMessage) {
    console.log();
    logger.info(updateMessage);
    console.log();
  }

  // Error handling
  process.on("SIGINT", () => {
    logger.warn("\nGracefully shutting down...");
    process.exit(0);
  });

  process.on("uncaughtException", (error) => {
    logger.error(
      "Fatal error:",
      error.constructor.name,
      error.message,
      error.stack,
    );
    process.exit(1);
  });

  const require = createRequire(import.meta.url);
  const packageInfo = require("../package.json") as PackageJson;

  // Get the directory where commands are located
  const __filename = fileURLToPath(import.meta.url);
  const commandsDir = join(__filename, "..", "commands");

  // Set up yargs with the new CLI interface
  await yargs(hideBin(process.argv))
    .scriptName(packageInfo.name!)
    .version(packageInfo.version!)
    .options(sharedOptions)
    .alias("h", "help")
    .alias("V", "version")
    .middleware(async (argv) => {
      // Set up logger with the specified log level
      argv.logger = new Logger({
        name: packageInfo.name!,
        color: "white",
        logLevel: argv.log,
      });
      argv.tools = await getTools();
    })
    .command(
      await fileCommands({
        commandDirs: [commandsDir],
        logLevel: "info",
      }),
    )
    .strict()
    .showHelpOnFail(true)
    .help().argv;
};

await main();
