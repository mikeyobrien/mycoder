# Contributing

Key points:

- Run build, test, and lint before submitting changes
- Use TypeScript types over interfaces
- Maintain test coverage
- Keep documentation updated
- Use the logger system for output

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

## Coding Style

### Terse and Simple

Favor a terse coding style that focuses on simplicity and readability.

## Prefer Types over Interfaces

When writing types please use type rather than interfaces as they are more robust.

### Use Logger in Tools/Agents for Output

The project uses a hierarchical logging system (Logger) that helps distinguish between different agents and tools in the output. The logging system has the following features:

- `verbose`: Detailed debug information (dimmed version of agent/tool color)
- `info`: Normal operational messages (colored according to agent/tool color)
- `warn`: Warning messages (yellow)
- `error`: Error messages (red)

## Check Build Works after Changes

Ensure that `pnpm run build` works after making changes to the code, otherwise you need to make fixes.

## Keep Tests & Lint & Format Up-to-Date With Changes

Please add tests when making changes to the code. Try to sensible tests that a senior dev would write, try to avoid useless tests that don't add value.

Ensure that the `pnpm test` passes after making changes to the code as well as `pnpm run lint` passes with no warnings or errors. Also run `pnpm run format` to ensure the code is formatted correctly.

If a test fails, but it is not clear why, you can add more tests around that test as well as add more verbose messages to the failed test to help you identify the cause. This will both help you and help others going forward.

## Keep Documentation Up-to-Date with Changes

When making changes to the code, please ensure that the documentation in these files says up to date:

- `README.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `TOOLS.md`
