# MyCoder

## Overview

MyCoder is a powerful command-line based AI agent system that can perform arbitrary tasks with a particular focus on coding tasks. It uses a modular tool-based architecture that allows it to interact with files, execute commands, make network requests, and spawn sub-agents for parallel task execution.

## ⚠️ Important: API Key Required

Before using MyCoder, you must have an ANTHROPIC_API_KEY specified either:

- As an environment variable, or
- In a .env file in the folder you run `mycoder` from

Get an API key from https://www.anthropic.com/api

## Quick Start

```bash
# Install globally
npm install -g mycoder

# Start MyCoder with a prompt
mycoder "your prompt here"

# Start in interactive mode
mycoder --interactive

# Read prompt from a file
mycoder --promptFile=your-prompt.txt
```

## Key Features

- 🤖 **AI-Powered**: Leverages Anthropic's Claude API for intelligent decision making
- 🛠️ **Extensible Tool System**: Modular architecture with various tool categories
- 🔄 **Parallel Execution**: Ability to spawn sub-agents for concurrent task processing
- 📝 **Self-Modification**: Can modify code, it was built and testing by writing itself
- 🔍 **Smart Logging**: Hierarchical, color-coded logging system for clear output
- 👤 **Human Compatible**: Uses README.md, project files and shell commands to build its own context

### CLI Options

- `[prompt]`: Main prompt text (positional argument)
- `--interactive`: Run in interactive mode, asking for prompts
- `--promptFile`: Read prompt from a specified file
- `--log`: Set log level (info, verbose, warn, error)
- `-h, --help`: Show help
- `-V, --version`: Show version

## Available Tools

To list the current tools that the agent makes use of run:

```bash
mycoder tools
```

## Example Use Cases & Prompts

MyCoder excels at various software development tasks. Here are some example prompts and use cases:

### Code Migration & Updates

```bash
# Converting test framework
mycoder "Convert all Jest tests in the src/ directory to Vitest, updating any necessary configuration files and dependencies"

# Dependency updates
mycoder "Update all dependencies to their latest versions, handle any breaking changes, and ensure all tests pass"
```

### Code Refactoring

```bash
# Class refactoring
mycoder "Refactor the UserService class in src/services/UserService.ts to use the repository pattern, update all files that use this class, and ensure tests pass"

# API modernization
mycoder "Convert all callback-based functions in the project to use async/await, update tests accordingly"
```

### Feature Implementation

```bash
# CLI enhancement
mycoder "Add a new global --debug command line option that enables verbose logging throughout the application"

# New functionality
mycoder "Create a new caching system for API responses using Redis, including configuration options and unit tests"
```

### Project Creation

```bash
# Web application
mycoder "Create a Next.js web application for a task management system with the following features:
- User authentication using Next-Auth
- MongoDB database integration
- Task CRUD operations
- Tailwind CSS styling
- Unit tests for components
- API route tests"

# API service
mycoder "Create an Express.js REST API service for a book management system with:
- TypeScript configuration
- PostgreSQL database
- JWT authentication
- OpenAPI documentation
- Docker setup
- GitHub Actions CI/CD"
```

### Maintenance & Fixes

```bash
# Build fixes
mycoder "Fix all TypeScript build errors and ensure all tests pass"

# Test coverage
mycoder "Add unit tests for all untested functions in the src/utils directory, aiming for 80% coverage"
```

### Documentation

```bash
# Documentation generation
mycoder "Generate comprehensive JSDoc documentation for all exported functions and update the API documentation in the docs/ directory"

# Architecture documentation
mycoder "Analyze the current codebase and create detailed architecture documentation including component diagrams and data flow"
```

These examples showcase MyCoder's ability to handle complex software development tasks. The tool uses its understanding of software development best practices, project structure, and coding standards to execute these tasks while maintaining code quality and test coverage.

## Technical Requirements

- Node.js >=18.0.0
- npm or pnpm

## Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/mycoder.git
cd mycoder

# Install dependencies
pnpm install

# Create .env file with your API keys
cp .env.example .env
# Edit .env with your API keys
```

### Development Commands

- `pnpm run build` - Build the TypeScript code
- `pnpm start` - Run the application
- `pnpm test` - Run tests
- `pnpm run lint` - Lint the code
- `pnpm run format` - Format the code
- `pnpm run clean` - Clean build artifacts

## Architecture

### Core Components

1. **Tool System**

   - Modular tools for specific functionalities
   - Categories: Interaction, I/O, System, Data Management
   - Parallel execution capability
   - Type-safe definitions

2. **Agent System**

   - Main agent for orchestration
   - Sub-agents for parallel task execution
   - Anthropic Claude API integration
   - Hierarchical logging

3. **Logger System**
   - Color-coded component output
   - Hierarchical indentation
   - Multiple log levels (info, verbose, warn, error)
   - Structured data logging

## Project Structure

```
src/
├── core/           # Core agent and executor logic
├── interfaces/     # Type definitions and interfaces
├── tools/         # Tool implementations
│   ├── interaction/
│   ├── io/
│   ├── system/
│   └── record/
└── utils/         # Utilities including logger
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for our development workflow, coding guidelines, and testing procedures.

Key points:

- Use TypeScript types over interfaces
- Maintain test coverage
- Keep documentation updated
- Use the logger system for output
- Run build, test, and lint before submitting changes

## License

MIT License
