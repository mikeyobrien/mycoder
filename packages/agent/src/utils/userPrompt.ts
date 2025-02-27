import * as readline from 'readline';

import chalk from 'chalk';

export const userPrompt = async (prompt: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  try {
    // Disable the readline interface's internal input processing
    if (rl.terminal) {
      process.stdin.setRawMode(false);
    }
    return await new Promise<string>((resolve) => {
      rl.question(chalk.green('\n' + prompt + '\n') + '\n> ', (answer) => {
        resolve(answer);
      });
    });
  } finally {
    rl.close();
  }
};
