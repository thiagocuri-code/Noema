const BASE = "https://api.openai.com/v1/organization"

type CostBucket = {
  start_time: number
  end_time: number
  results: Array<{ amount: { value: string; currency: string } }>
}

type UsageBucket = {
  start_time: number
  end_time: number
  results: Array<{ input_tokens?: number; output_tokens?: number }>
}

type Page<T> = { data: T[]; has_more: boolean; next_page?: string }

function adminKey(): string | null {
  return process.env.OPENAI_ADMIN_KEY || null
}

async function fetchPaged<T>(url: string, headers: HeadersInit): Promise<T[]> {
  const all: T[] = []
  let next: string | undefined
  do {
    const u = next ? `${url}&page=${encodeURIComponent(next)}` : url
    const res = await fetch(u, { headers, cache: "no-store" })
    if (!res.ok) throw new Error(`OpenAI usage API ${res.status}: ${await res.text()}`)
    const page = (await res.json()) as Page<T>
    all.push(...page.data)
    next = page.has_more ? page.next_page : undefined
  } while (next)
  return all
}

function startOfDayUnix(daysAgo: number): number {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return Math.floor(d.getTime() / 1000)
}

function startOfMonthUnix(): number {
  const d = new Date()
  return Math.floor(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).getTime() / 1000)
}

async function sumCosts(startTime: number): Promise<number> {
  const key = adminKey()
  if (!key) return 0
  const url = `${BASE}/costs?start_time=${startTime}&bucket_width=1d&limit=180`
  const buckets = await fetchPaged<CostBucket>(url, { Authorization: `Bearer ${key}` })
  let total = 0
  for (const b of buckets) for (const r of b.results) total += parseFloat(r.amount?.value ?? "0") || 0
  return total
}

async function sumUsage(startTime: number): Promise<{ input: number; output: number }> {
  const key = adminKey()
  if (!key) return { input: 0, output: 0 }
  const url = `${BASE}/usage/completions?start_time=${startTime}&bucket_width=1d&limit=180`
  const buckets = await fetchPaged<UsageBucket>(url, { Authorization: `Bearer ${key}` })
  let input = 0
  let output = 0
  for (const b of buckets) {
    for (const r of b.results) {
      input += r.input_tokens || 0
      output += r.output_tokens || 0
    }
  }
  return { input, output }
}

export type OpenAIUsageSummary = {
  available: boolean
  costUsd7d: number
  costUsd30d: number
  costUsdMtd: number
  inputTokens30d: number
  outputTokens30d: number
}

export async function getOpenAIUsageSummary(): Promise<OpenAIUsageSummary> {
  if (!adminKey()) {
    return {
      available: false,
      costUsd7d: 0,
      costUsd30d: 0,
      costUsdMtd: 0,
      inputTokens30d: 0,
      outputTokens30d: 0,
    }
  }

  const [cost7, cost30, costMtd, usage30] = await Promise.all([
    sumCosts(startOfDayUnix(7)),
    sumCosts(startOfDayUnix(30)),
    sumCosts(startOfMonthUnix()),
    sumUsage(startOfDayUnix(30)),
  ])

  return {
    available: true,
    costUsd7d: cost7,
    costUsd30d: cost30,
    costUsdMtd: costMtd,
    inputTokens30d: usage30.input,
    outputTokens30d: usage30.output,
  }
}
