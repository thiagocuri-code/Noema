import { prisma } from "./prisma"
import { computeCostUsd } from "./ai-pricing"

type UsageInput = {
  provider: "anthropic" | "openai"
  model: string
  inputTokens: number
  outputTokens: number
  route: string
  studentId?: string | null
}

export async function trackAiUsage(input: UsageInput): Promise<void> {
  try {
    const costUsd = computeCostUsd(input.provider, input.model, input.inputTokens, input.outputTokens)
    await prisma.aiUsage.create({
      data: {
        provider: input.provider,
        model: input.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        costUsd,
        route: input.route,
        studentId: input.studentId ?? null,
      },
    })
  } catch (err: any) {
    console.error("[ai-track] failed:", err?.message)
  }
}

export function extractAnthropicUsage(resp: any): { inputTokens: number; outputTokens: number } {
  const u = resp?.usage || {}
  return {
    inputTokens: (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0),
    outputTokens: u.output_tokens || 0,
  }
}

export function extractOpenAIUsage(resp: any): { inputTokens: number; outputTokens: number } {
  const u = resp?.usage || {}
  return {
    inputTokens: u.prompt_tokens || u.input_tokens || 0,
    outputTokens: u.completion_tokens || u.output_tokens || 0,
  }
}
