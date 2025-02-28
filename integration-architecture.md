# MyCoder Integration Architecture

## Overview

This document describes how the CLI package (`mycoder`) integrates with the Agent package (`mycoder-agent`) to provide a complete AI-powered coding assistant solution.

## Package Integration

```
+---------------------+            +---------------------+
|                     |            |                     |
|  CLI Package        |            |  Agent Package      |
|  (mycoder)          |            |  (mycoder-agent)    |
|                     |            |                     |
| +----------------+  |            | +----------------+  |
| | CLI Entry      |  |            | | Agent Entry    |  |
| | - bin/cli.js   +---------------->+ - index.ts     |  |
| +----------------+  |            | +----------------+  |
|                     |            |                     |
| +----------------+  |            | +----------------+  |
| | Commands       |  |            | | Core           |  |
| | - $default.ts  +---------------->+ - toolAgent.ts |  |
| +----------------+  |            | +----------------+  |
|                     |            |                     |
| +----------------+  |            | +----------------+  |
| | Settings       |  |            | | Tools          |  |
| | - settings.ts  +---------------->+ - getTools.ts  |  |
| +----------------+  |            | +----------------+  |
|                     |            |                     |
| +----------------+  |            | +----------------+  |
| | Utils          |  |            | | Utils          |  |
| | - logger.ts    +---------------->+ - logger.ts    |  |
| +----------------+  |            | +----------------+  |
|                     |            |                     |
+---------------------+            +---------------------+
```

## Integration Points

### 1. CLI Entry Point to Agent

The CLI package provides the command-line interface that users interact with. It processes command-line arguments, validates input, and then calls into the Agent package to execute the AI-powered tasks.

**Key Files:**
- CLI: `packages/cli/bin/cli.js` - Main entry point for the CLI
- CLI: `packages/cli/src/index.ts` - Sets up yargs and command handling
- Agent: `packages/agent/src/index.ts` - Exports all agent functionality

### 2. Default Command to Tool Agent

The default command in the CLI package is responsible for executing prompts. It calls the `toolAgent` function from the Agent package to handle the AI interaction and tool execution.

**Key Files:**
- CLI: `packages/cli/src/commands/$default.ts` - Default command implementation
- Agent: `packages/agent/src/core/toolAgent.ts` - Core agent implementation

**Integration Code:**

```typescript
// In CLI package
const result = await toolAgent(prompt, tools, undefined, {
  logger,
  headless: argv.headless ?? true,
  userSession: argv.userSession ?? false,
  pageFilter: argv.pageFilter ?? 'none',
  workingDirectory: '.',
  tokenTracker,
});
```

### 3. Tool Registration

The CLI package gets the list of available tools from the Agent package using the `getTools` function.

**Key Files:**
- CLI: `packages/cli/src/commands/$default.ts` - Uses getTools
- Agent: `packages/agent/src/tools/getTools.ts` - Defines available tools

**Integration Code:**

```typescript
// In CLI package
const tools = getTools();
```

### 4. Logging Integration

Both packages use a shared logging system defined in the Agent package.

**Key Files:**
- CLI: `packages/cli/src/commands/$default.ts` - Creates logger
- Agent: `packages/agent/src/utils/logger.ts` - Logger implementation

**Integration Code:**

```typescript
// In CLI package
const logger = new Logger({
  name: 'Default',
  logLevel: nameToLogIndex(argv.logLevel),
  customPrefix: subAgentTool.logPrefix,
});
```

### 5. Token Tracking

The CLI package initializes a token tracker from the Agent package to monitor API usage.

**Key Files:**
- CLI: `packages/cli/src/commands/$default.ts` - Creates token tracker
- Agent: `packages/agent/src/core/tokens.ts` - Token tracking implementation

**Integration Code:**

```typescript
// In CLI package
const tokenTracker = new TokenTracker(
  'Root',
  undefined,
  argv.tokenUsage ? LogLevel.info : LogLevel.debug,
);
```

## Configuration Flow

```
+---------------------+            +---------------------+
|                     |            |                     |
|  CLI Configuration  |            |  Agent Configuration|
|                     |            |                     |
| +----------------+  |            | +----------------+  |
| | CLI Arguments  +---------------->+ Tool Context   |  |
| +----------------+  |            | +----------------+  |
|                     |            |                     |
| +----------------+  |            | +----------------+  |
| | Environment    +---------------->+ API Keys       |  |
| +----------------+  |            | +----------------+  |
|                     |            |                     |
| +----------------+  |            | +----------------+  |
| | User Settings  +---------------->+ Browser Config |  |
| +----------------+  |            | +----------------+  |
+---------------------+            +---------------------+
```

## Dependency Management

The CLI package depends on the Agent package, but not vice versa. This allows the Agent package to be used independently in other applications.

**Package.json Dependencies:**

```json
// CLI package.json
{
  "dependencies": {
    "mycoder-agent": "^0.3.0",
    // Other dependencies
  }
}
```

## Error Handling

Error handling is coordinated between the packages:

1. Agent package throws errors or returns error messages in tool results
2. CLI package catches errors and displays them to the user

```
+---------------------+            +---------------------+
|                     |            |                     |
|  CLI Error Handler  |            |  Agent Error        |
|                     |            |                     |
| +----------------+  |            | +----------------+  |
| | Try/Catch      |<---------------+ Throw Error    |  |
| +----------------+  |            | +----------------+  |
|         |           |            |                     |
|         v           |            |                     |
| +----------------+  |            |                     |
| | Display Error  |  |            |                     |
| +----------------+  |            |                     |
|                     |            |                     |
+---------------------+            +---------------------+
```

## Execution Context

The CLI package creates an execution context object that is passed to the Agent package. This context includes:

- Logger instance
- Token tracker
- Browser configuration
- Working directory

This context is then passed to all tools during execution.

## Versioning Strategy

Both packages are versioned together to ensure compatibility. The CLI package depends on a specific version of the Agent package to maintain API compatibility.

## Extensibility

The integration is designed to be extensible:

1. New tools can be added to the Agent package and will automatically be available to the CLI
2. New commands can be added to the CLI package that use the Agent package in different ways
3. The Agent package can be used in other applications besides the CLI
