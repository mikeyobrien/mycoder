# MyCoder CLI

Command-line interface for AI-powered coding tasks.

## Features

- 🤖 **AI-Powered**: Leverages Anthropic's Claude and OpenAI models for intelligent coding assistance
- 🛠️ **Extensible Tool System**: Modular architecture with various tool categories
- 🔄 **Parallel Execution**: Ability to spawn sub-agents for concurrent task processing
- 📝 **Self-Modification**: Can modify code, it was built and tested by writing itself
- 🔍 **Smart Logging**: Hierarchical, color-coded logging system for clear output
- 👤 **Human Compatible**: Uses README.md, project files and shell commands to build its own context
- 🌐 **GitHub Integration**: GitHub mode for working with issues and PRs as part of workflow

## Installation

```bash
npm install -g mycoder
```

## Usage

```bash
# Interactive mode
mycoder -i

# Run with a prompt
mycoder "Implement a React component that displays a list of items"

# Run with a prompt from a file
mycoder -f prompt.txt

# Enable GitHub mode
mycoder config set githubMode true
```

## GitHub Mode

MyCoder includes a GitHub mode that enables the agent to work with GitHub issues and PRs as part of its workflow. When enabled, the agent will:

- Start from existing GitHub issues or create new ones for tasks
- Create branches for issues it's working on
- Make commits with descriptive messages
- Create PRs when work is complete
- Create additional GitHub issues for follow-up tasks or ideas

To enable GitHub mode:

```bash
mycoder config set githubMode true
```

To disable GitHub mode:

```bash
mycoder config set githubMode false
```

Requirements for GitHub mode:

- GitHub CLI (`gh`) needs to be installed and authenticated
- User needs to have appropriate GitHub permissions for the target repository

When using GitHub mode, MyCoder uses temporary markdown files for creating issues, PRs, and comments to ensure proper formatting:

```bash
# Example of how MyCoder handles GitHub content
# 1. Creates a temporary markdown file
cat > temp.md << 'EOF'
## Description
This is a description with proper
newlines and formatting.

- Bullet point 1
- Bullet point 2
EOF

# 2. Uses the file with GitHub CLI
gh issue create --title "Issue Title" --body-file temp.md

# 3. Cleans up the temporary file
rm temp.md
```

This approach ensures that formatting, newlines, and special characters are preserved correctly in GitHub content.

## Configuration

MyCoder stores configuration in `~/.mycoder/config.json`. You can manage configuration using the `config` command:

```bash
# List all configuration
mycoder config list

# Get a specific configuration value
mycoder config get githubMode

# Set a configuration value
mycoder config set githubMode true

# Configure model provider and model name
mycoder config set modelProvider openai
mycoder config set modelName gpt-4o-2024-05-13
```

### Model Selection

MyCoder supports both Anthropic and OpenAI models. You can configure which model to use with the following commands:

```bash
# Use OpenAI's GPT-4o model
mycoder config set modelProvider openai
mycoder config set modelName gpt-4o-2024-05-13

# Use OpenAI's o3-mini model
mycoder config set modelProvider openai
mycoder config set modelName o3-mini-2024-07-18

# Use Anthropic's Claude 3.7 Sonnet model
mycoder config set modelProvider anthropic
mycoder config set modelName claude-3-7-sonnet-20250219

# Use Anthropic's Claude 3 Opus model
mycoder config set modelProvider anthropic
mycoder config set modelName claude-3-opus-20240229
```

You can also specify the model provider and name directly when running a command:

```bash
mycoder --modelProvider openai --modelName gpt-4o-2024-05-13 "Your prompt here"
```

### Available Configuration Options

- `githubMode`: Enable GitHub mode for working with issues and PRs (default: `false`)
- `headless`: Run browser in headless mode with no UI showing (default: `true`)
- `userSession`: Use user's existing browser session instead of sandboxed session (default: `false`)
- `pageFilter`: Method to process webpage content: 'simple', 'none', or 'readability' (default: `none`)

Example:

```bash
# Set browser to show UI
mycoder config set headless false

# Use existing browser session
mycoder config set userSession true

# Use readability for webpage processing
mycoder config set pageFilter readability
```

## Environment Variables

- `ANTHROPIC_API_KEY`: Your Anthropic API key (required when using Anthropic models)
- `OPENAI_API_KEY`: Your OpenAI API key (required when using OpenAI models)

## Development

```bash
# Clone the repository
git clone https://github.com/drivecore/mycoder.git
cd mycoder

# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Run the locally built CLI
pnpm cli -i
```

## License

MIT
