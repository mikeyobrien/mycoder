# Contributing

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