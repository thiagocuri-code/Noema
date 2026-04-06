"use client"

import { useEffect, useRef, useState } from "react"
import { AthenaLogo } from "@/components/shared/athena-logo"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"

// ── Types ──────────────────────────────────────────────────────────────────────
interface Performance {
  id: string
  courseId: string
  courseName: string
  activityName: string
  score: number
  feedback: string
  submittedAt: string
}

interface StudentProfile {
  learningStyle: string
  goal: string
  hardSubject: string
  helpPreference: string
  studyTime: string
  feedbackStyle: string
  schoolYear: string
}

interface StudyInteraction {
  id: string
  courseId: string
  courseName: string
  type: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

interface Student {
  id: string
  googleId: string
  name: string
  email: string
  image: string | null
  createdAt: string
  profile: StudentProfile | null
  performances: Performance[]
  studyInteractions: StudyInteraction[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function avg(nums: number[]) {
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function avgColor(score: number | null) {
  if (score === null) return "#9ca3af"
  if (score >= 7) return "#22c55e"
  if (score >= 5) return "#f59e0b"
  return "#ef4444"
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

const PROFILE_LABELS: { key: keyof StudentProfile; icon: string; label: string }[] = [
  { key: "learningStyle", icon: "🧠", label: "Perfil" },
  { key: "goal", icon: "🎯", label: "Objetivo / Área" },
  { key: "hardSubject", icon: "📚", label: "Maior dificuldade" },
  { key: "schoolYear", icon: "💪", label: "Maior facilidade" },
  { key: "helpPreference", icon: "💡", label: "Formato de ajuda" },
  { key: "studyTime", icon: "📖", label: "Estilo de aprendizagem" },
  { key: "feedbackStyle", icon: "💬", label: "Tom do feedback" },
]

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, value * 10)}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold" style={{ color }}>
        {value.toFixed(1)}
      </span>
    </div>
  )
}

// ── Student Drawer ─────────────────────────────────────────────────────────────
function StudentDrawer({
  student,
  onClose,
}: {
  student: Student
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const avgScore = avg(student.performances.map(p => p.score))
  const revisoes = student.studyInteractions.filter(si => si.type === "revisao").length
  const darwinMsgs = student.studyInteractions
    .filter(si => si.type === "darwin")
    .reduce((sum, si) => sum + ((si.metadata as any)?.messagesCount ?? 1), 0)
  const chartData = [...student.performances]
    .reverse()
    .map((p, i) => ({
      name: p.activityName.length > 15 ? p.activityName.slice(0, 13) + "…" : p.activityName,
      nota: p.score,
      index: i + 1,
    }))

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        ref={ref}
        className="relative z-10 flex h-full w-full max-w-[100vw] sm:max-w-md flex-col bg-white shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="font-[var(--font-heading)] text-sm font-bold text-[#1a1a2e]">
            Perfil do Aluno
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Identity */}
          <div className="flex items-center gap-4">
            {student.image ? (
              <img
                src={student.image}
                alt={student.name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-[#0a1a4a]/20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0a1a4a]/10 text-lg font-bold text-[#0a1a4a]">
                {initials(student.name)}
              </div>
            )}
            <div>
              <p className="font-[var(--font-heading)] text-base font-bold text-[#1a1a2e]">
                {student.name}
              </p>
              <p className="text-xs text-gray-400">{student.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {avgScore !== null && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: avgColor(avgScore) }}
                  >
                    Média {avgScore.toFixed(0)}%
                  </span>
                )}
                <span className="rounded-full bg-[#8b5cf6]/10 px-2 py-0.5 text-xs font-semibold text-[#8b5cf6]">
                  {student.performances.length} simulados
                </span>
                <span className="rounded-full bg-[#14b8a6]/10 px-2 py-0.5 text-xs font-semibold text-[#14b8a6]">
                  {revisoes} revisões
                </span>
                <span className="rounded-full bg-[#f97316]/10 px-2 py-0.5 text-xs font-semibold text-[#f97316]">
                  {darwinMsgs} perguntas
                </span>
              </div>
            </div>
          </div>

          {/* Profile cards */}
          {student.profile ? (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Perfil de Aprendizado
              </p>
              <div className="space-y-2">
                {PROFILE_LABELS.map(f => (
                  <div
                    key={f.key}
                    className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <span className="text-base">{f.icon}</span>
                    <div>
                      <p className="text-xs text-gray-400">{f.label}</p>
                      <p className="text-sm font-semibold text-[#1a1a2e]">
                        {student.profile![f.key]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
              Perfil não preenchido ainda.
            </div>
          )}

          {/* Performance chart */}
          {chartData.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Evolução das Notas
              </p>
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="index" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11 }}
                      formatter={(v) => [typeof v === "number" ? v.toFixed(1) : v, "Nota"]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
                    />
                    <Line
                      type="monotone"
                      dataKey="nota"
                      stroke="#0a1a4a"
                      strokeWidth={2}
                      dot={{ fill: "#0a1a4a", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Performance list */}
          {student.performances.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Atividades Entregues
              </p>
              <div className="space-y-2">
                {student.performances.map(p => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a1a2e] truncate">
                          {p.activityName}
                        </p>
                        <p className="text-xs text-gray-400">{p.courseName}</p>
                        {p.feedback && (
                          <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
                            {p.feedback}
                          </p>
                        )}
                      </div>
                      <span
                        className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: avgColor(p.score) }}
                      >
                        {p.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {student.performances.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
              Nenhuma atividade entregue ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TeacherDashboardReal() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [filterCourse, setFilterCourse] = useState("all")

  useEffect(() => {
    fetch("/api/teacher/students?code=TRIX2026")
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setStudents(data.students ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError("Erro ao carregar dados.")
        setLoading(false)
      })
  }, [])

  // ── Derived metrics ──────────────────────────────────────────────────────
  const totalStudents = students.length
  const withProfile = students.filter(s => s.profile !== null).length
  const allPerfs = students.flatMap(s => s.performances)
  const totalSimulados = allPerfs.length
  const globalAvg =
    allPerfs.length > 0
      ? allPerfs.reduce((sum, p) => sum + p.score, 0) / allPerfs.length
      : null
  const allInteractions = students.flatMap(s => s.studyInteractions)
  const totalRevisoes = allInteractions.filter(si => si.type === "revisao").length
  const totalDarwin = allInteractions
    .filter(si => si.type === "darwin")
    .reduce((sum, si) => sum + ((si.metadata as any)?.messagesCount ?? 1), 0)

  // Unique courses from performances
  const allCourses = Array.from(
    new Map(allPerfs.map(p => [p.courseId, p.courseName])).entries()
  ).map(([id, name]) => ({ id, name }))

  // Filtered students
  const filteredStudents =
    filterCourse === "all"
      ? students
      : students.filter(s =>
          s.performances.some(p => p.courseId === filterCourse)
        )

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Drawer */}
      {selectedStudent && (
        <StudentDrawer
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <AthenaLogo variant="full" size="md" />
            <span className="hidden sm:block rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-400">
              Painel do Professor
            </span>
          </div>
          <a
            href="/dashboard/student"
            className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            ← Painel do Aluno
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div>
          <h1 className="font-[var(--font-heading)] text-xl sm:text-2xl font-bold text-[#1a1a2e]">
            Alunos da Plataforma
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Dados reais de todos os alunos cadastrados na athena.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── Metric cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                {
                  label: "Alunos",
                  value: totalStudents,
                  sub: "cadastrados",
                  color: "#0a1a4a",
                },
                {
                  label: "Com perfil",
                  value: withProfile,
                  sub: `de ${totalStudents}`,
                  color: "#0ea5e9",
                },
                {
                  label: "Média geral",
                  value: globalAvg !== null ? globalAvg.toFixed(1) + "%" : "—",
                  sub: "nos simulados",
                  color: avgColor(globalAvg),
                },
                {
                  label: "Simulados",
                  value: totalSimulados,
                  sub: "realizados",
                  color: "#8b5cf6",
                },
                {
                  label: "Revisões",
                  value: totalRevisoes,
                  sub: "geradas",
                  color: "#14b8a6",
                },
                {
                  label: "Darwin",
                  value: totalDarwin,
                  sub: "perguntas",
                  color: "#f97316",
                },
              ].map(card => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {card.label}
                  </p>
                  <p
                    className="mt-1 text-2xl sm:text-3xl font-bold"
                    style={{ color: card.color }}
                  >
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Empty state ── */}
            {students.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                  🎓
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  Nenhum aluno cadastrado ainda.
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Quando os alunos fizerem login e completarem o perfil,
                  eles aparecerão aqui.
                </p>
              </div>
            ) : (
              <>
                {/* ── Course filter + table ── */}
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 px-4 sm:px-6 py-4">
                    <h2 className="font-[var(--font-heading)] text-sm font-bold text-[#1a1a2e]">
                      Desempenho por Aluno
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {filteredStudents.length} aluno{filteredStudents.length !== 1 ? "s" : ""}
                      </span>
                      {allCourses.length > 0 && (
                        <select
                          value={filterCourse}
                          onChange={e => setFilterCourse(e.target.value)}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-[#1a1a2e] outline-none focus:border-[#0a1a4a]"
                        >
                          <option value="all">Todas as turmas</option>
                          {allCourses.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_80px_80px_80px_80px_auto] gap-3 border-b border-gray-50 bg-gray-50 px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 min-w-[640px]">
                    <span>Aluno</span>
                    <span>Ano</span>
                    <span>Objetivo</span>
                    <span>Simulados</span>
                    <span>Média</span>
                    <span>Revisões</span>
                    <span>Darwin</span>
                    <span></span>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-gray-50">
                    {filteredStudents.map(student => {
                      const perfs =
                        filterCourse === "all"
                          ? student.performances
                          : student.performances.filter(p => p.courseId === filterCourse)
                      const interactions =
                        filterCourse === "all"
                          ? student.studyInteractions
                          : student.studyInteractions.filter(si => si.courseId === filterCourse)

                      const scores = perfs.map(p => p.score)
                      const avgS = avg(scores)
                      const revisoes = interactions.filter(si => si.type === "revisao").length
                      const darwinMsgs = interactions
                        .filter(si => si.type === "darwin")
                        .reduce((sum, si) => sum + ((si.metadata as any)?.messagesCount ?? 1), 0)

                      return (
                        <div
                          key={student.id}
                          className="grid grid-cols-1 gap-3 px-4 sm:px-6 py-4 sm:grid-cols-[2fr_1fr_1fr_80px_80px_80px_80px_auto] sm:items-center sm:min-w-[640px]"
                        >
                          {/* Identity */}
                          <div className="flex items-center gap-3">
                            {student.image ? (
                              <img
                                src={student.image}
                                alt={student.name}
                                className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                              />
                            ) : (
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0a1a4a]/10 text-xs font-bold text-[#0a1a4a]">
                                {initials(student.name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#1a1a2e]">
                                {student.name}
                              </p>
                              <p className="truncate text-xs text-gray-400">
                                {student.email}
                              </p>
                            </div>
                          </div>

                          {/* Year */}
                          <p className="text-xs text-gray-600 hidden sm:block">
                            {student.profile?.schoolYear ?? <span className="text-gray-300">—</span>}
                          </p>

                          {/* Goal */}
                          <p className="text-xs text-gray-600 truncate hidden sm:block">
                            {student.profile?.goal ?? <span className="text-gray-300">—</span>}
                          </p>

                          {/* Mobile compact stats */}
                          <div className="flex flex-wrap items-center gap-3 sm:hidden">
                            <span className="text-xs"><span className="text-gray-400">Simulados:</span> <span className="font-bold text-[#8b5cf6]">{perfs.length}</span></span>
                            <span className="text-xs"><span className="text-gray-400">Média:</span> <span className="font-bold" style={{ color: avgS !== null ? avgColor(avgS) : "#d1d5db" }}>{avgS !== null ? avgS.toFixed(0) + "%" : "—"}</span></span>
                            <span className="text-xs"><span className="text-gray-400">Revisões:</span> <span className="font-bold text-[#14b8a6]">{revisoes}</span></span>
                            <span className="text-xs"><span className="text-gray-400">Darwin:</span> <span className="font-bold text-[#f97316]">{darwinMsgs}</span></span>
                          </div>

                          {/* Simulados count */}
                          <p className="text-sm font-bold text-[#8b5cf6] hidden sm:block">
                            {perfs.length > 0 ? perfs.length : <span className="text-xs font-normal text-gray-300">0</span>}
                          </p>

                          {/* Avg score */}
                          <p className="text-sm font-bold hidden sm:block" style={{ color: avgS !== null ? avgColor(avgS) : "#d1d5db" }}>
                            {avgS !== null ? avgS.toFixed(0) + "%" : "—"}
                          </p>

                          {/* Revisões */}
                          <p className="text-sm font-bold text-[#14b8a6] hidden sm:block">
                            {revisoes > 0 ? revisoes : <span className="text-xs font-normal text-gray-300">0</span>}
                          </p>

                          {/* Darwin messages */}
                          <p className="text-sm font-bold text-[#f97316] hidden sm:block">
                            {darwinMsgs > 0 ? darwinMsgs : <span className="text-xs font-normal text-gray-300">0</span>}
                          </p>

                          {/* Ver button */}
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="rounded-xl border border-[#0a1a4a]/30 px-3 py-1.5 text-xs font-semibold text-[#0a1a4a] transition-all hover:bg-[#0a1a4a]/8 w-full sm:w-auto"
                          >
                            Ver
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
