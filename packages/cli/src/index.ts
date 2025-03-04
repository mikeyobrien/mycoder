import { createRequire } from 'module';

import * as dotenv from 'dotenv';
import sourceMapSupport from 'source-map-support';
import yargs, { CommandModule } from 'yargs';
import { hideBin } from 'yargs/helpers';

import { command as defaultCommand } from './commands/$default.js';
import { command as testSentryCommand } from './commands/test-sentry.js';
import { command as toolsCommand } from './commands/tools.js';
import { sharedOptions } from './options.js';
import { initSentry, captureException } from './sentry/index.js';
initSentry();

import type { PackageJson } from 'type-fest';

// Add global declaration for our patched toolAgent

sourceMapSupport.install();

const main = async () => {
  dotenv.config();

  const require = createRequire(import.meta.url);
  const packageInfo = require('../package.json') as PackageJson;

  // Set up yargs with the new CLI interface
  await yargs(hideBin(process.argv))
    .scriptName(packageInfo.name!)
    .version(packageInfo.version!)
    .options(sharedOptions)
    .alias('h', 'help')
    .alias('V', 'version')
    .command([
      defaultCommand,
      testSentryCommand,
      toolsCommand,
    ] as CommandModule[])
    .strict()
    .showHelpOnFail(true)
    .help().argv;
};

await main().catch((error) => {
  console.error(error);
  // Capture the error with Sentry
  captureException(error);
  process.exit(1);
});
