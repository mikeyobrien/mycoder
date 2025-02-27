import { createInterface } from 'readline/promises';

import chalk from 'chalk';

export const userPrompt = async (prompt: string): Promise<string> => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return await rl.question(chalk.green('\n' + prompt + '\n') + '\n> ');
  } finally {
    rl.close();
  }
};
