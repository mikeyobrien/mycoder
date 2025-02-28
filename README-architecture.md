# MyCoder Architecture Documentation

## Introduction

This documentation provides a comprehensive overview of the MyCoder architecture, a modular AI-powered coding assistant built as a monorepo with two main packages: `mycoder` (CLI) and `mycoder-agent` (Agent).

## Table of Contents

1. [System Architecture](architecture-documentation.md)
   - High-level overview of the system architecture
   - Component diagrams
   - Project structure
   - Technical implementation

2. [Tool System Architecture](tool-system-architecture.md)
   - Tool definition and execution
   - Tool categories
   - Sub-agent architecture
   - Extending the tool system

3. [Data Flow Architecture](data-flow-architecture.md)
   - Main data flow
   - Message flow
   - Tool call flow
   - Browser automation flow
   - File system flow
   - Shell command flow

4. [Integration Architecture](integration-architecture.md)
   - CLI and Agent package integration
   - Configuration flow
   - Dependency management
   - Error handling
   - Execution context

## Key Components

### CLI Package (`mycoder`)

The CLI package provides the command-line interface for users to interact with the MyCoder system. It handles:

- Command-line argument parsing
- User input processing
- Configuration management
- Tool execution orchestration

### Agent Package (`mycoder-agent`)

The Agent package provides the core AI agent functionality and tools. It includes:

- AI agent implementation using Anthropic's Claude API
- Extensible tool system
- Parallel execution capabilities
- Token usage tracking

## Getting Started

To understand the MyCoder architecture:

1. Start with the [System Architecture](architecture-documentation.md) for a high-level overview
2. Explore the [Tool System Architecture](tool-system-architecture.md) to understand the modular tool system
3. Review the [Data Flow Architecture](data-flow-architecture.md) to see how data moves through the system
4. Examine the [Integration Architecture](integration-architecture.md) to understand how the packages work together

## Diagrams

This documentation includes ASCII diagrams for visualization. For better readability, consider converting these to proper diagrams using tools like:

- [Mermaid](https://mermaid-js.github.io/mermaid/)
- [PlantUML](https://plantuml.com/)
- [Draw.io](https://app.diagrams.net/)

## Contributing

When contributing to the MyCoder project, please refer to this architecture documentation to understand the system design and ensure your changes align with the existing architecture.

## Future Enhancements

Potential areas for future architecture enhancements:

1. Additional tool categories
2. Enhanced parallel processing
3. More specialized AI models for specific tasks
4. Integration with cloud services
5. Improved error handling and recovery
