export const getAnthropicApiKeyError = () => `
Error: ANTHROPIC_API_KEY environment variable is not set

To use this tool, you need an Anthropic API key:
1. Get an API key from https://www.anthropic.com/api
2. Set it as an environment variable:
   export ANTHROPIC_API_KEY='your-api-key'
   
   Or add it to your .env file:
   ANTHROPIC_API_KEY=your-api-key
`;