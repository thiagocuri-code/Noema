"use client"

import { LotusLogo } from "@/components/shared/lotus-logo"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course { id: string; name: string }
interface Student {
  userId: string
  profile: { name: { fullName: string }; emailAddress: string; photoUrl?: string }
}
interface Submission {
  userId: string
  state: "NEW" | "CREATED" | "TURNED_IN" | "RETURNED" | "RECLAIMED_BY_STUDENT"
  assignedGrade?: number
  draftGrade?: number
}
interface AssignmentGroup {
  assignmentId: string
  assignmentTitle: string
  dueDate?: { year: number; month: number; day: number }
  submissions: Submission[]
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = ["#0a1a4a", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"]
const STATE_LABEL: Record<string, string> = {
  NEW: "Não iniciado",
  CREATED: "Em andamento",
  TURNED_IN: "Entregue",
  RETURNED: "Devolvido",
  RECLAIMED_BY_STUDENT: "Recolhido",
}
const STATE_COLOR: Record<string, string> = {
  NEW: "#e5e7eb",
  CREATED: "#fbbf24",
  TURNED_IN: "#22c55e",
  RETURNED: "#0a1a4a",
  RECLAIMED_BY_STUDENT: "#ef4444",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function avatar(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

function submissionRate(submissions: Submission[], total: number) {
  const delivered = submissions.filter((s) => s.state === "TURNED_IN" || s.state === "RETURNED").length
  return total > 0 ? Math.round((delivered / total) * 100) : 0
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-3xl font-bold" style={{ color: color ?? "#1a1a2e" }}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function ProgressBar({ value, color = "#0a1a4a" }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium text-gray-500 w-8 text-right">{value}%</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TEACHER_PIN = "0000"

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [assignmentGroups, setAssignmentGroups] = useState<AssignmentGroup[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("teacher_unlocked") === "1") {
      setUnlocked(true)
    }
  }, [])

  // Load courses
  useEffect(() => {
    if (!unlocked || !session?.accessToken) return
    fetch(`/api/classroom/courses?accessToken=${session.accessToken}`)
      .then((r) => r.json())
      .then((d) => {
        const list = (d.courses ?? []).map((c: any) => ({ id: c.id, name: c.name }))
        setCourses(list)
        if (list.length > 0) setSelectedCourse(list[0])
        setLoadingCourses(false)
      })
      .catch(() => setLoadingCourses(false))
  }, [unlocked, session?.accessToken])

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-xs space-y-6 text-center">
          <div className="flex justify-center">
            <LotusLogo variant="full" size="lg" />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#071245]/10">
              <svg className="h-7 w-7 text-[#071245]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#071245]">Painel do Professor</h2>
            <p className="text-sm text-gray-500">Digite a senha de acesso</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setPinError(false) }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  if (pin === TEACHER_PIN) {
                    sessionStorage.setItem("teacher_unlocked", "1")
                    setUnlocked(true)
                  } else { setPinError(true) }
                }
              }}
              placeholder="••••"
              className={`w-full rounded-xl border px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none transition ${pinError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#071245] focus:ring-1 focus:ring-[#071245]/30"}`}
              autoFocus
            />
            {pinError && <p className="text-xs text-red-500">Senha incorreta</p>}
            <button
              onClick={() => {
                if (pin === TEACHER_PIN) {
                  sessionStorage.setItem("teacher_unlocked", "1")
                  setUnlocked(true)
                } else { setPinError(true) }
              }}
              className="w-full rounded-xl bg-[#071245] py-3 text-sm font-semibold text-white transition hover:bg-[#0a1a5a] active:scale-[0.98]"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Load students + submissions when course changes
  useEffect(() => {
    if (!session?.accessToken || !selectedCourse) return
    setLoadingDetails(true)
    setStudents([])
    setAssignmentGroups([])
    setSelectedStudent(null)

    Promise.all([
      fetch(`/api/classroom/students?accessToken=${session.accessToken}&courseId=${selectedCourse.id}`).then((r) => r.json()),
      fetch(`/api/classroom/submissions?accessToken=${session.accessToken}&courseId=${selectedCourse.id}`).then((r) => r.json()),
    ]).then(([studData, subData]) => {
      setStudents(studData.students ?? [])
      setAssignmentGroups(subData.submissionsByAssignment ?? [])
      setLoadingDetails(false)
    }).catch(() => setLoadingDetails(false))
  }, [session?.accessToken, selectedCourse])

  // ── Derived data ────────────────────────────────────────────────────────────
  const totalAssignments = assignmentGroups.length

  // Entrega por assignment (barchart)
  const deliveryData = assignmentGroups.map((ag) => ({
    name: ag.assignmentTitle.length > 20 ? ag.assignmentTitle.slice(0, 18) + "…" : ag.assignmentTitle,
    entregues: ag.submissions.filter((s) => s.state === "TURNED_IN" || s.state === "RETURNED").length,
    pendentes: ag.submissions.filter((s) => s.state === "NEW" || s.state === "CREATED").length,
  }))

  // Status geral (pizza)
  const statusCount: Record<string, number> = {}
  assignmentGroups.forEach((ag) =>
    ag.submissions.forEach((s) => { statusCount[s.state] = (statusCount[s.state] ?? 0) + 1 })
  )
  const pieData = Object.entries(statusCount).map(([state, count]) => ({
    name: STATE_LABEL[state] ?? state,
    value: count,
    color: STATE_COLOR[state] ?? "#ccc",
  }))

  // Tabela de alunos: taxa de entrega
  const studentRows = students.map((st) => {
    const subs = assignmentGroups.flatMap((ag) =>
      ag.submissions.filter((s) => s.userId === st.userId)
    )
    const delivered = subs.filter((s) => s.state === "TURNED_IN" || s.state === "RETURNED").length
    const rate = submissionRate(subs, totalAssignments)
    const grades = subs.filter((s) => s.assignedGrade != null).map((s) => s.assignedGrade!)
    const avgGrade = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : null
    return { student: st, delivered, rate, avgGrade, total: subs.length }
  }).sort((a, b) => b.rate - a.rate)

  // Aluno selecionado: detalhe por assignment
  const selectedStudentRows = selectedStudent
    ? assignmentGroups.map((ag) => {
        const sub = ag.submissions.find((s) => s.userId === selectedStudent.userId)
        return { title: ag.assignmentTitle, state: sub?.state ?? "NEW", grade: sub?.assignedGrade ?? null }
      })
    : []

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Topbar */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <LotusLogo variant="full" size="md" />

            <span className="hidden sm:block text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">Painel do Professor</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {session?.user?.image && (
              <img src={session.user.image} alt="" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-[#0a1a4a]/20" />
            )}
            <span className="hidden text-sm font-medium text-gray-700 sm:block">
              {session?.user?.name?.split(" ")[0]}
            </span>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-gray-400 hover:text-gray-600">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* Page title + course selector */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-[var(--font-heading)] text-2xl font-bold text-[#1a1a2e]">Desempenho da Turma</h1>
            <p className="mt-1 text-sm text-gray-500">Acompanhe entregas, engajamento e uso da IA por aluno.</p>
          </div>
          {!loadingCourses && courses.length > 0 && (
            <select
              value={selectedCourse?.id ?? ""}
              onChange={(e) => {
                const c = courses.find((c) => c.id === e.target.value)
                if (c) setSelectedCourse(c)
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-[#1a1a2e] outline-none focus:border-[#0a1a4a] focus:ring-1 focus:ring-[#0a1a4a]/30"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Loading skeleton */}
        {(loadingCourses || loadingDetails) && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />)}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
          </div>
        )}

        {!loadingCourses && !loadingDetails && selectedCourse && (
          <>
            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Alunos" value={students.length} sub="matriculados" color="#0a1a4a" />
              <StatCard
                label="Atividades"
                value={totalAssignments}
                sub="no Classroom"
                color="#0ea5e9"
              />
              <StatCard
                label="Taxa de Entrega"
                value={
                  totalAssignments > 0 && students.length > 0
                    ? `${Math.round(
                        assignmentGroups.flatMap((ag) =>
                          ag.submissions.filter((s) => s.state === "TURNED_IN" || s.state === "RETURNED")
                        ).length /
                          (totalAssignments * (students.length || 1)) *
                          100
                      )}%`
                    : "—"
                }
                sub="entregues / esperadas"
                color="#22c55e"
              />
              <StatCard
                label="Pendentes"
                value={
                  assignmentGroups.flatMap((ag) =>
                    ag.submissions.filter((s) => s.state === "NEW" || s.state === "CREATED")
                  ).length
                }
                sub="submissões em aberto"
                color="#f59e0b"
              />
            </div>

            {/* ── Charts row ── */}
            {totalAssignments > 0 && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Bar chart — entregas por atividade */}
                <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
                  <h2 className="font-[var(--font-heading)] text-sm font-bold text-[#1a1a2e] mb-4">
                    Entregas por Atividade
                  </h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={deliveryData} barSize={18} margin={{ top: 4, right: 8, bottom: 24, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} angle={-30} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
                        cursor={{ fill: "#f3f4f6" }}
                      />
                      <Bar dataKey="entregues" name="Entregues" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pendentes" name="Pendentes" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie chart — status geral */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h2 className="font-[var(--font-heading)] text-sm font-bold text-[#1a1a2e] mb-4">
                    Status Geral das Submissões
                  </h2>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="45%" outerRadius={70} innerRadius={36} paddingAngle={3} label={({ percent }: { percent?: number }) => percent ? `${(percent * 100).toFixed(0)}%` : ""} labelLine={false}>
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-8">Sem submissões ainda</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Student table ── */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-[var(--font-heading)] text-sm font-bold text-[#1a1a2e]">
                  Desempenho por Aluno
                </h2>
                <span className="text-xs text-gray-400">{students.length} aluno{students.length !== 1 ? "s" : ""}</span>
              </div>

              {students.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-gray-400">Nenhum aluno matriculado nesta turma.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {studentRows.map(({ student, delivered, rate, avgGrade }) => {
                    const isSelected = selectedStudent?.userId === student.userId
                    return (
                      <div key={student.userId}>
                        {/* Row */}
                        <button
                          onClick={() => setSelectedStudent(isSelected ? null : student)}
                          className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50 ${isSelected ? "bg-[#0a1a4a]/5" : ""}`}
                        >
                          {/* Avatar */}
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0a1a4a]/10 text-xs font-bold text-[#0a1a4a]">
                            {student.profile?.photoUrl
                              ? <img src={student.profile.photoUrl} className="h-9 w-9 rounded-full object-cover" alt="" />
                              : avatar(student.profile?.name?.fullName ?? "?")}
                          </div>

                          {/* Name + email */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1a1a2e] truncate">
                              {student.profile?.name?.fullName ?? "—"}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{student.profile?.emailAddress}</p>
                          </div>

                          {/* Delivery rate bar */}
                          <div className="hidden sm:block w-36">
                            <p className="text-xs text-gray-400 mb-1">Entregas</p>
                            <ProgressBar value={rate} color={rate >= 80 ? "#22c55e" : rate >= 50 ? "#f59e0b" : "#ef4444"} />
                          </div>

                          {/* Delivered count */}
                          <div className="hidden md:block text-center w-16">
                            <p className="text-xs text-gray-400">Entregues</p>
                            <p className="text-sm font-bold text-[#1a1a2e]">{delivered}<span className="text-gray-300">/{totalAssignments}</span></p>
                          </div>

                          {/* Avg grade */}
                          <div className="text-center w-16">
                            <p className="text-xs text-gray-400">Nota média</p>
                            <p className={`text-sm font-bold ${avgGrade ? "text-[#0a1a4a]" : "text-gray-300"}`}>
                              {avgGrade ?? "—"}
                            </p>
                          </div>

                          {/* Expand chevron */}
                          <svg className={`h-4 w-4 text-gray-300 transition-transform flex-shrink-0 ${isSelected ? "rotate-180 text-[#0a1a4a]" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Expanded: assignment detail */}
                        {isSelected && (
                          <div className="px-3 sm:px-6 pb-5 bg-[#0a1a4a]/[0.03]">
                            <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
                              <table className="w-full text-sm min-w-[400px]">
                                <thead>
                                  <tr className="bg-gray-50 text-left text-xs text-gray-400">
                                    <th className="px-4 py-2.5 font-medium">Atividade</th>
                                    <th className="px-4 py-2.5 font-medium">Status</th>
                                    <th className="px-4 py-2.5 font-medium">Nota</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {selectedStudentRows.map((r, i) => (
                                    <tr key={i}>
                                      <td className="px-4 py-3 font-medium text-[#1a1a2e] max-w-[200px] truncate">{r.title}</td>
                                      <td className="px-4 py-3">
                                        <span
                                          className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                                          style={{ backgroundColor: STATE_COLOR[r.state] + "22", color: STATE_COLOR[r.state] }}
                                        >
                                          {STATE_LABEL[r.state] ?? r.state}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 font-bold text-[#0a1a4a]">
                                        {r.grade != null ? r.grade : <span className="text-gray-300 font-normal">—</span>}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loadingCourses && courses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-16 text-center">
            <p className="text-gray-400">Nenhuma turma encontrada no Google Classroom.</p>
          </div>
        )}
      </main>
    </div>
  )
}
