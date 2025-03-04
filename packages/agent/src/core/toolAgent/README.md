# Tool Agent Module

This directory contains the refactored Tool Agent implementation, split into smaller, focused modules for improved maintainability and testability.

## Module Structure

- **index.ts**: Main entry point and orchestration of the tool agent functionality
- **config.ts**: Configuration-related code and default settings
- **messageUtils.ts**: Utilities for handling and formatting messages
- **toolExecutor.ts**: Logic for executing tool calls
- **tokenTracking.ts**: Enhanced utilities for token tracking
- **types.ts**: Consolidated type definitions

## Usage

```typescript
import { toolAgent } from './toolAgent/index.js';
import { Tool, ToolContext } from './toolAgent/types.js';

// Use the toolAgent function as before
const result = await toolAgent(prompt, tools, config, context);
```

## Benefits of This Structure

- **Improved maintainability**: Smaller, focused files are easier to understand and modify
- **Better testability**: Isolated components can be tested independently
- **Clearer responsibilities**: Each module has a single purpose
- **Easier onboarding**: New developers can understand the system more quickly
- **Simpler future extensions**: Modular design makes it easier to extend functionality

## Migration

The original `toolAgent.ts` file now re-exports from this directory for backward compatibility, but it will display a deprecation warning. New code should import directly from the toolAgent directory.
