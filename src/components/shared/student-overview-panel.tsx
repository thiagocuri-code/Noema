"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useLang } from "@/lib/lang-context"
import { computeExamProgress, bandColor, bandLabel, type Band } from "@/lib/exam-progress"

interface Activity {
  courseId: string
  courseName: string
  id: string
  title: string
  alternateLink?: string
  dueDate?: string
  maxPoints?: number
  state: "PENDING" | "TURNED_IN" | "RETURNED" | "MISSING"
  late: boolean
  grade?: number
}

interface CourseStats {
  courseId: string
  courseName: string
  total: number
  pending: number
  missing: number
  turnedIn: number
  returned: number
  gradedCount: number
  avgGrade: number | null
}

interface Overall {
  total: number
  pending: number
  missing: number
  turnedIn: number
  returned: number
  gradedCount: number
  avgGrade: number | null
}

interface PlatformCourseSummary {
  avgScore: number
  totalActivities: number
}

interface CourseRef {
  id: string
  name: string
}

interface Props {
  accessToken: string
  translateCourseName: (name: string) => string
  platformSummary: Record<string, PlatformCourseSummary>
  courses: CourseRef[]
  googleId?: string
}

interface ExamSummary {
  id: string
  courseId: string
  courseName: string
  title: string
  examDate: string | null
  topicsWeak: string[]
  topicsReviewed: string[]
  diagnosticScore: number | null
  simuladoScores: number[]
  revisionCount: number
  flashcardsStudied: number
  updatedAt: string
}

function scoreColor(avg: number | null | undefined) {
  if (avg == null) return "#9ca3af"
  if (avg >= 70) return "#22c55e"
  if (avg >= 50) return "#f59e0b"
  return "#ef4444"
}

function BigRing({ value, suffix = "/100" }: { value: number | null; suffix?: string }) {
  const size = 96
  const stroke = 8
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = value != null ? Math.min(Math.max(value, 0), 100) : 0
  const dash = (pct / 100) * circ
  const color = scoreColor(value)
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>
          {value == null ? "—" : suffix === "%" ? `${value}%` : value}
        </span>
        {value != null && suffix !== "%" && (
          <span className="text-[10px] font-medium text-gray-400">{suffix}</span>
        )}
      </div>
    </div>
  )
}

function formatDate(iso: string | undefined, lang: string) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

