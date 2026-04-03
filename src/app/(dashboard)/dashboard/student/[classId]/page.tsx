"use client"

import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useLang, LangToggle } from "@/lib/lang-context"

// ── Types ──────────────────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string }
interface DriveFile { id: string; title: string }
interface FileContent { id: string; title: string; text: string }
interface Assignment {
  id: string; title: string; description?: string
  dueDate?: { year: number; month: number; day: number }
  alternateLink?: string; driveFiles?: DriveFile[]
}
interface Announcement { id: string; text: string; alternateLink?: string; driveFiles?: DriveFile[] }
interface Material { id: string; title: string; description?: string; alternateLink?: string; driveFiles?: DriveFile[] }
interface QuizQuestion { question: string; options: string[]; correct: number; explanation: string }
interface Flashcard { front: string; back: string }

interface CoursePerf {
  avgScore: number | null
  simulados: { id: string; activityName: string; score: number; submittedAt: string; feedback: string }[]
  revisoes: number
  darwinMessages: number
  recentActivities: { type: string; name: string; score?: number; date: string }[]
}

type Mode = "hub" | "chat" | "study" | "quiz"
type StudyType = "resumo" | "flashcards" | "mapa" | "guia"

// ── Helpers ────────────────────────────────────────────────────────────────────
function getDueLabel(d: Assignment["dueDate"], t: (pt: string, en: string) => string) {
  if (!d) return null
  const due = new Date(d.year, d.month - 1, d.day)
  const diff = Math.ceil((due.getTime() - Date.now()) / 86400000)
  if (diff < 0) return { label: t("Atrasado", "Overdue"), cls: "text-red-600 bg-red-50" }
  if (diff === 0) return { label: t("Hoje", "Today"), cls: "text-red-600 bg-red-50" }
  if (diff <= 3) return { label: t(`${diff}d restantes`, `${diff}d left`), cls: "text-amber-600 bg-amber-50" }
  return { label: t(`${diff}d restantes`, `${diff}d left`), cls: "text-green-600 bg-green-50" }
}

