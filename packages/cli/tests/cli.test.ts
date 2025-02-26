import { execSync } from 'child_process';

import { expect, test, describe } from 'vitest';

import { version } from '../package.json';

describe('CLI', () => {
  test('version command outputs correct version', () => {
    const output = execSync('node ./bin/cli.js --version').toString();
    expect(output).toContain(version);
    expect(output).not.toContain('AI-powered coding assistant');
  });

  test('--help command outputs help', () => {
    const output = execSync('node ./bin/cli.js --help').toString();
    expect(output).toContain('Commands:');
    expect(output).toContain('Positionals:');
    expect(output).toContain('Options:');
  });
});
