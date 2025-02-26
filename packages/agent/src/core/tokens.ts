import Anthropic from '@anthropic-ai/sdk';

export type TokenUsage = {
  input: number;
  inputCacheWrites: number;
  inputCacheReads: number;
  output: number;
};

export const getTokenUsage = (response: Anthropic.Message): TokenUsage => {
  return {
    input: response.usage.input_tokens,
    inputCacheWrites: response.usage.cache_creation_input_tokens ?? 0,
    inputCacheReads: response.usage.cache_read_input_tokens ?? 0,
    output: response.usage.output_tokens,
  };
};

export const addTokenUsage = (a: TokenUsage, b: TokenUsage): TokenUsage => {
  return {
    input: a.input + b.input,
    inputCacheWrites: a.inputCacheWrites + b.inputCacheWrites,
    inputCacheReads: a.inputCacheReads + b.inputCacheReads,
    output: a.output + b.output,
  };
};

const PER_MILLION = 1 / 1000000;
const TOKEN_COST: TokenUsage = {
  input: 3 * PER_MILLION,
  inputCacheWrites: 3.75 * PER_MILLION,
  inputCacheReads: 0.3 * PER_MILLION,
  output: 15 * PER_MILLION,
};

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export const getTokenCost = (usage: TokenUsage): string => {
  return formatter.format(
    usage.input * TOKEN_COST.input +
      usage.inputCacheWrites * TOKEN_COST.inputCacheWrites +
      usage.inputCacheReads * TOKEN_COST.inputCacheReads +
      usage.output * TOKEN_COST.output,
  );
};

export const getTokenString = (usage: TokenUsage): string => {
  return `input: ${usage.input} input-cache-writes: ${usage.inputCacheWrites} input-cache-reads: ${usage.inputCacheReads} output: ${usage.output} COST: ${getTokenCost(usage)}`;
};