function scoreColor(s: number | null) {
  if (s === null) return "#9ca3af"
  if (s >= 70) return "#22c55e"
  if (s >= 50) return "#f59e0b"
  return "#ef4444"
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

// SVG ring for score display
function ScoreRing({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  )
}

const COLORS = ["#6C47FF", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316"]

// ── Content Selector ──────────────────────────────────────────────────────────
function ContentSelector({
  fileContents, ids, setIds, t,
}: {
  fileContents: FileContent[]
  ids: Set<string>
  setIds: (s: Set<string>) => void
  t: (pt: string, en: string) => string
}) {
  if (fileContents.length === 0) return null
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t("Conteúdo selecionado", "Selected content")}
        </p>
        <div className="flex gap-2">
          <button onClick={() => setIds(new Set(fileContents.map(f => f.id)))} className="text-xs text-[#6C47FF] hover:underline">
            {t("Todos", "All")}
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={() => setIds(new Set())} className="text-xs text-gray-400 hover:underline">
            {t("Nenhum", "None")}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {fileContents.map(f => {
          const selected = ids.has(f.id)
          return (
            <button key={f.id} onClick={() => {
              const next = new Set(ids)
              if (selected) next.delete(f.id); else next.add(f.id)
              setIds(next)
            }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${selected ? "border-[#6C47FF] bg-[#6C47FF]/8 text-[#6C47FF]" : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"}`}
            >
              <svg className="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
              {f.title.length > 32 ? f.title.slice(0, 30) + "…" : f.title}
            </button>
          )
        })}
      </div>
      {ids.size === 0 && <p className="mt-2 text-xs text-amber-600">{t("Selecione ao menos um arquivo.", "Select at least one file.")}</p>}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ClassroomPage() {
  const { classId } = useParams<{ classId: string }>()
  const { data: session } = useSession()
  const { t, lang } = useLang()
  const router = useRouter()

  const googleId = (session as any)?.googleId as string | undefined

  // Course
  const [courseName, setCourseName] = useState("")
  const [courseColor, setCourseColor] = useState("#6C47FF")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loadingContent, setLoadingContent] = useState(true)
  const [activeTab, setActiveTab] = useState<"assignments" | "materials" | "announcements">("materials")

  // Context / indexing
  const [courseContext, setCourseContext] = useState("")
  const [fileContents, setFileContents] = useState<FileContent[]>([])
  const [indexingFiles, setIndexingFiles] = useState(false)
  const [indexedCount, setIndexedCount] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)

  // Mode
  const [mode, setMode] = useState<Mode>("hub")

  // Performance widget
  const [coursePerf, setCoursePerf] = useState<CoursePerf | null>(null)
  const [loadingPerf, setLoadingPerf] = useState(false)

  // ── Chat ──────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loadingChat, setLoadingChat] = useState(false)
  const [chatUserMessages, setChatUserMessages] = useState(0) // count for tracking
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Study ─────────────────────────────────────────────────────────────────
  const [studyType, setStudyType] = useState<StudyType>("resumo")
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [studyResult, setStudyResult] = useState("")
  const [studyFlashcards, setStudyFlashcards] = useState<Flashcard[]>([])
  const [loadingStudy, setLoadingStudy] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [studyGenerated, setStudyGenerated] = useState(false)

  // ── Quiz ──────────────────────────────────────────────────────────────────
  const [selectedQuizFileIds, setSelectedQuizFileIds] = useState<Set<string>>(new Set())
  const [questionCount, setQuestionCount] = useState(5)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([])
  const [quizRevealed, setQuizRevealed] = useState<boolean[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [quizFinished, setQuizFinished] = useState(false)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [quizGenerated, setQuizGenerated] = useState(false)
  const [quizSaved, setQuizSaved] = useState(false)

  // ── Tracking helpers ──────────────────────────────────────────────────────
  function trackInteraction(type: string, metadata: Record<string, unknown>) {
    if (!googleId) return
    fetch("/api/performance/interaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleId, courseId: classId, courseName, type, metadata }),
    }).catch(e => console.error("[track]", e))
  }

  function submitPerformance(activityName: string, score: number, feedback: string) {
    if (!googleId) return
    fetch("/api/performance/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleId, courseId: classId, courseName, activityName, score, feedback }),
    })
      .then(() => loadPerf()) // refresh widget
      .catch(e => console.error("[submit]", e))
  }

  // ── Load course name ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.accessToken) return
    fetch(`/api/classroom/courses?accessToken=${session.accessToken}`)
      .then(r => r.json())
      .then(data => {
        const idx = (data.courses ?? []).findIndex((c: any) => c.id === classId)
        const course = (data.courses ?? [])[idx]
        if (course) {
          setCourseName(course.name)
          setCourseColor(COLORS[idx % COLORS.length])
        }
      })
  }, [session?.accessToken, classId])

  // ── Load course performance ────────────────────────────────────────────────
  const loadPerf = useCallback(() => {
    if (!googleId) return
    setLoadingPerf(true)
    fetch(`/api/performance/${googleId}/${classId}`)
      .then(r => r.json())
      .then(data => setCoursePerf(data))
      .catch(() => { /* silent */ })
      .finally(() => setLoadingPerf(false))
  }, [googleId, classId])

  useEffect(() => { loadPerf() }, [loadPerf])

  // ── Load + index content ───────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.accessToken) return
    fetch(`/api/classroom/assignments?accessToken=${session.accessToken}&courseId=${classId}`)
      .then(r => r.json())
      .then(async (data) => {
        const asgn: Assignment[] = data.assignments ?? []
        const mat: Material[] = data.materials ?? []
        const ann: Announcement[] = data.announcements ?? []
        setAssignments(asgn); setMaterials(mat); setAnnouncements(ann)
        setLoadingContent(false)

        const baseContext = [
          ...asgn.map(a => `[Atividade] ${a.title}${a.description ? ": " + a.description : ""}`),
          ...ann.map(a => `[Aviso] ${a.text}`),
          ...mat.map(m => `[Material] ${m.title}${m.description ? ": " + m.description : ""}`),
        ].join("\n")

        const allFiles: DriveFile[] = [
          ...mat.flatMap(m => m.driveFiles ?? []),
          ...asgn.flatMap(a => a.driveFiles ?? []),
          ...ann.flatMap(a => a.driveFiles ?? []),
        ]

        if (allFiles.length === 0) { setCourseContext(baseContext); return }
        setIndexingFiles(true); setTotalFiles(allFiles.length)

        const collected: FileContent[] = []
        const fileTexts: string[] = []
        for (const file of allFiles) {
          try {
            const res = await fetch(`/api/drive/content?accessToken=${session.accessToken}&fileId=${file.id}`)
            const d = await res.json()
            if (d.text && d.text.trim().length > 20) {
              fileTexts.push(`=== ${d.name} ===\n${d.text}`)
              collected.push({ id: file.id, title: d.name ?? file.title, text: d.text })
            }
          } catch { /* skip */ }
          setIndexedCount(prev => prev + 1)
        }
        setIndexingFiles(false)
        setFileContents(collected)
        const allIds = new Set(collected.map(f => f.id))
        setSelectedFileIds(allIds); setSelectedQuizFileIds(new Set(allIds))
        setCourseContext(fileTexts.length > 0 ? `${baseContext}\n\n--- CONTEÚDO DOS MATERIAIS ---\n${fileTexts.join("\n\n")}` : baseContext)
      })
      .catch(() => setLoadingContent(false))
  }, [session?.accessToken, classId])

  // ── Chat welcome message ───────────────────────────────────────────────────
  useEffect(() => {
    if (!courseName) return
    setMessages([{
      role: "assistant",
      content: t(
        `Olá! Sou o Darwin, seu tutor de ${courseName}. Estou aqui para te ajudar a entender os conteúdos — mas não vou te dar as respostas prontas. O objetivo é você aprender de verdade! O que você quer explorar hoje?`,
        `Hello! I'm Darwin, your tutor for ${courseName}. I'm here to help you understand the content — but I won't give you ready-made answers. The goal is for you to truly learn! What would you like to explore today?`
      ),
    }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseName, lang])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // Track Darwin session when leaving chat (5+ user messages)
  useEffect(() => {
    if (mode !== "chat" && chatUserMessages >= 5) {
      trackInteraction("darwin", { messagesCount: chatUserMessages })
      setChatUserMessages(0)
      loadPerf()
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chat send ──────────────────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || loadingChat) return
    const userMessage = input.trim()
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "44px"

    const newHistory = [...messages, { role: "user" as const, content: userMessage }]
    setMessages(newHistory)
    setLoadingChat(true)
    setChatUserMessages(prev => prev + 1)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage, courseName, courseContext,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          lang,
          profile: (() => { try { return JSON.parse(localStorage.getItem("trix_profile") ?? "{}") } catch { return {} } })(),
          googleId: googleId ?? null,
          courseId: classId,
        }),
      })
      const data = await res.json()
      setMessages([...newHistory, {
        role: "assistant",
        content: data.error ? `⚠️ ${data.error}` : data.response,
      }])
    } catch {
      setMessages([...newHistory, {
        role: "assistant",
        content: t("Erro ao conectar com o Darwin. Tente novamente.", "Error connecting to Darwin. Please try again."),
      }])
    } finally {
      setLoadingChat(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = "44px"
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
  }

  // ── Study helpers ──────────────────────────────────────────────────────────
  function getSelectedContext(ids: Set<string>) {
    if (ids.size === 0 || fileContents.length === 0) return courseContext
    const parts = fileContents.filter(f => ids.has(f.id)).map(f => `=== ${f.title} ===\n${f.text}`)
    return parts.length > 0 ? parts.join("\n\n") : courseContext
  }

  async function generateStudy() {
    const content = getSelectedContext(selectedFileIds)
    if (!content) return
    setLoadingStudy(true); setStudyResult(""); setStudyFlashcards([]); setStudyGenerated(false)
    try {
      const res = await fetch("/api/ai/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: studyType, content, courseName, lang }),
      })
      const data = await res.json()
      if (studyType === "flashcards") {
        setStudyFlashcards(data.flashcards ?? []); setCurrentCard(0); setCardFlipped(false)
      } else {
        setStudyResult(data.text ?? data.error ?? t("Erro ao gerar.", "Error generating."))
      }
      setStudyGenerated(true)
      // Track study material generation
      trackInteraction("revisao", { contentType: studyType })
      loadPerf()
    } catch {
      setStudyResult(t("Erro ao gerar conteúdo.", "Error generating content."))
      setStudyGenerated(true)
    } finally {
      setLoadingStudy(false)
    }
  }

  async function generateQuiz() {
    const content = getSelectedContext(selectedQuizFileIds)
    if (!content) return
    setLoadingQuiz(true); setQuizQuestions([]); setQuizAnswers([]); setQuizRevealed([])
    setCurrentQuestion(0); setQuizFinished(false); setQuizGenerated(false); setQuizSaved(false)
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, courseName, questionCount, lang }),
      })
      const data = await res.json()
      const qs: QuizQuestion[] = data.questions ?? []
      setQuizQuestions(qs)
      setQuizAnswers(new Array(qs.length).fill(null))
      setQuizRevealed(new Array(qs.length).fill(false))
      setQuizGenerated(true)
    } catch { /* fall through */ }
    finally { setLoadingQuiz(false) }
  }

  function saveQuizResult(answers: (number | null)[]) {
    if (quizSaved || quizQuestions.length === 0) return
    setQuizSaved(true)
    const score = quizQuestions.filter((q, i) => answers[i] === q.correct).length
    const pct = Math.round((score / quizQuestions.length) * 100)
    const date = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    const activityName = t(`Simulado — ${date}`, `Quiz — ${date}`)
    const feedback = t(
      `Você acertou ${score} de ${quizQuestions.length} questões (${pct}%).`,
      `You got ${score} out of ${quizQuestions.length} questions correct (${pct}%).`
    )
    submitPerformance(activityName, pct, feedback)
  }

  // ── Study type config ──────────────────────────────────────────────────────
  const studyTypes: { id: StudyType; label: string; icon: string; desc: string }[] = [
    { id: "resumo", label: t("Resumo", "Summary"), icon: "📄", desc: t("Síntese organizada do conteúdo", "Organized content synthesis") },
    { id: "flashcards", label: "Flashcards", icon: "🃏", desc: t("Cartões de memorização interativos", "Interactive memory cards") },
    { id: "mapa", label: t("Mapa Mental", "Mind Map"), icon: "🗺️", desc: t("Visualização hierárquica dos tópicos", "Hierarchical topic visualization") },
    { id: "guia", label: t("Guia de Estudo", "Study Guide"), icon: "📋", desc: t("Roteiro completo para a prova", "Complete exam preparation guide") },
  ]

  // ── Performance Widget ────────────────────────────────────────────────────
  function renderPerfWidget() {
    const hasData = coursePerf && (
      (coursePerf.avgScore !== null) || coursePerf.revisoes > 0 || coursePerf.darwinMessages > 0
    )
    const pct = coursePerf?.avgScore ?? 0
    const color = scoreColor(coursePerf?.avgScore ?? null)

    return (
      <div className="mx-auto w-full max-w-4xl mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Sora',sans-serif] text-sm font-bold text-[#1a1a2e]">
              {t("Seu desempenho em", "Your progress in")} {courseName || "…"}
            </h3>
            {loadingPerf && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-300" />}
          </div>

          {!hasData ? (
            <p className="text-sm text-gray-400">
              {t(
                "Você ainda não tem atividades nessa turma. Comece com um simulado!",
                "You don't have any activities in this class yet. Start with a quiz!"
              )}
            </p>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {/* Score ring */}
                <div className="flex flex-col items-center gap-1">
                  <div className="relative flex items-center justify-center">
                    <ScoreRing pct={pct} color={color} size={60} />
                    <span className="absolute text-xs font-bold" style={{ color }}>
                      {coursePerf?.avgScore !== null ? `${Math.round(pct)}%` : "—"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{t("Média geral", "Avg score")}</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-2xl font-bold text-[#6C47FF]">{coursePerf?.simulados.length ?? 0}</span>
                  <span className="text-xs text-center text-gray-400">{t("Simulados", "Quizzes")}</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-2xl font-bold text-[#0ea5e9]">{coursePerf?.revisoes ?? 0}</span>
                  <span className="text-xs text-center text-gray-400">{t("Revisões", "Reviews")}</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-2xl font-bold text-[#f59e0b]">{coursePerf?.darwinMessages ?? 0}</span>
                  <span className="text-xs text-center text-gray-400">Darwin</span>
                </div>
              </div>

              {/* Recent activities */}
              {coursePerf && coursePerf.recentActivities.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {t("Últimas atividades", "Recent activities")}
                  </p>
                  <div className="space-y-2">
                    {coursePerf.recentActivities.slice(0, 4).map((a, i) => (
                      <div key={i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm">
                            {a.type === "simulado" ? "✅" : a.type === "darwin" ? "💬" : "📚"}
                          </span>
                          <span className="truncate text-xs text-gray-600">{a.name}</span>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {a.score !== undefined && (
                            <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: scoreColor(a.score) }}>
                              {Math.round(a.score)}%
                            </span>
                          )}
                          <span className="text-xs text-gray-300">{fmtDate(a.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── HUB ──────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  function renderHub() {
    const hubCards = [
      {
        id: "chat" as Mode, icon: "🤖", color: courseColor,
        title: t("Converse com Darwin", "Chat with Darwin"),
        description: t("Tire dúvidas com o tutor de IA usando o método socrático — ele guia, não entrega.", "Ask questions with the AI tutor using the Socratic method — it guides, never spoils."),
        action: () => setMode("chat"),
      },
      {
        id: "study" as Mode, icon: "📚", color: "#0ea5e9",
        title: t("Revisar a Matéria", "Review the Material"),
        description: t("Gere resumos, flashcards, mapas mentais e guias de estudo com base nos seus materiais.", "Generate summaries, flashcards, mind maps and study guides from your materials."),
        action: () => { setStudyGenerated(false); setMode("study") },
      },
      {
        id: "quiz" as Mode, icon: "📝", color: "#22c55e",
        title: t("Teste o Seu Conhecimento", "Test Your Knowledge"),
        description: t("Simulado gerado pela IA com questões estilo ENEM baseadas no conteúdo da aula.", "AI-generated quiz with ENEM-style questions based on your class content."),
        action: () => { setQuizGenerated(false); setMode("quiz") },
      },
    ]

    return (
      <div className="flex flex-1 flex-col overflow-y-auto p-8">
        <div className="mx-auto w-full max-w-4xl">
          {/* Performance widget */}
          {courseName && renderPerfWidget()}

          <div className="mb-8 text-center">
            <h2 className="font-['Sora',sans-serif] text-xl font-bold text-[#1a1a2e]">
              {t("O que você quer fazer hoje?", "What would you like to do today?")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("Escolha uma das opções abaixo para continuar", "Choose one of the options below to continue")}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {hubCards.map(card => (
              <button key={card.id} onClick={card.action}
                className="group relative flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none"
              >
                <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl" style={{ backgroundColor: card.color }} />
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl transition-transform group-hover:scale-110" style={{ backgroundColor: card.color + "18" }}>
                  {card.icon}
                </div>
                <h3 className="font-['Sora',sans-serif] text-base font-bold text-[#1a1a2e] transition-colors group-hover:text-[#6C47FF]">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{card.description}</p>
                <div className="mt-5 flex items-center gap-1 text-xs font-semibold" style={{ color: card.color }}>
                  {t("Começar", "Start")} →
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            {indexingFiles ? (
              <><span className="h-2 w-2 animate-pulse rounded-full bg-[#6C47FF]" />
                <span className="text-[#6C47FF]">{t(`Indexando materiais ${indexedCount}/${totalFiles}…`, `Indexing materials ${indexedCount}/${totalFiles}…`)}</span></>
            ) : indexedCount > 0 ? (
              <><svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span className="text-green-600">{t(`${indexedCount} arquivo${indexedCount !== 1 ? "s" : ""} indexado${indexedCount !== 1 ? "s" : ""} como contexto`, `${indexedCount} file${indexedCount !== 1 ? "s" : ""} indexed as context`)}</span></>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── CHAT ─────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  function renderChat() {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode("hub")} className="text-xs text-gray-400 hover:text-gray-600">
              ← {t("Voltar", "Back")}
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <div>
              <h2 className="text-sm font-bold text-[#1a1a2e]">Darwin — {t("Tutor de", "Tutor for")} {courseName}</h2>
              <p className="text-xs text-gray-400">
                {indexingFiles ? t(`Indexando (${indexedCount}/${totalFiles})…`, `Indexing (${indexedCount}/${totalFiles})…`)
                  : indexedCount > 0 ? t(`${indexedCount} arquivo${indexedCount !== 1 ? "s" : ""} como contexto`, `${indexedCount} file${indexedCount !== 1 ? "s" : ""} as context`)
                    : t("Método socrático ativo", "Socratic method active")}
              </p>
            </div>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: courseColor }}>
            {t("Modo socrático", "Socratic mode")}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 px-5 py-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: courseColor }}>D</div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "rounded-tr-sm bg-[#6C47FF] text-white" : "rounded-tl-sm border border-gray-200 bg-white text-[#1a1a2e]"}`}>
                {msg.content}
              </div>
              {msg.role === "user" && session?.user?.image && (
                <img src={session.user.image} alt="" className="ml-2 mt-1 h-7 w-7 flex-shrink-0 rounded-full" />
              )}
            </div>
          ))}
          {loadingChat && (
            <div className="flex justify-start">
              <div className="mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: courseColor }}>D</div>
              <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3">
                <div className="flex gap-1">{[0, 150, 300].map(d => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-[#6C47FF]" style={{ animationDelay: `${d}ms`, opacity: 0.4 + d / 600 }} />)}</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
          <div className="flex items-end gap-3">
            <textarea ref={textareaRef} value={input} onChange={handleTextareaChange} onKeyDown={handleKeyDown}
              placeholder={indexingFiles ? t("Aguarde, indexando materiais…", "Please wait, indexing materials…") : t("Pergunte algo sobre a matéria...", "Ask something about the subject...")}
              disabled={indexingFiles} rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#6C47FF] focus:bg-white focus:ring-1 focus:ring-[#6C47FF]/30 disabled:opacity-50"
              style={{ height: "44px", minHeight: "44px", maxHeight: "120px" }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loadingChat || indexingFiles}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: courseColor }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            {t("Enter para enviar · Shift+Enter para nova linha", "Enter to send · Shift+Enter for new line")}
          </p>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── STUDY ─────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  function renderStudy() {
    const current = studyTypes.find(s => s.id === studyType)!
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
          <button onClick={() => { setMode("hub"); setStudyGenerated(false) }} className="text-xs text-gray-400 hover:text-gray-600">
            ← {t("Voltar", "Back")}
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <h2 className="text-sm font-bold text-[#1a1a2e]">📚 {t("Revisar a Matéria", "Review the Material")} — {courseName}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!studyGenerated ? (
            <>
              <ContentSelector fileContents={fileContents} ids={selectedFileIds} setIds={setSelectedFileIds} t={t} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {studyTypes.map(st => (
                  <button key={st.id} onClick={() => setStudyType(st.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${studyType === st.id ? "border-[#0ea5e9] bg-[#0ea5e9]/8 text-[#0ea5e9]" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}
                  >
                    <span className="text-2xl">{st.icon}</span>
                    <span className="text-xs font-semibold">{st.label}</span>
                    <span className="text-xs leading-tight text-gray-400">{st.desc}</span>
                  </button>
                ))}
              </div>
              <button onClick={generateStudy} disabled={loadingStudy || (fileContents.length > 0 && selectedFileIds.size === 0)}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "#0ea5e9" }}
              >
                {loadingStudy ? t("Gerando…", "Generating…") : `${t("Gerar", "Generate")} ${current.label}`}
              </button>
              {loadingStudy && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="flex gap-1">{[0, 150, 300].map(d => <span key={d} className="h-3 w-3 animate-bounce rounded-full bg-[#0ea5e9]" style={{ animationDelay: `${d}ms` }} />)}</div>
                  <p className="text-sm text-gray-400">{t("A IA está preparando seu conteúdo…", "AI is preparing your content…")}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{current.icon}</span>
                  <span className="font-semibold text-[#1a1a2e]">{current.label}</span>
                </div>
                <button onClick={() => { setStudyGenerated(false); setStudyResult(""); setStudyFlashcards([]) }} className="text-xs text-[#0ea5e9] hover:underline">
                  ← {t("Gerar outro", "Generate another")}
                </button>
              </div>
              {studyType === "flashcards" && studyFlashcards.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-xs text-gray-400">{t(`Cartão ${currentCard + 1} de ${studyFlashcards.length}`, `Card ${currentCard + 1} of ${studyFlashcards.length}`)}</p>
                  <div onClick={() => setCardFlipped(prev => !prev)} className="relative w-full max-w-md cursor-pointer select-none" style={{ perspective: "1000px" }}>
                    <div className="relative h-52 w-full transition-transform duration-500" style={{ transformStyle: "preserve-3d", transform: cardFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-[#0ea5e9]/30 bg-white p-6 text-center shadow-sm" style={{ backfaceVisibility: "hidden" }}>
                        <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0ea5e9]">{t("Frente", "Front")}</span>
                        <p className="text-base font-semibold leading-relaxed text-[#1a1a2e]">{studyFlashcards[currentCard].front}</p>
                        <p className="mt-3 text-xs text-gray-400">{t("Clique para revelar", "Click to reveal")}</p>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-[#0ea5e9] bg-[#0ea5e9]/5 p-6 text-center shadow-sm" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                        <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0ea5e9]">{t("Verso", "Back")}</span>
                        <p className="text-sm leading-relaxed text-[#1a1a2e]">{studyFlashcards[currentCard].back}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => { setCurrentCard(prev => Math.max(0, prev - 1)); setCardFlipped(false) }} disabled={currentCard === 0} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30">← {t("Anterior", "Previous")}</button>
                    <div className="flex gap-1">{studyFlashcards.map((_, i) => <button key={i} onClick={() => { setCurrentCard(i); setCardFlipped(false) }} className={`h-2 rounded-full transition-all ${i === currentCard ? "w-4 bg-[#0ea5e9]" : "w-2 bg-gray-200"}`} />)}</div>
                    <button onClick={() => { setCurrentCard(prev => Math.min(studyFlashcards.length - 1, prev + 1)); setCardFlipped(false) }} disabled={currentCard === studyFlashcards.length - 1} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30">{t("Próximo", "Next")} →</button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#1a1a2e]">{studyResult}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── QUIZ ──────────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  function renderQuiz() {
    // Results
    if (quizGenerated && quizFinished) {
      const score = quizQuestions.filter((q, i) => quizAnswers[i] === q.correct).length
      const pct = Math.round((score / quizQuestions.length) * 100)
      return (
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-8">
          <div className="w-full max-w-lg space-y-6 text-center">
            <div>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#22c55e]/10 text-4xl">
                {score >= quizQuestions.length * 0.7 ? "🎉" : score >= quizQuestions.length * 0.5 ? "👍" : "💪"}
              </div>
              <h2 className="font-['Sora',sans-serif] text-3xl font-bold" style={{ color: scoreColor(pct) }}>
                {pct}%
              </h2>
              <p className="text-sm font-medium text-gray-500 mt-1">
                {score}/{quizQuestions.length} {t("questões", "questions")}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {pct >= 70 ? t("Excelente! Você domina o conteúdo.", "Excellent! You've mastered the content.")
                  : pct >= 50 ? t("Bom trabalho! Continue estudando.", "Good work! Keep studying.")
                    : t("Continue praticando! Você vai melhorar.", "Keep practicing! You'll improve.")}
              </p>
              {quizSaved && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  {t("Resultado salvo no seu histórico", "Result saved to your history")}
                </div>
              )}
            </div>

            <div className="space-y-3 text-left">
              {quizQuestions.map((q, i) => {
                const correct = quizAnswers[i] === q.correct
                return (
                  <div key={i} className={`rounded-xl border p-4 ${correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                    <div className="flex items-start gap-2">
                      <span className={`text-sm font-bold ${correct ? "text-green-600" : "text-red-600"}`}>{correct ? "✓" : "✗"}</span>
                      <div>
                        <p className="text-sm font-medium text-[#1a1a2e]">{q.question}</p>
                        {!correct && <p className="mt-1 text-xs text-gray-600">{t("Correto:", "Correct:")} {q.options[q.correct]}</p>}
                        <p className="mt-1 text-xs text-gray-500">{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setQuizGenerated(false); setQuizFinished(false) }} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
                {t("Novo simulado", "New quiz")}
              </button>
              <button onClick={() => setMode("hub")} className="flex-1 rounded-xl py-3 text-sm font-medium text-white" style={{ backgroundColor: "#22c55e" }}>
                {t("Voltar ao início", "Back to start")}
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Active quiz
    if (quizGenerated && quizQuestions.length > 0) {
      const q = quizQuestions[currentQuestion]
      const answered = quizAnswers[currentQuestion]
      const revealed = quizRevealed[currentQuestion]

      return (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => { setMode("hub"); setQuizGenerated(false) }} className="text-xs text-gray-400 hover:text-gray-600">← {t("Sair", "Exit")}</button>
              <div className="h-4 w-px bg-gray-200" />
              <h2 className="text-sm font-bold text-[#1a1a2e]">📝 {t(`Questão ${currentQuestion + 1} de ${quizQuestions.length}`, `Question ${currentQuestion + 1} of ${quizQuestions.length}`)}</h2>
            </div>
            <div className="flex gap-1">
              {quizQuestions.map((_, i) => (
                <div key={i} className={`h-2 w-2 rounded-full ${i < currentQuestion ? quizAnswers[i] === quizQuestions[i].correct ? "bg-green-500" : "bg-red-400" : i === currentQuestion ? "bg-[#22c55e]" : "bg-gray-200"}`} />
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="mx-auto w-full max-w-2xl space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="text-sm font-semibold leading-relaxed text-[#1a1a2e]">{q.question}</p>
              </div>
              <div className="space-y-3">
                {q.options.map((opt, i) => {
                  let cls = "border-gray-200 bg-white text-[#1a1a2e] hover:border-[#22c55e]/50 hover:bg-[#22c55e]/5"
                  if (revealed) {
                    if (i === q.correct) cls = "border-green-500 bg-green-50 text-green-800"
                    else if (i === answered) cls = "border-red-400 bg-red-50 text-red-700"
                    else cls = "border-gray-100 bg-gray-50 text-gray-400"
                  } else if (answered === i) cls = "border-[#22c55e] bg-[#22c55e]/8 text-[#1a1a2e]"
                  return (
                    <button key={i} disabled={revealed}
                      onClick={() => { const next = [...quizAnswers]; next[currentQuestion] = i; setQuizAnswers(next) }}
                      className={`w-full rounded-xl border p-4 text-left text-sm transition-all disabled:cursor-default ${cls}`}
                    >{opt}</button>
                  )
                })}
              </div>
              {revealed && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-sm text-blue-800">{q.explanation}</p></div>}
              <div className="flex gap-3 pt-2">
                {!revealed ? (
                  <button
                    onClick={() => { if (answered === null || answered === undefined) return; const next = [...quizRevealed]; next[currentQuestion] = true; setQuizRevealed(next) }}
                    disabled={answered === null || answered === undefined}
                    className="flex-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
                    style={{ backgroundColor: "#22c55e" }}
                  >{t("Confirmar resposta", "Confirm answer")}</button>
                ) : (
                  <button
                    onClick={() => {
                      if (currentQuestion < quizQuestions.length - 1) {
                        setCurrentQuestion(prev => prev + 1)
                      } else {
                        const finalAnswers = quizAnswers
                        setQuizFinished(true)
                        saveQuizResult(finalAnswers)
                      }
                    }}
                    className="flex-1 rounded-xl py-3 text-sm font-semibold text-white"
                    style={{ backgroundColor: "#22c55e" }}
                  >{currentQuestion < quizQuestions.length - 1 ? t("Próxima questão →", "Next question →") : t("Ver resultado →", "See results →")}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Setup
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
          <button onClick={() => setMode("hub")} className="text-xs text-gray-400 hover:text-gray-600">← {t("Voltar", "Back")}</button>
          <div className="h-4 w-px bg-gray-200" />
          <h2 className="text-sm font-bold text-[#1a1a2e]">📝 {t("Teste o Seu Conhecimento", "Test Your Knowledge")} — {courseName}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <ContentSelector fileContents={fileContents} ids={selectedQuizFileIds} setIds={setSelectedQuizFileIds} t={t} />
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{t("Número de questões", "Number of questions")}</p>
            <div className="flex gap-2">
              {[5, 10, 15].map(n => (
                <button key={n} onClick={() => setQuestionCount(n)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all ${questionCount === n ? "border-[#22c55e] bg-[#22c55e]/8 text-[#22c55e]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                >{n}</button>
              ))}
            </div>
          </div>
          <button onClick={generateQuiz} disabled={loadingQuiz || (fileContents.length > 0 && selectedQuizFileIds.size === 0)}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: "#22c55e" }}
          >{loadingQuiz ? t("Gerando simulado…", "Generating quiz…") : t("Gerar Simulado", "Generate Quiz")}</button>
          {loadingQuiz && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex gap-1">{[0, 150, 300].map(d => <span key={d} className="h-3 w-3 animate-bounce rounded-full bg-[#22c55e]" style={{ animationDelay: `${d}ms` }} />)}</div>
              <p className="text-sm text-gray-400">{t("A IA está criando o seu simulado…", "AI is creating your quiz…")}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── SIDEBAR CONTENT ───────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  function renderSidebar() {
    return (
      <aside className="hidden w-[360px] flex-shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex border-b border-gray-100">
          {(["materials", "assignments", "announcements"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === tab ? "border-b-2 text-[#6C47FF]" : "text-gray-400 hover:text-gray-600"}`}
              style={activeTab === tab ? { borderBottomColor: courseColor } : {}}
            >
              {tab === "assignments" ? t("Atividades", "Assignments") : tab === "materials" ? t("Materiais", "Materials") : t("Avisos", "Announcements")}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 p-4">
          {loadingContent && <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}</div>}

          {!loadingContent && activeTab === "materials" && (
            materials.length === 0
              ? <p className="py-8 text-center text-sm text-gray-400">{t("Nenhum material", "No materials")}</p>
              : materials.map(m => (
                <div key={m.id} className="space-y-2 rounded-xl border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-[#1a1a2e]">{m.title}</h4>
                  {m.description && <p className="line-clamp-2 text-xs text-gray-500">{m.description}</p>}
                  {(m.driveFiles ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.driveFiles!.map(f => (
                        <span key={f.id} className="inline-flex items-center gap-1 rounded-md bg-[#6C47FF]/8 px-2 py-0.5 text-xs text-[#6C47FF]">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                          {f.title || t("Arquivo", "File")}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.alternateLink && <a href={m.alternateLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6C47FF] hover:underline">{t("Abrir no Classroom ↗", "Open in Classroom ↗")}</a>}
                </div>
              ))
          )}

          {!loadingContent && activeTab === "assignments" && (
            assignments.length === 0
              ? <p className="py-8 text-center text-sm text-gray-400">{t("Nenhuma atividade", "No assignments")}</p>
              : assignments.map(a => {
                const due = getDueLabel(a.dueDate, t)
                return (
                  <div key={a.id} className="space-y-2 rounded-xl border border-gray-200 p-4">
                    <h4 className="text-sm font-semibold text-[#1a1a2e]">{a.title}</h4>
                    {a.description && <p className="line-clamp-2 text-xs text-gray-500">{a.description}</p>}
                    {(a.driveFiles ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {a.driveFiles!.map(f => (
                          <span key={f.id} className="inline-flex items-center gap-1 rounded-md bg-[#6C47FF]/8 px-2 py-0.5 text-xs text-[#6C47FF]">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                            {f.title || t("Arquivo", "File")}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      {due && <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${due.cls}`}>{due.label}</span>}
                      {a.alternateLink && <a href={a.alternateLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6C47FF] hover:underline">{t("Abrir no Classroom ↗", "Open in Classroom ↗")}</a>}
                    </div>
                  </div>
                )
              })
          )}

          {!loadingContent && activeTab === "announcements" && (
            announcements.length === 0
              ? <p className="py-8 text-center text-sm text-gray-400">{t("Nenhum aviso", "No announcements")}</p>
              : announcements.map(a => (
                <div key={a.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm leading-relaxed text-amber-800">{a.text}</p>
                  {a.alternateLink && <a href={a.alternateLink} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-amber-600 hover:underline">{t("Ver no Classroom ↗", "View in Classroom ↗")}</a>}
                </div>
              ))
          )}
        </div>
      </aside>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen flex-col bg-[#F8F7FF]">
      <header className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button onClick={() => router.push("/dashboard/student")} className="text-sm text-gray-400 hover:text-gray-600">
            {t("← Voltar", "← Back")}
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: courseColor }}>
            {courseName.charAt(0) || "?"}
          </div>
          <div>
            <h1 className="font-['Sora',sans-serif] text-sm font-bold text-[#1a1a2e]">{courseName || t("Carregando...", "Loading...")}</h1>
            <p className="text-xs text-gray-400">Google Classroom</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {indexingFiles && (
              <div className="flex items-center gap-2 rounded-full bg-[#6C47FF]/8 px-3 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#6C47FF]" />
                <span className="text-xs text-[#6C47FF]">{t(`Lendo materiais ${indexedCount}/${totalFiles}…`, `Reading materials ${indexedCount}/${totalFiles}…`)}</span>
              </div>
            )}
            {!indexingFiles && indexedCount > 0 && mode === "hub" && (
              <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1">
                <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span className="text-xs text-green-600">{t(`${indexedCount} arquivo${indexedCount !== 1 ? "s" : ""} indexado${indexedCount !== 1 ? "s" : ""}`, `${indexedCount} file${indexedCount !== 1 ? "s" : ""} indexed`)}</span>
              </div>
            )}
            <LangToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {renderSidebar()}
        <div className="flex flex-1 flex-col overflow-hidden">
          {mode === "hub" && renderHub()}
          {mode === "chat" && renderChat()}
          {mode === "study" && renderStudy()}
          {mode === "quiz" && renderQuiz()}
        </div>
      </div>
    </div>
  )
}
