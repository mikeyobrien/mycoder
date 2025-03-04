# GitHub Mode for MyCoder

GitHub mode enables MyCoder to work with GitHub issues and PRs as part of its workflow. This feature provides better continuity between sessions and makes it easier to track progress on larger projects.

## Overview

When GitHub mode is enabled, MyCoder will:

- Start from existing GitHub issues or create new ones for tasks
- Create branches for issues it's working on
- Make commits with descriptive messages
- Create PRs when work is complete
- Create additional GitHub issues for follow-up tasks or ideas

## Prerequisites

Before using GitHub mode, ensure you have:

1. Installed the GitHub CLI (`gh`)
2. Authenticated with GitHub (`gh auth login`)
3. Appropriate permissions for your target repository

## Enabling GitHub Mode

You can enable GitHub mode using the `config` command:

```bash
mycoder config set githubMode true
```

To disable GitHub mode:

```bash
mycoder config set githubMode false
```

To check if GitHub mode is enabled:

```bash
mycoder config get githubMode
```

## Using GitHub Mode

When GitHub mode is enabled, MyCoder will automatically include GitHub-specific instructions in its system prompt. You can ask MyCoder to:

1. **Work on existing issues**:

   ```bash
   mycoder "Implement GitHub issue #42"
   ```

2. **Create new issues**:

   ```bash
   mycoder "Create a GitHub issue for adding dark mode to the UI"
   ```

3. **Create PRs for completed work**:
   ```bash
   mycoder "Create a PR for the changes I just made to fix issue #42"
   ```

## GitHub Commands

MyCoder uses the GitHub CLI directly. Here are some common commands it may use:

- **View issues**: `gh issue list --state open`
- **View a specific issue**: `gh issue view <number>`
- **Create an issue**: `gh issue create --title "Title" --body "Description"`
- **Create a PR**: `gh pr create --title "Title" --body "Description"`
- **Create a branch**: `git checkout -b branch-name`
- **Make commits**: `git commit -m "Descriptive message"`

## Configuration Storage

GitHub mode settings are stored in the `.mycoder/config.json` file in your home directory, along with other MyCoder settings.