export function StudentOverviewPanel({ accessToken, translateCourseName, platformSummary, courses, googleId }: Props) {
  const { t, lang } = useLang()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [overall, setOverall] = useState<Overall | null>(null)
  const [byCourse, setByCourse] = useState<Record<string, CourseStats>>({})
  const [activities, setActivities] = useState<Activity[]>([])
  const [tab, setTab] = useState<"pending" | "missing" | "subjects">("pending")
  const [expanded, setExpanded] = useState(false)
  const [view, setView] = useState<"exams" | "classroom" | "lotus">("exams")
  const [exams, setExams] = useState<ExamSummary[]>([])
  const [loadingExams, setLoadingExams] = useState(false)

  useEffect(() => {
    if (!googleId) return
    setLoadingExams(true)
    fetch(`/api/exam/list?googleId=${googleId}`)
      .then(r => r.json())
      .then(data => setExams(data.exams ?? []))
      .catch(() => { /* silent */ })
      .finally(() => setLoadingExams(false))
  }, [googleId])

  useEffect(() => {
    if (!accessToken) return
    setLoading(true)
    fetch(`/api/classroom/my-activities?accessToken=${accessToken}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else {
          setOverall(data.overall)
          setByCourse(data.byCourse ?? {})
          setActivities(data.activities ?? [])
        }
        setLoading(false)
      })
      .catch(() => {
        setError(t("Não foi possível carregar seu desempenho.", "Could not load your performance."))
        setLoading(false)
      })
  }, [accessToken])

  const pending = useMemo(
    () => activities.filter((a) => a.state === "PENDING").sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }),
    [activities]
  )

  const missing = useMemo(
    () => activities.filter((a) => a.state === "MISSING"),
    [activities]
  )

  const courseList = useMemo(
    () => Object.values(byCourse).sort((a, b) => b.total - a.total),
    [byCourse]
  )

  // Loading skeleton only blocks Classroom view. Exams tab renders its own state.
  if (loading && view === "classroom") {
    return (
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
      </div>
    )
  }

  if (error && view === "classroom") {
    return (
      <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  // Lotus (platform) aggregates — reused even if classroom data is empty
  const lotusEntries = Object.entries(platformSummary)
  const scored = lotusEntries.filter(([, v]) => v.avgScore > 0)
  const lotusAvg = scored.length
    ? Math.round(scored.reduce((a, [, v]) => a + v.avgScore, 0) / scored.length)
    : null
  const lotusTotalActivities = lotusEntries.reduce((a, [, v]) => a + v.totalActivities, 0)
  const lotusCourseRows = lotusEntries
    .map(([courseId, v]) => ({
      courseId,
      courseName: courses.find((c) => c.id === courseId)?.name ?? courseId,
      avgScore: v.avgScore > 0 ? Math.round(v.avgScore) : null,
      totalActivities: v.totalActivities,
    }))
    .sort((a, b) => b.totalActivities - a.totalActivities)

  const hasOverall = overall && overall.total > 0
  const delivered = hasOverall ? overall.turnedIn + overall.returned : 0
  const deliveryRate = hasOverall && overall.total > 0 ? Math.round((delivered / overall.total) * 100) : null

  const tabs: { key: typeof tab; label: string; count: number }[] = [
    { key: "pending", label: t("Pendentes", "Pending"), count: pending.length },
    { key: "missing", label: t("Atrasadas", "Missing"), count: missing.length },
    { key: "subjects", label: t("Matérias", "Subjects"), count: courseList.length },
  ]

  const activeList = tab === "pending" ? pending : tab === "missing" ? missing : []
  const visible = expanded ? activeList : activeList.slice(0, 5)

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
      {/* View toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-0.5 text-xs font-semibold">
          <button
            onClick={() => setView("exams")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all ${
              view === "exams" ? "bg-white text-[#0a1a4a] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>🎯</span>
            {t("Provas", "Exams")}
          </button>
          <button
            onClick={() => setView("classroom")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all ${
              view === "classroom" ? "bg-white text-[#0a1a4a] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>🎓</span>
            {t("Classroom", "Classroom")}
          </button>
          <button
            onClick={() => setView("lotus")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all ${
              view === "lotus" ? "bg-white text-[#0a1a4a] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>✨</span>
            {t("lótus", "lótus")}
          </button>
        </div>
      </div>

      {view === "exams" ? (
        <ExamPrepView
          exams={exams}
          loading={loadingExams}
          translateCourseName={translateCourseName}
          t={t}
          lang={lang}
          courses={courses}
        />
      ) : view === "classroom" ? (
        hasOverall ? (
        <>
      {/* Header: overall */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <BigRing value={deliveryRate} suffix="%" />
          <div>
            <h2 className="font-[var(--font-heading)] text-lg font-bold text-[#1a1a2e]">
              {t("Seu painel de desempenho", "Your performance panel")}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {t(
                `${delivered} de ${overall.total} atividade${overall.total !== 1 ? "s" : ""} entregue${delivered !== 1 ? "s" : ""}`,
                `${delivered} of ${overall.total} activit${overall.total !== 1 ? "ies" : "y"} delivered`
              )}
              {overall.avgGrade != null && (
                <>
                  {" · "}
                  {t(
                    `média ${overall.avgGrade}`,
                    `avg ${overall.avgGrade}`
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:flex sm:gap-3">
          <Stat label={t("Total", "Total")} value={overall.total} tone="neutral" />
          <Stat label={t("Pendentes", "Pending")} value={overall.pending} tone="amber" />
          <Stat label={t("Atrasadas", "Missing")} value={overall.missing} tone="red" />
          <Stat label={t("Entregues", "Done")} value={overall.turnedIn + overall.returned} tone="green" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 border-b border-gray-100">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => { setTab(tb.key); setExpanded(false) }}
            className={`relative px-3 py-2 text-xs font-semibold transition-colors ${
              tab === tb.key ? "text-[#0a1a4a]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tb.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
              tab === tb.key ? "bg-[#0a1a4a] text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {tb.count}
            </span>
            {tab === tb.key && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#0a1a4a]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {tab === "subjects" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {courseList.map((c) => {
              const cDone = c.turnedIn + c.returned
              const cRate = c.total > 0 ? Math.round((cDone / c.total) * 100) : null
              return (
                <div
                  key={c.courseId}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: scoreColor(cRate) + "22",
                      color: scoreColor(cRate),
                    }}
                  >
                    {cRate != null ? `${cRate}%` : "—"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1a1a2e]">
                      {translateCourseName(c.courseName)}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {t(
                        `${cDone}/${c.total} entregues · ${c.pending} pendentes${c.missing ? ` · ${c.missing} atrasadas` : ""}`,
                        `${cDone}/${c.total} done · ${c.pending} pending${c.missing ? ` · ${c.missing} missing` : ""}`
                      )}
                      {c.avgGrade != null && (
                        <> {t(`· média ${c.avgGrade}`, `· avg ${c.avgGrade}`)}</>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : activeList.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            {tab === "pending"
              ? t("Sem atividades pendentes 🎉", "No pending activities 🎉")
              : t("Nenhuma atividade atrasada.", "No missing activities.")}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {visible.map((a) => {
                const due = formatDate(a.dueDate, lang)
                const isMissing = a.state === "MISSING"
                return (
                  <li key={`${a.courseId}-${a.id}`} className="flex items-center gap-3 py-2.5">
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: isMissing ? "#ef4444" : "#f59e0b" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#1a1a2e]">{a.title}</p>
                      <p className="truncate text-[11px] text-gray-500">
                        {translateCourseName(a.courseName)}
                      </p>
                    </div>
                    {due && (
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isMissing
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isMissing ? t("Atrasada · ", "Late · ") : ""}{due}
                      </span>
                    )}
                    {a.alternateLink && (
                      <a
                        href={a.alternateLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-shrink-0 text-[11px] font-medium text-[#0a1a4a] hover:underline"
                      >
                        {t("Abrir →", "Open →")}
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
            {activeList.length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 w-full rounded-lg border border-gray-100 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
              >
                {expanded
                  ? t("Mostrar menos", "Show less")
                  : t(`Ver todas (${activeList.length})`, `Show all (${activeList.length})`)}
              </button>
            )}
          </>
        )}
      </div>
        </>
        ) : (
          <div className="py-10 text-center text-sm text-gray-400">
            {t("Sem atividades no Classroom ainda.", "No Classroom activities yet.")}
          </div>
        )
      ) : (
        <LotusView
          avg={lotusAvg}
          totalActivities={lotusTotalActivities}
          rows={lotusCourseRows}
          translateCourseName={translateCourseName}
          t={t}
        />
      )}
    </div>
  )
}

// ── Exam Prep View ────────────────────────────────────────────────────────────
function ExamPrepView({
  exams,
  loading,
  translateCourseName,
  t,
  lang,
  courses,
}: {
  exams: ExamSummary[]
  loading: boolean
  translateCourseName: (name: string) => string
  t: (pt: string, en: string) => string
  lang: string
  courses: CourseRef[]
}) {
  const [now] = useState(() => Date.now())
  if (loading) {
    return <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
  }

  const activeExams = exams.filter(e => {
    if (!e.examDate) return true
    return new Date(e.examDate).getTime() >= now - 86400000
  })

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-[var(--font-heading)] text-lg font-bold text-[#1a1a2e]">
            {t("Estudar para provas", "Exam prep")}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {t(
              "Crie um plano de estudo focado em uma prova específica — a lótus vai diagnosticar suas dificuldades e priorizar o que importa.",
              "Create a focused study plan for a specific exam — lótus diagnoses your gaps and prioritizes what matters."
            )}
          </p>
        </div>
        <Link
          href="/dashboard/student/exam-prep/new"
          className="flex-shrink-0 rounded-xl bg-[#0a1a4a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#071245] text-center"
        >
          {t("+ Nova prova", "+ New exam")}
        </Link>
      </div>

      <div className="mt-5">
        {activeExams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-12 text-center">
            <div className="text-3xl mb-3">🎯</div>
            <p className="text-sm font-semibold text-[#1a1a2e]">
              {t("Nenhuma prova ativa", "No active exams")}
            </p>
            <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
              {t(
                "Escolha uma matéria, selecione os arquivos da prova e responda um diagnóstico rápido para a lótus entender onde você precisa de mais ajuda.",
                "Pick a subject, select the exam files and take a quick diagnostic — lótus will map where you need the most help."
              )}
            </p>
            {courses.length > 0 && (
              <Link
                href="/dashboard/student/exam-prep/new"
                className="mt-4 inline-block rounded-xl bg-[#0a1a4a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#071245]"
              >
                {t("Começar agora →", "Start now →")}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeExams.map(exam => (
              <ExamCard key={exam.id} exam={exam} translateCourseName={translateCourseName} t={t} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function ExamCard({
  exam,
  translateCourseName,
  t,
  lang,
}: {
  exam: ExamSummary
  translateCourseName: (name: string) => string
  t: (pt: string, en: string) => string
  lang: string
}) {
  const [now] = useState(() => Date.now())
  const progress = computeExamProgress({
    diagnosticScore: exam.diagnosticScore,
    simuladoScores: exam.simuladoScores,
    revisionCount: exam.revisionCount,
    flashcardsStudied: exam.flashcardsStudied,
    topicsWeak: exam.topicsWeak,
    topicsReviewed: exam.topicsReviewed,
  })
  const colors = bandColor(progress.band)
  const label = bandLabel(progress.band, lang)

  let dueLabel: string | null = null
  if (exam.examDate) {
    const due = new Date(exam.examDate)
    const diff = Math.ceil((due.getTime() - now) / 86400000)
    if (diff < 0) dueLabel = t(`há ${-diff}d`, `${-diff}d ago`)
    else if (diff === 0) dueLabel = t("hoje", "today")
    else if (diff === 1) dueLabel = t("amanhã", "tomorrow")
    else dueLabel = t(`em ${diff}d`, `in ${diff}d`)
  }

  return (
    <Link
      href={`/dashboard/student/exam-prep/${exam.id}`}
      className={`block rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {translateCourseName(exam.courseName)}
          </p>
          <h3 className="mt-0.5 truncate text-sm font-bold text-[#1a1a2e]">{exam.title}</h3>
          {dueLabel && (
            <p className="mt-0.5 text-[11px] text-gray-500">
              {t("Prova ", "Exam ")}{dueLabel}
            </p>
          )}
        </div>
        <div
          className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-full border-2 text-xs font-bold"
          style={{ borderColor: colors.hex, color: colors.hex }}
        >
          <span className="leading-none">{label.abbr}</span>
          <span className="mt-0.5 text-[9px] leading-none opacity-70">{progress.score}%</span>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/60">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress.score}%`, backgroundColor: colors.hex }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-gray-500">
        <span className="rounded-full bg-white/70 px-2 py-0.5">
          📊 {exam.simuladoScores.length} {t("simulados", "simulados")}
        </span>
        <span className="rounded-full bg-white/70 px-2 py-0.5">
          🔁 {exam.revisionCount} {t("revisões", "revisions")}
        </span>
        <span className="rounded-full bg-white/70 px-2 py-0.5">
          🃏 {exam.flashcardsStudied} {t("flashcards", "flashcards")}
        </span>
        {exam.topicsWeak.length > 0 && (
          <span className="rounded-full bg-white/70 px-2 py-0.5">
            ⚠️ {exam.topicsWeak.length - exam.topicsWeak.filter(tp => exam.topicsReviewed.includes(tp)).length} {t("tópicos fracos", "weak topics")}
          </span>
        )}
      </div>
    </Link>
  )
}

function LotusView({
  avg,
  totalActivities,
  rows,
  translateCourseName,
  t,
}: {
  avg: number | null
  totalActivities: number
  rows: { courseId: string; courseName: string; avgScore: number | null; totalActivities: number }[]
  translateCourseName: (name: string) => string
  t: (pt: string, en: string) => string
}) {
  const subjectsWithActivity = rows.filter((r) => r.totalActivities > 0).length
  const gradedSubjects = rows.filter((r) => r.avgScore != null).length

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <BigRing value={avg} />
          <div>
            <h2 className="font-[var(--font-heading)] text-lg font-bold text-[#1a1a2e]">
              {t("Desempenho na lótus", "Performance on lótus")}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {avg != null
                ? t(
                    `Média nos quizzes e estudos em ${gradedSubjects} matéria${gradedSubjects !== 1 ? "s" : ""}`,
                    `Quiz & study average across ${gradedSubjects} subject${gradedSubjects !== 1 ? "s" : ""}`
                  )
                : t(
                    "Responda quizzes no chat para ver seu desempenho aqui.",
                    "Take quizzes in the chat to see your performance here."
                  )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
          <Stat label={t("Interações", "Sessions")} value={totalActivities} tone="neutral" />
          <Stat label={t("Matérias", "Subjects")} value={subjectsWithActivity} tone="neutral" />
          <Stat label={t("Avaliadas", "Graded")} value={gradedSubjects} tone="green" />
        </div>
      </div>

      <div className="mt-5">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center">
            <p className="text-sm text-gray-400">
              {t(
                "Nenhuma atividade na lótus ainda. Entre em uma matéria e comece um estudo ou quiz.",
                "No lótus activity yet. Open a subject and start a study session or quiz."
              )}
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((r) => (
              <div
                key={r.courseId}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: scoreColor(r.avgScore) + "22",
                    color: scoreColor(r.avgScore),
                  }}
                >
                  {r.avgScore != null ? r.avgScore : "—"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1a1a2e]">
                    {translateCourseName(r.courseName)}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {t(
                      `${r.totalActivities} interaç${r.totalActivities !== 1 ? "ões" : "ão"}`,
                      `${r.totalActivities} session${r.totalActivities !== 1 ? "s" : ""}`
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "neutral" | "amber" | "red" | "green"
}) {
  const toneMap = {
    neutral: "text-gray-700",
    amber: "text-amber-600",
    red: "text-red-600",
    green: "text-green-600",
  }
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2 text-center sm:min-w-[72px]">
      <p className={`text-lg font-bold leading-none ${toneMap[tone]}`}>{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
    </div>
  )
}
