# MyCoder Architecture Documentation

## Overview

MyCoder is an AI-powered coding assistant designed to help with various coding tasks. It consists of two main packages:

1. **Agent Package (`mycoder-agent`)**: Provides the core AI agent functionality and tools
2. **CLI Package (`mycoder`)**: Provides the command-line interface to interact with the agent

The architecture is built around a modular tool-based system that allows AI agents to interact with files, execute commands, make network requests, and spawn sub-agents for parallel task execution.

## System Architecture

### High-Level Architecture

```
+--------------------+     +--------------------+
|                    |     |                    |
|   CLI Package      |     |   Agent Package    |
|   (mycoder)        +---->+   (mycoder-agent)  |
|                    |     |                    |
+--------------------+     +-------+------------+
                                   |
                                   v
                           +-------+------------+
                           |                    |
                           |   Anthropic API    |
                           |   (Claude)         |
                           |                    |
                           +--------------------+
```

### Component Architecture

```
+-------------------------------------------------------------------------+
|                             CLI Package                                  |
|                                                                         |
|  +----------------+    +----------------+    +-------------------+      |
|  |                |    |                |    |                   |      |
|  | Commands       |    | Settings       |    | Utils             |      |
|  | - Default      |    | - User consent |    | - Version check   |      |
|  | - Tools        |    | - Config       |    | - Log formatting  |      |
|  |                |    |                |    |                   |      |
|  +-------+--------+    +----------------+    +-------------------+      |
|          |                                                              |
+----------+--------------------------------------------------------------+
           |
           v
+-------------------------------------------------------------------------+
|                            Agent Package                                |
|                                                                         |
|  +----------------+    +----------------+    +-------------------+      |
|  |                |    |                |    |                   |      |
|  | Core           |    | Tools          |    | Utils             |      |
|  | - Tool Agent   |    | - IO           |    | - Logger          |      |
|  | - Executor     |    | - System       |    | - Error handling  |      |
|  | - Types        |    | - Browser      |    | - Token tracking  |      |
|  |                |    | - Interaction  |    |                   |      |
|  +-------+--------+    +--------+-------+    +-------------------+      |
|          |                      |                                        |
+----------+----------------------+----------------------------------------+
           |                      |
           v                      v
+-------------------------------------------------------------------------+
|                                                                         |
|                          External Systems                               |
|  +----------------+    +----------------+    +-------------------+      |
|  |                |    |                |    |                   |      |
|  | File System    |    | Shell          |    | Browser           |      |
|  |                |    |                |    |                   |      |
|  +----------------+    +----------------+    +-------------------+      |
|                                                                         |
+-------------------------------------------------------------------------+
```

## Data Flow

### Main Execution Flow

1. **User Input**:
   - User provides a prompt via CLI (direct argument, file, or interactive mode)

2. **CLI Processing**:
   - CLI validates input and user consent
   - Appends standard suffix to prompt with guidance
   - Initializes logger and token tracker

3. **Agent Initialization**:
   - CLI calls `toolAgent` function from agent package
   - Agent initializes Anthropic client
   - Initial messages array is created with user prompt

4. **Agent Loop**:
   - Agent sends messages to Anthropic API
   - API returns text content and tool calls
   - Tool calls are executed (potentially in parallel)
   - Results are added to messages array
   - Loop continues until sequence completion or max iterations

5. **Result**:
   - Final result is returned to CLI
   - CLI displays result and token usage

### Sub-Agent Flow

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
| Main Agent     +---->+ Sub-Agent      +---->+ Tools          |
|                |     |                |     |                |
+----------------+     +----------------+     +----------------+
        ^                                            |
        |                                            |
        +--------------------------------------------+
                      Results
```

1. Main agent identifies a task that can be delegated
2. Main agent calls `subAgent` tool with task description and context
3. Sub-agent is created with its own context and token tracker
4. Sub-agent executes its own agent loop (similar to main agent)
5. Sub-agent returns results to main agent
6. Main agent continues execution with sub-agent results

## Component Details

### Agent Package

#### Core Components

- **toolAgent**: Main function that manages the agent loop, interacting with Anthropic API
- **executeToolCall**: Executes individual tool calls
- **executeTools**: Manages parallel execution of multiple tool calls
- **TokenTracker**: Tracks token usage for billing and optimization

#### Tool Categories

1. **IO Tools**:
   - `readFile`: Reads file content
   - `updateFile`: Creates or updates files
   - `fetch`: Makes HTTP requests

2. **System Tools**:
   - `shellStart`: Starts a shell command
   - `shellMessage`: Interacts with running shell processes
   - `sleep`: Pauses execution
   - `respawn`: Resets agent context
   - `sequenceComplete`: Ends the agent sequence

3. **Browser Tools**:
   - `browseStart`: Starts a browser session
   - `browseMessage`: Performs actions in browser

4. **Interaction Tools**:
   - `subAgent`: Creates a sub-agent for parallel tasks
   - `userPrompt`: Prompts user for input

### CLI Package

#### Commands

- **Default Command**: Handles the main CLI interface
- **Tools Command**: Manages agent tools

#### Settings

- User consent management
- Configuration handling

#### Utilities

- Version checking
- Log formatting

## Technical Implementation

### Key Technologies

- **TypeScript**: For type safety and modern JavaScript features
- **Anthropic Claude API**: For AI capabilities
- **Playwright**: For browser automation
- **yargs**: For CLI argument parsing

### Project Structure

```
/packages
  /agent
    /src
      /core        # Core agent functionality
      /tools       # Tool implementations
        /browser   # Browser tools
        /interaction # Interaction tools
        /io        # I/O tools
        /system    # System tools
      /utils       # Utilities
  /cli
    /src
      /commands    # CLI commands
      /settings    # Settings management
      /utils       # Utilities
```

## Security Considerations

- MyCoder has full access to the user's system, requiring explicit user consent
- API keys are stored as environment variables
- Browser automation runs in a sandboxed environment by default

## Extensibility

The tool-based architecture makes MyCoder highly extensible:

1. New tools can be added to extend functionality
2. Custom tools can be created for specific use cases
3. The agent system can be used independently of the CLI

## Future Enhancements

- Additional tool categories
- Enhanced parallel processing
- More specialized AI models for specific tasks
- Integration with cloud services
