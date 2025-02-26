export const getAnthropicApiKeyError = () => `
Error: ANTHROPIC_API_KEY environment variable is not set

Before using MyCoder, you must have an ANTHROPIC_API_KEY specified either:

- As an environment variable, "export ANTHROPIC_API_KEY=[your-api-key]" or
- In a .env file in the folder you run "mycoder" from

Get an API key from https://www.anthropic.com/api
`;
