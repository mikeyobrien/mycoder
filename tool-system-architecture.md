# MyCoder Tool System Architecture

## Overview

The MyCoder Tool System is a core component of the MyCoder agent architecture. It provides a modular, extensible system for defining and executing tools that allow the AI agent to interact with the external environment.

## Tool System Architecture

```
+-------------------------------------------------------+
|                     Tool System                        |
|                                                       |
|  +-------------------+      +-------------------+     |
|  |                   |      |                   |     |
|  |  Tool Definition  |      |  Tool Execution   |     |
|  |  - name           |      |  - executeToolCall|     |
|  |  - description    |      |  - executeTools   |     |
|  |  - parameters     |      |  - processResponse|     |
|  |  - handler        |      |                   |     |
|  |                   |      |                   |     |
|  +-------------------+      +-------------------+     |
|                                                       |
|  +-------------------+      +-------------------+     |
|  |                   |      |                   |     |
|  |  Tool Categories  |      |  Tool Context    |     |
|  |  - IO             |      |  - logger        |     |
|  |  - System         |      |  - tokenTracker  |     |
|  |  - Browser        |      |  - headless      |     |
|  |  - Interaction    |      |  - userSession   |     |
|  |                   |      |                   |     |
|  +-------------------+      +-------------------+     |
|                                                       |
+-------------------------------------------------------+
```

## Tool Definition

Each tool in the MyCoder system is defined with the following properties:

```typescript
interface Tool {
  name: string;           // Name of the tool
  description: string;    // Description for the AI to understand its purpose
  parameters: object;     // JSON Schema for the tool's parameters
  handler: Function;      // Function that implements the tool's behavior
}
```

## Tool Categories

### IO Tools

Tools for interacting with the file system and external services:

```
+---------------------+
|      IO Tools       |
|                     |
| +----------------+  |
| | readFile       |  |
| +----------------+  |
|                     |
| +----------------+  |
| | updateFile     |  |
| +----------------+  |
|                     |
| +----------------+  |
| | fetch          |  |
| +----------------+  |
+---------------------+
```

### System Tools

Tools for interacting with the operating system and process management:

```
+---------------------+
|    System Tools     |
|                     |
| +----------------+  |
| | shellStart     |  |
| +----------------+  |
|                     |
| +----------------+  |
| | shellMessage   |  |
| +----------------+  |
|                     |
| +----------------+  |
| | sleep          |  |
| +----------------+  |
|                     |
| +----------------+  |
| | respawn        |  |
| +----------------+  |
|                     |
| +----------------+  |
| | sequenceComplete| |
| +----------------+  |
+---------------------+
```

### Browser Tools

Tools for web automation and browsing:

```
+---------------------+
|    Browser Tools    |
|                     |
| +----------------+  |
| | browseStart    |  |
| +----------------+  |
|                     |
| +----------------+  |
| | browseMessage  |  |
| +----------------+  |
|                     |
| +----------------+  |
| | BrowserManager |  |
| +----------------+  |
|                     |
| +----------------+  |
| | PageController |  |
| +----------------+  |
+---------------------+
```

### Interaction Tools

Tools for user interaction and sub-agent management:

```
+---------------------+
|  Interaction Tools  |
|                     |
| +----------------+  |
| | subAgent       |  |
| +----------------+  |
|                     |
| +----------------+  |
| | userPrompt     |  |
| +----------------+  |
+---------------------+
```

## Tool Execution Flow

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
| Tool Agent     +---->+ executeTools   +---->+ executeToolCall|
|                |     |                |     |                |
+----------------+     +----------------+     +----------------+
                                                      |
                                                      v
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
| Tool Result    +<----+ Tool Handler   +<----+ Tool Input     |
|                |     |                |     | Validation     |
+----------------+     +----------------+     +----------------+
```

1. **Tool Agent** receives tool calls from the Anthropic API
2. **executeTools** processes multiple tool calls, potentially in parallel
3. **executeToolCall** handles individual tool execution:
   - Validates tool input against schema
   - Calls the appropriate tool handler
   - Returns the tool result
4. **Tool Result** is added to the message context for the next API call

## Sub-Agent Architecture

The sub-agent tool is a special tool that creates a new agent instance to handle specific tasks:

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
| Main Agent     +---->+ subAgent Tool  +---->+ New Agent     |
|                |     |                |     | Instance      |
+----------------+     +----------------+     +----------------+
        ^                                            |
        |                                            v
        |                                    +----------------+
        |                                    |                |
        |                                    | Tool Execution |
        |                                    |                |
        |                                    +----------------+
        |                                            |
        |                                            v
        |                                    +----------------+
        |                                    |                |
        +------------------------------------+ Result         |
                                             |                |
                                             +----------------+
```

1. Main agent identifies a task that can be delegated
2. Main agent calls the `subAgent` tool with task description and context
3. New agent instance is created with its own context and token tracker
4. New agent executes its own agent loop with access to all tools
5. Result is returned to the main agent

## Tool Context

Each tool execution receives a context object with the following information:

```typescript
interface ToolContext {
  logger: Logger;            // Logger for the tool to use
  tokenTracker: TokenTracker; // Tracks token usage
  headless?: boolean;        // Whether to run browsers in headless mode
  userSession?: boolean;     // Whether to use user's browser session
  pageFilter?: string;       // Filter for browser page selection
  workingDirectory?: string; // Current working directory
}
```

## Extending the Tool System

The tool system is designed to be easily extensible:

1. **Define a new tool** with name, description, parameters schema, and handler
2. **Add the tool** to the `getTools` function
3. **Use the tool** in agent prompts

Example of a custom tool definition:

```typescript
export const myCustomTool: Tool = {
  name: 'myCustomTool',
  description: 'Performs a custom action',
  parameters: {
    type: 'object',
    properties: {
      param1: { type: 'string' },
      param2: { type: 'number' },
    },
    required: ['param1'],
  },
  handler: async (input, context) => {
    // Tool implementation
    return 'Result';
  },
};
```
