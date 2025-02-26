# MyCoder Agent

Core AI agent system that powers the MyCoder CLI tool. This package provides a modular tool-based architecture that allows AI agents to interact with files, execute commands, make network requests, and spawn sub-agents for parallel task execution.

## Overview

The MyCoder Agent system is built around a few key concepts:

- 🛠️ **Extensible Tool System**: Modular architecture with various tool categories
- 🔄 **Parallel Execution**: Ability to spawn sub-agents for concurrent task processing
- 🤖 **AI-Powered**: Leverages Anthropic's Claude API for intelligent decision making
- 🔍 **Smart Logging**: Hierarchical, color-coded logging system for clear output

Please join the MyCoder.ai discord for support: https://discord.gg/5K6TYrHGHt

## Installation

```bash
npm install mycoder-agent
```

## API Key Required

Before using MyCoder Agent, you must have an ANTHROPIC_API_KEY specified either:

- As an environment variable, "export ANTHROPIC_API_KEY=[your-api-key]" or
- In a .env file in your project root

Get an API key from https://www.anthropic.com/api

## Core Components

### Tool System

- Modular tools for specific functionalities
- Categories: Interaction, I/O, System, Data Management
- Parallel execution capability
- Type-safe definitions

### Agent System

- Main agent for orchestration
- Sub-agents for parallel task execution
- Anthropic Claude API integration
- Hierarchical logging

### Logger System

- Color-coded component output
- Hierarchical indentation
- Multiple log levels (info, verbose, warn, error)
- Structured data logging

## Project Structure

```
src/
├── core/           # Core agent and executor logic
├── interfaces/     # Type definitions and interfaces
├── tools/          # Tool implementations
│   ├── interaction/
│   ├── io/
│   ├── system/
│   └── record/
└── utils/         # Utilities including logger
```

## Available Tools

The agent system provides various tools in different categories:

- **Interaction Tools**: User prompts, sub-agent creation
- **I/O Tools**: File reading/writing, HTTP requests
- **System Tools**: Shell command execution, process management
- **Browser Tools**: Web automation and scraping capabilities

## Technical Requirements

- Node.js >= 20.0.0
- pnpm >= 10.2.1

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.
