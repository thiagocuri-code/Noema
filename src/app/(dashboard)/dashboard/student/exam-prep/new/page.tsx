"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useLang, LangToggle } from "@/lib/lang-context"
import { LotusLogo } from "@/components/shared/lotus-logo"

interface Course { id: string; name: string }
interface DriveFile { id: string; title: string }
interface FileContent { id: string; title: string; text: string; mimeType?: string }
interface Assignment { id: string; title: string; description?: string; driveFiles?: DriveFile[] }
interface Announcement { id: string; text: string; driveFiles?: DriveFile[] }
interface Material { id: string; title: string; description?: string; driveFiles?: DriveFile[] }
interface DiagQuestion {
  question: string
  options: string[]
  correct: number
  topic: string
  difficulty: "facil" | "medio" | "dificil"
  explanation: string
}

type Step = "subject" | "details" | "diagnostic" | "done"

export default function NewExamPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { t, lang } = useLang()
  const googleId = (session as any)?.googleId as string | undefined

  const [step, setStep] = useState<Step>("subject")
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [courseId, setCourseId] = useState("")
  const [courseName, setCourseName] = useState("")

  const [title, setTitle] = useState("")
  const [examDate, setExamDate] = useState("")

  const [fileContents, setFileContents] = useState<FileContent[]>([])
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [indexing, setIndexing] = useState(false)
  const [indexedCount, setIndexedCount] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [contextText, setContextText] = useState("")

  const [diagQuestions, setDiagQuestions] = useState<DiagQuestion[]>([])
  const [diagAnswers, setDiagAnswers] = useState<(number | null)[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [loadingDiag, setLoadingDiag] = useState(false)
  const [diagError, setDiagError] = useState("")

  const [creating, setCreating] = useState(false)

  // Load courses
  useEffect(() => {
    if (!session?.accessToken) return
    fetch(`/api/classroom/courses?accessToken=${session.accessToken}`)
      .then(r => r.json())
      .then(data => setCourses(data.courses ?? []))
      .catch(() => { /* silent */ })
      .finally(() => setLoadingCourses(false))
  }, [session?.accessToken])

  // Load + index subject content when subject picked
  useEffect(() => {
    if (step !== "details" || !session?.accessToken || !courseId) return
    setIndexing(true)
    setFileContents([])
    setSelectedFileIds(new Set())
    setIndexedCount(0)
    setTotalFiles(0)

    fetch(`/api/classroom/assignments?accessToken=${session.accessToken}&courseId=${courseId}`)
      .then(r => r.json())
      .then(async (data) => {
        const asgn: Assignment[] = data.assignments ?? []
        const mat: Material[] = data.materials ?? []
        const ann: Announcement[] = data.announcements ?? []

        const collected: FileContent[] = []
        const fileTexts: string[] = []

        for (const m of mat) {
          if (m.description && m.description.trim().length > 10) {
            collected.push({
              id: `mat-${m.id}`, title: m.title,
              text: `${m.title}\n\n${m.description}`, mimeType: "text/material",
            })
            fileTexts.push(`=== ${m.title} ===\n${m.description}`)
          }
        }
        for (const a of asgn) {
          if (a.description && a.description.trim().length > 10) {
            collected.push({
              id: `asgn-${a.id}`, title: a.title,
              text: `${a.title}\n\n${a.description}`, mimeType: "text/assignment",
            })
            fileTexts.push(`=== ${a.title} ===\n${a.description}`)
          }
        }
        for (const a of ann) {
          if (a.text && a.text.trim().length > 10) {
            const titleSnippet = a.text.slice(0, 60).replace(/\n/g, " ").trim()
            collected.push({
              id: `ann-${a.id}`, title: titleSnippet,
              text: a.text, mimeType: "text/announcement",
            })
            fileTexts.push(`=== ${titleSnippet} ===\n${a.text}`)
          }
        }

        const driveFiles: DriveFile[] = [
          ...mat.flatMap(m => m.driveFiles ?? []),
          ...asgn.flatMap(a => a.driveFiles ?? []),
          ...ann.flatMap(a => a.driveFiles ?? []),
        ]

        if (driveFiles.length > 0) {
          setTotalFiles(driveFiles.length)
          for (const file of driveFiles) {
            try {
              const res = await fetch(`/api/drive/content?accessToken=${session.accessToken}&fileId=${file.id}`)
              if (res.ok) {
                const d = await res.json()
                if (d.text && d.text.trim().length > 20) {
                  collected.push({ id: file.id, title: d.name ?? file.title, text: d.text, mimeType: d.mimeType })
                  fileTexts.push(`=== ${d.name ?? file.title} ===\n${d.text}`)
                }
              }
            } catch { /* ignore */ }
            setIndexedCount(prev => prev + 1)
          }
        }

        try {
          const kbRes = await fetch(`/api/knowledge-base?courseName=${encodeURIComponent(courseName)}`)
          if (kbRes.ok) {
            const kbData = await kbRes.json()
            const kbEntries: Array<{ id: string; title: string; content: string }> = kbData.entries ?? []
            for (const kb of kbEntries) {
              collected.push({
                id: `kb-${kb.id}`,
                title: `📚 ${kb.title}`,
                text: kb.content,
                mimeType: "text/knowledge-base",
              })
              fileTexts.push(`=== ${kb.title} ===\n${kb.content}`)
            }
          }
        } catch { /* ignore KB errors */ }

        setFileContents(collected)
        setSelectedFileIds(new Set(collected.map(f => f.id)))
        setContextText(fileTexts.join("\n\n"))
        setIndexing(false)
      })
      .catch(() => setIndexing(false))
  }, [step, session?.accessToken, courseId, courseName])

  async function startDiagnostic() {
    if (selectedFileIds.size === 0 || !title.trim()) return
    setStep("diagnostic")
    setLoadingDiag(true)
    setDiagError("")

    const selected = fileContents.filter(f => selectedFileIds.has(f.id))
    const selectedContext = selected.map(f => `=== ${f.title} ===\n${f.text}`).join("\n\n")

    try {
      const res = await fetch("/api/ai/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: selectedContext || contextText,
          courseName,
          examTitle: title,
          lang,
          selectedFileNames: selected.map(f => f.title),
        }),
      })
      const data = await res.json()
      if (data.error) {
        setDiagError(data.error)
      } else {
        setDiagQuestions(data.questions ?? [])
        setDiagAnswers(new Array(data.questions?.length ?? 0).fill(null))
      }
    } catch (err: any) {
      setDiagError(err?.message ?? "Erro de conexão")
    } finally {
      setLoadingDiag(false)
    }
  }

  function selectAnswer(idx: number) {
    const next = [...diagAnswers]
    next[currentQ] = idx
    setDiagAnswers(next)
  }

  async function finishDiagnostic() {
    if (!googleId) return
    setCreating(true)

    const correctCount = diagQuestions.reduce((acc, q, i) => acc + (diagAnswers[i] === q.correct ? 1 : 0), 0)
    const score = diagQuestions.length ? Math.round((correctCount / diagQuestions.length) * 100) : 0

    // Topic mapping: wrong answers → weak, right answers → strong
    const weakSet = new Set<string>()
    const strongSet = new Set<string>()
    diagQuestions.forEach((q, i) => {
      if (diagAnswers[i] === q.correct) strongSet.add(q.topic)
      else weakSet.add(q.topic)
    })
    // Topic can't be simultaneously weak and strong — favor weak
    for (const t of weakSet) strongSet.delete(t)

    const selected = fileContents.filter(f => selectedFileIds.has(f.id))
    const selectedContext = selected.map(f => `=== ${f.title} ===\n${f.text}`).join("\n\n")

    const body = {
      googleId,
      courseId,
      courseName,
      title: title.trim(),
      examDate: examDate || null,
      fileIds: selected.map(f => f.id),
      fileTitles: selected.map(f => f.title),
      contextSnapshot: selectedContext,
      diagnosticScore: score,
      diagnosticAnswers: diagQuestions.map((q, i) => ({
        topic: q.topic,
        answered: diagAnswers[i],
        correct: q.correct,
      })),
      topicsWeak: Array.from(weakSet),
      topicsStrong: Array.from(strongSet),
    }

    try {
      const res = await fetch("/api/exam/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.exam?.id) {
        router.replace(`/dashboard/student/exam-prep/${data.exam.id}?welcome=1`)
      } else {
        setDiagError(data.error ?? "Erro ao criar prova")
        setCreating(false)
      }
    } catch (err: any) {
      setDiagError(err?.message ?? "Erro ao criar prova")
      setCreating(false)
    }
  }

  const allAnswered = diagAnswers.length > 0 && diagAnswers.every(a => a !== null)
  const correctCount = diagQuestions.reduce((acc, q, i) => acc + (diagAnswers[i] === q.correct ? 1 : 0), 0)
  const diagScore = diagQuestions.length ? Math.round((correctCount / diagQuestions.length) * 100) : 0

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <LotusLogo variant="full" size="md" />
            <Link href="/dashboard/student" className="text-xs text-gray-400 hover:text-gray-600">
              ← {t("Voltar", "Back")}
            </Link>
          </div>
          <LangToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#0a1a4a]">
            🎯 {t("Nova prova", "New exam")}
          </p>
          <h1 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-[#1a1a2e]">
            {step === "subject" && t("Qual matéria você vai estudar?", "Which subject are you preparing for?")}
            {step === "details" && t("Detalhes da prova", "Exam details")}
            {step === "diagnostic" && t("Vamos mapear suas dificuldades", "Let's map your gaps")}
          </h1>
          <div className="mt-4 flex gap-2">
            {(["subject", "details", "diagnostic"] as Step[]).map((s, i) => {
              const isActive = step === s
              const isDone = ["subject", "details", "diagnostic"].indexOf(step) > i
              return (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    isActive ? "bg-[#0a1a4a]" : isDone ? "bg-[#0a1a4a]/50" : "bg-gray-200"
                  }`}
                />
              )
            })}
          </div>
        </div>

        {step === "subject" && (
          <div>
            {loadingCourses ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}
              </div>
            ) : courses.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">
                {t("Nenhuma matéria encontrada.", "No subjects found.")}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {courses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCourseId(c.id)
                      setCourseName(c.name)
                      setStep("details")
                    }}
                    className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-[#0a1a4a] hover:shadow-md"
                  >
                    <p className="text-sm font-semibold text-[#1a1a2e]">{c.name}</p>
                    <p className="mt-1 text-xs text-gray-400">Google Classroom</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "details" && (
          <div className="space-y-6">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1a1a2e]">
                {t("Nome da prova", "Exam name")} *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t("Ex: Prova bimestral de Química", "Ex: Chemistry midterm")}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0a1a4a]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1a1a2e]">
                {t("Data da prova (opcional)", "Exam date (optional)")}
              </label>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0a1a4a]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1a1a2e]">
                {t("Conteúdos da prova", "Exam contents")} *
              </label>
              <p className="mb-2 text-xs text-gray-500">
                {t(
                  "Selecione os materiais que caem nesta prova. A lótus vai usar exclusivamente esse conteúdo.",
                  "Select the materials that will be covered. Lótus will use only this content."
                )}
              </p>

              {indexing ? (
                <div className="rounded-xl border-2 border-dashed border-[#4169D4]/30 bg-[#4169D4]/5 p-6">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#4169D4]" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-[#071245]">
                      {t("Indexando materiais…", "Indexing materials…")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {indexedCount}/{totalFiles} {t("arquivos processados", "files processed")}
                    </p>
                  </div>
                </div>
              ) : fileContents.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-500">
                    {t("Nenhum material disponível nessa matéria.", "No materials available for this subject.")}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-[#4169D4]/30 bg-white overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#4169D4]/10 bg-[#4169D4]/5 px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#071245]">
                      {selectedFileIds.size}/{fileContents.length} {t("selecionados", "selected")}
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedFileIds(new Set(fileContents.map(f => f.id)))}
                        className="text-xs font-semibold text-[#4169D4] hover:underline"
                      >
                        {t("Todos", "All")}
                      </button>
                      <button
                        onClick={() => setSelectedFileIds(new Set())}
                        className="text-xs font-semibold text-gray-400 hover:underline"
                      >
                        {t("Nenhum", "None")}
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {fileContents.map(f => {
                      const selected = selectedFileIds.has(f.id)
                      return (
                        <button
                          key={f.id}
                          onClick={() => {
                            const next = new Set(selectedFileIds)
                            if (selected) next.delete(f.id); else next.add(f.id)
                            setSelectedFileIds(next)
                          }}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left ${selected ? "bg-[#4169D4]/5" : "hover:bg-gray-50"}`}
                        >
                          <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${selected ? "border-[#4169D4] bg-[#4169D4]" : "border-gray-300 bg-white"}`}>
                            {selected && (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`flex-1 truncate text-sm ${selected ? "text-[#071245] font-medium" : "text-gray-600"}`}>
                            {f.title}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep("subject")}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                ← {t("Voltar", "Back")}
              </button>
              <button
                onClick={startDiagnostic}
                disabled={!title.trim() || selectedFileIds.size === 0 || indexing}
                className="flex-1 rounded-xl bg-[#0a1a4a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#071245] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("Continuar para o diagnóstico →", "Continue to diagnostic →")}
              </button>
            </div>
          </div>
        )}

        {step === "diagnostic" && (
          <div>
            {loadingDiag ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <div className="flex justify-center gap-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#0a1a4a]" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <p className="mt-3 text-sm font-medium text-[#1a1a2e]">
                  {t("Gerando seu diagnóstico…", "Generating your diagnostic…")}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {t("A lótus está lendo os materiais e criando questões personalizadas.", "Lótus is reading the materials and crafting personalized questions.")}
                </p>
              </div>
            ) : diagError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                {diagError}
              </div>
            ) : !allAnswered ? (
              diagQuestions.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">
                      {t("Questão", "Question")} {currentQ + 1}/{diagQuestions.length}
                    </span>
                    <span className="rounded-full bg-[#0a1a4a]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0a1a4a]">
                      {diagQuestions[currentQ].topic}
                    </span>
                  </div>
                  <div className="mb-5 h-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#0a1a4a] transition-all"
                      style={{ width: `${((currentQ + 1) / diagQuestions.length) * 100}%` }}
                    />
                  </div>
                  <p className="mb-5 text-base font-medium text-[#1a1a2e]">
                    {diagQuestions[currentQ].question}
                  </p>
                  <div className="space-y-2">
                    {diagQuestions[currentQ].options.map((opt, i) => {
                      const picked = diagAnswers[currentQ] === i
                      return (
                        <button
                          key={i}
                          onClick={() => selectAnswer(i)}
                          className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${
                            picked
                              ? "border-[#0a1a4a] bg-[#0a1a4a]/5 text-[#0a1a4a] font-medium"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                      disabled={currentQ === 0}
                      className="text-xs font-medium text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      ← {t("Anterior", "Previous")}
                    </button>
                    <button
                      onClick={() => setCurrentQ(Math.min(diagQuestions.length - 1, currentQ + 1))}
                      disabled={diagAnswers[currentQ] === null || currentQ === diagQuestions.length - 1}
                      className="rounded-xl bg-[#0a1a4a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#071245] disabled:opacity-30"
                    >
                      {currentQ === diagQuestions.length - 1
                        ? t("Finalizar", "Finish")
                        : t("Próxima →", "Next →")}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
                <div className="text-4xl mb-3">
                  {diagScore >= 70 ? "🎯" : diagScore >= 50 ? "💪" : "🌱"}
                </div>
                <h2 className="font-[var(--font-heading)] text-xl font-bold text-[#1a1a2e]">
                  {t(`Você acertou ${correctCount} de ${diagQuestions.length}`, `You got ${correctCount} out of ${diagQuestions.length}`)}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {diagScore >= 70
                    ? t("Boa base! Agora vamos aprofundar nos tópicos que faltam.", "Solid base! Now let's deepen the topics you need.")
                    : diagScore >= 40
                    ? t("Temos caminho pela frente — a lótus vai priorizar suas dificuldades.", "There's work ahead — lótus will prioritize your gaps.")
                    : t("Começamos do zero: sem problema! A lótus vai construir a base com você.", "Starting from scratch is fine — lótus will build the foundation with you.")}
                </p>

                <div className="mt-6 text-left">
                  <p className="text-xs font-bold uppercase text-gray-400 mb-2">
                    {t("Tópicos para revisar", "Topics to review")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(diagQuestions.filter((q, i) => diagAnswers[i] !== q.correct).map(q => q.topic))).map(topic => (
                      <span key={topic} className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        {topic}
                      </span>
                    ))}
                    {diagQuestions.every((q, i) => diagAnswers[i] === q.correct) && (
                      <span className="text-xs text-gray-400">
                        {t("Nenhum tópico marcado como fraco 🎉", "No weak topics flagged 🎉")}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={finishDiagnostic}
                  disabled={creating}
                  className="mt-6 w-full rounded-xl bg-[#0a1a4a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#071245] disabled:opacity-40"
                >
                  {creating
                    ? t("Criando sua prova…", "Creating your exam…")
                    : t("Entrar no painel de estudo →", "Open study panel →")}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
