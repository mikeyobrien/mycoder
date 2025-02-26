#!/usr/bin/env node

// This is a simple test script to verify the --tokenLog option works

import { execSync } from 'child_process';

// Set up test environment
const testPrompt = 'Hello, can you tell me what day it is today?';

// Test with different log levels
const testCases = [
  { name: 'Default (debug)', args: '--tokenLog=debug --log=debug' },
  { name: 'Verbose level', args: '--tokenLog=verbose --log=verbose' },
  { name: 'Info level', args: '--tokenLog=info --log=info' },
];

console.log('Testing --tokenLog option:\n');

for (const test of testCases) {
  console.log(`\n=== ${test.name} ===`);
  try {
    // Run the CLI with tokenLog option
    const cmd = `node --no-deprecation bin/cli.js ${test.args} "${testPrompt}"`;
    console.log(`Running: ${cmd}\n`);
    
    const output = execSync(cmd, { encoding: 'utf8' });
    
    // Print the first 500 characters of output for debugging
    console.log('Output preview:');
    console.log(output.substring(0, 500));
    console.log('...');
    console.log('Last 500 characters:');
    console.log(output.substring(output.length - 500));
    console.log('\n');
    
    // Check if token usage info appears in the output
    const hasTokenUsage = output.includes('Token usage:');
    console.log(`Token usage info present: ${hasTokenUsage ? '✅ Yes' : '❌ No'}`);
    
    // Check if cached tokens info appears in the output
    const hasCachedTokens = output.includes('cached');
    console.log(`Cached tokens info present: ${hasCachedTokens ? '✅ Yes' : '❌ No'}`);
    
    // Check if cache hit rate appears in the output
    const hasCacheHitRate = output.includes('cache hit rate');
    console.log(`Cache hit rate info present: ${hasCacheHitRate ? '✅ Yes' : '❌ No'}`);
    
  } catch (error) {
    console.error(`Error running test: ${error.message}`);
  }
}

console.log('\nTest completed!');
