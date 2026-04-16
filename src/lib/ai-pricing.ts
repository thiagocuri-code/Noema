// USD per 1M tokens (input, output). Update when rates change.
type Rate = { input: number; output: number }

const ANTHROPIC: Record<string, Rate> = {
  "claude-opus-4-6": { input: 15, output: 75 },
  "claude-opus-4": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  "claude-sonnet-4": { input: 3, output: 15 },
  "claude-3-7-sonnet-latest": { input: 3, output: 15 },
  "claude-3-5-sonnet-latest": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
  "claude-3-5-haiku-latest": { input: 0.8, output: 4 },
}

const OPENAI: Record<string, Rate> = {
  "gpt-5": { input: 5, output: 20 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "o3-mini": { input: 1.1, output: 4.4 },
}

const FALLBACK: Rate = { input: 3, output: 15 }

export function getRate(provider: string, model: string): Rate {
  const table = provider === "anthropic" ? ANTHROPIC : OPENAI
  return table[model] || FALLBACK
}

export function computeCostUsd(provider: string, model: string, inputTokens: number, outputTokens: number): number {
  const rate = getRate(provider, model)
  return (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output
}
