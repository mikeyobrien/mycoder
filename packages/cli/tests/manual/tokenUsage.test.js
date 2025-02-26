#!/usr/bin/env node

// This is a simple test script to verify the --tokenUsage option works

import { execSync } from 'child_process';

// Set up test environment
const testPrompt = 'Hello, can you tell me what day it is today?';

// Test with different configurations
const testCases = [
  { name: 'Without tokenUsage (debug level)', args: '--log=debug' },
  { name: 'With tokenUsage flag', args: '--tokenUsage --log=info' },
];

console.log('Testing --tokenUsage option:\n');

for (const test of testCases) {
  console.log(`\n=== ${test.name} ===`);
  try {
    // Run the CLI with tokenUsage option
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
    const hasTokenUsage = output.includes('[Token Usage');
    console.log(`Token usage info present: ${hasTokenUsage ? '✅ Yes' : '❌ No'}`);
    
    // Check if token cost appears in the output
    const hasTokenCost = output.includes('COST:');
    console.log(`Token cost info present: ${hasTokenCost ? '✅ Yes' : '❌ No'}`);
  } catch (error) {
    console.error(`Error running test: ${error.message}`);
  }
}

console.log('\nTest completed!');
