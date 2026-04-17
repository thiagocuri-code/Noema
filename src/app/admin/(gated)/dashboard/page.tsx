import {
  getStudentMetrics,
  getEngagementMetrics,
  getDbSize,
  getTokenMetrics,
  getKbCount,
} from "@/lib/admin-metrics"
import { getOpenAIUsageSummary } from "@/lib/openai-usage"

export const dynamic = "force-dynamic"

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(n < 1 ? 4 : 2)}`
}

function fmtTokens(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`
  return `${(n / 1_000_000).toFixed(2)}M`
}

export default async function DashboardPage() {
  const [students, engagement, db, tokens, kb, openai] = await Promise.all([
    getStudentMetrics(),
    getEngagementMetrics(),
    getDbSize(),
    getTokenMetrics(),
    getKbCount(),
    getOpenAIUsageSummary().catch((e: unknown) => ({
      available: false,
      costUsd7d: 0,
      costUsd30d: 0,
      costUsdMtd: 0,
      inputTokens30d: 0,
      outputTokens30d: 0,
      error: e instanceof Error ? e.message : String(e),
    })),
  ])

  const engagementRate = students.totalEdu > 0 ? (students.active7d / students.totalEdu) * 100 : 0

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0a1a4a]">Dashboard</h1>
        <p className="text-sm text-gray-500">Visão geral da plataforma. Alunos contam apenas contas @edu.</p>
      </div>

      {/* Alunos + Engajamento */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Alunos (@edu)</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="Total" value={String(students.totalEdu)} />
          <Card
            label="Ativos 7d"
            value={String(students.active7d)}
            sub={`${engagementRate.toFixed(0)}% da base`}
          />
          <Card label="Engajados 7d" value={String(students.engaged7d)} sub="≥3 interações" />
          <Card label="Inativos 30d" value={String(students.inactive30d)} tone="warning" />
        </div>
      </section>

      {/* Engajamento detalhado */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Uso (@edu)</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="IA chats 7d" value={String(engagement.aiInteractions7d)} sub={`${engagement.aiInteractions30d} em 30d`} />
          <Card label="Sessões estudo 7d" value={String(engagement.studyInteractions7d)} />
          <Card label="Provas ativas 7d" value={String(engagement.examSessionsActive7d)} />
          <Card label="Provas totais" value={String(engagement.totalExamSessions)} />
        </div>
      </section>

      {/* Custo IA (OpenAI) */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
          Custo IA (USD) {openai.available ? <span className="ml-2 normal-case text-gray-400">· fonte: OpenAI</span> : null}
        </h2>
        {openai.available ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card label="Últimos 7 dias" value={fmtUsd(openai.costUsd7d)} />
              <Card label="Últimos 30 dias" value={fmtUsd(openai.costUsd30d)} />
              <Card label="Mês atual" value={fmtUsd(openai.costUsdMtd)} />
              <Card
                label="Tokens 30d"
                value={fmtTokens(openai.inputTokens30d + openai.outputTokens30d)}
                sub={`${fmtTokens(openai.inputTokens30d)} in · ${fmtTokens(openai.outputTokens30d)} out`}
              />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p>Não foi possível carregar custos da OpenAI.</p>
            {openai.error && (
              <p className="mt-2 font-mono text-xs text-amber-900">{openai.error}</p>
            )}
          </div>
        )}

        {tokens.byRoute.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-xs font-semibold text-gray-500">Breakdown interno por rota (desde o início do tracking)</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Breakdown
                title="Por modelo"
                rows={tokens.byModel.map((r) => ({
                  label: `${r.provider}/${r.model}`,
                  value: fmtUsd(r.costUsd),
                  meta: `${r.calls} chamadas`,
                }))}
              />
              <Breakdown
                title="Por rota"
                rows={tokens.byRoute.map((r) => ({
                  label: r.route,
                  value: fmtUsd(r.costUsd),
                  meta: `${r.calls} chamadas`,
                }))}
              />
            </div>
          </div>
        )}
      </section>

      {/* Banco de dados */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Banco de Dados</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="Tamanho total" value={fmtBytes(db.totalBytes)} sub="Supabase free: 500 MB" />
          <Card label="Tabelas" value={String(db.tables.length)} />
        </div>

        {db.tables.length > 0 && (
          <div className="mt-4">
            <Breakdown
              title="Top tabelas"
              rows={db.tables.map((t) => ({
                label: t.name,
                value: fmtBytes(t.bytes),
                meta: `${t.rows.toLocaleString()} linhas`,
              }))}
            />
          </div>
        )}
      </section>

      {/* Base de conhecimento */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Base de Conhecimento</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="Total" value={String(kb.total)} />
          <Card label="1º ano" value={String(kb.byGrade[1] ?? 0)} />
          <Card label="2º ano" value={String(kb.byGrade[2] ?? 0)} />
          <Card label="3º ano" value={String(kb.byGrade[3] ?? 0)} />
        </div>
      </section>
    </div>
  )
}

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warning" }) {
  const toneClass = tone === "warning" ? "text-amber-600" : "text-[#0a1a4a]"
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

function Breakdown({ title, rows }: { title: string; rows: Array<{ label: string; value: string; meta?: string }> }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-gray-700">{r.label}</span>
            <span className="shrink-0 text-right">
              <span className="font-semibold text-[#0a1a4a]">{r.value}</span>
              {r.meta && <span className="ml-2 text-xs text-gray-400">{r.meta}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
