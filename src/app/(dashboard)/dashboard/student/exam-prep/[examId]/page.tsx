"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useLang, LangToggle } from "@/lib/lang-context"
import { AthenaLogo } from "@/components/shared/athena-logo"
import { MarkdownRenderer } from "@/components/shared/markdown-renderer"
import { computeExamProgress, bandColor, bandLabel } from "@/lib/exam-progress"

interface Exam {
  id: string
  courseId: string
  courseName: string
  title: string
  examDate: string | null
  fileIds: string[]
  fileTitles: string[]
  contextSnapshot: string
  topicsWeak: string[]
  topicsStrong: string[]
  topicsReviewed: string[]
  diagnosticScore: number | null
  simuladoScores: number[]
  revisionCount: number
  flashcardsStudied: number
}

interface QuizQuestion { question: string; options: string[]; correct: number; explanation: string }
interface Flashcard { front: string; back: string }

type Mode = "hub" | "simulado" | "flashcards" | "resumo"

// Wraps the context with weak-topic instructions so the AI prioritizes gaps.
function withExamFocus(context: string, exam: Exam, lang: string): string {
  const weakBlock = exam.topicsWeak.length
    ? `\n\n[INSTRUÇÃO CRÍTICA — ESTUDO PARA PROVA]\nEste estudante está se preparando para a prova "${exam.title}" de ${exam.courseName}.\nDificuldades mapeadas no diagnóstico: ${exam.topicsWeak.join(", ")}.\nTópicos já dominados: ${exam.topicsStrong.join(", ") || "—"}.\nPRIORIZE os tópicos de dificuldade ao gerar conteúdo. Quando abordar um tópico dominado, seja mais breve; quando abordar um fraco, seja didático e explique o raciocínio passo a passo.`
    : `\n\n[ESTUDO PARA PROVA]\nEste estudante está se preparando para a prova "${exam.title}" de ${exam.courseName}.`
  return context + weakBlock
}

export default function ExamHubPage() {
  const { examId } = useParams<{ examId: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { t, lang } = useLang()
  const googleId = (session as any)?.googleId as string | undefined

  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>("hub")
  const [welcomeOpen, setWelcomeOpen] = useState(searchParams.get("welcome") === "1")

  // Simulado state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([])
  const [quizRevealed, setQuizRevealed] = useState<boolean[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [quizSaved, setQuizSaved] = useState(false)
  const [quizError, setQuizError] = useState("")

  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [cardsViewed, setCardsViewed] = useState<Set<number>>(new Set())
  const [loadingCards, setLoadingCards] = useState(false)
  const [cardsError, setCardsError] = useState("")

  // Resumo state
  const [resumoText, setResumoText] = useState("")
  const [loadingResumo, setLoadingResumo] = useState(false)
  const [resumoError, setResumoError] = useState("")
  const [resumoSaved, setResumoSaved] = useState(false)

  const loadExam = useCallback(() => {
    if (!googleId || !examId) return
    fetch(`/api/exam/${examId}?googleId=${googleId}`)
      .then(r => r.json())
      .then(data => {
        if (data.exam) setExam(data.exam)
      })
      .catch(() => { /* silent */ })
      .finally(() => setLoading(false))
  }, [googleId, examId])

  useEffect(() => { loadExam() }, [loadExam])

  function patchExam(action: string, data: any) {
    if (!googleId) return
    fetch(`/api/exam/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleId, action, data }),
    })
      .then(r => r.json())
      .then(res => { if (res.exam) setExam(res.exam) })
      .catch(() => { /* silent */ })
  }

  // Generate simulado focused on weak topics
  async function startSimulado() {
    if (!exam) return
    setMode("simulado")
    setLoadingQuiz(true)
    setQuizError("")
    setQuizFinished(false)
    setQuizSaved(false)
    setCurrentQ(0)

    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: withExamFocus(exam.contextSnapshot, exam, lang),
          courseName: exam.courseName,
          questionCount: 5,
          lang,
          selectedFileNames: exam.fileTitles,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setQuizError(data.error)
      } else {
        setQuizQuestions(data.questions ?? [])
        setQuizAnswers(new Array(data.questions?.length ?? 0).fill(null))
        setQuizRevealed(new Array(data.questions?.length ?? 0).fill(false))
      }
    } catch (err: any) {
      setQuizError(err?.message ?? "Erro")
    } finally {
      setLoadingQuiz(false)
    }
  }

  function answerQuiz(idx: number) {
    if (quizRevealed[currentQ]) return
    const nextA = [...quizAnswers]; nextA[currentQ] = idx
    const nextR = [...quizRevealed]; nextR[currentQ] = true
    setQuizAnswers(nextA)
    setQuizRevealed(nextR)
  }

  function finalizeQuiz() {
    if (!quizQuestions.length) return
    const correct = quizQuestions.reduce((a, q, i) => a + (quizAnswers[i] === q.correct ? 1 : 0), 0)
    const score = Math.round((correct / quizQuestions.length) * 100)
    patchExam("add_simulado_score", { score })
    setQuizFinished(true)
    setQuizSaved(true)
  }

  // Generate flashcards focused on weak topics
  async function startFlashcards() {
    if (!exam) return
    setMode("flashcards")
    setLoadingCards(true)
    setCardsError("")
    setCurrentCard(0)
    setCardFlipped(false)
    setCardsViewed(new Set())

    try {
      const res = await fetch("/api/ai/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "flashcards",
          content: withExamFocus(exam.contextSnapshot, exam, lang),
          courseName: exam.courseName,
          lang,
          selectedFileNames: exam.fileTitles,
          difficulty: "medio",
        }),
      })
      const data = await res.json()
      if (data.error) setCardsError(data.error)
      else setFlashcards(data.flashcards ?? [])
    } catch (err: any) {
      setCardsError(err?.message ?? "Erro")
    } finally {
      setLoadingCards(false)
    }
  }

  function flipCard() {
    setCardFlipped(f => {
      if (!f && !cardsViewed.has(currentCard)) {
        setCardsViewed(prev => new Set(prev).add(currentCard))
      }
      return !f
    })
  }

  function nextCard() {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1)
      setCardFlipped(false)
    }
  }

  function finishFlashcards() {
    // Track only newly-viewed cards
    const viewedCount = cardsViewed.size + (cardFlipped && !cardsViewed.has(currentCard) ? 1 : 0)
    if (viewedCount > 0) patchExam("add_flashcards", { count: viewedCount })
    setMode("hub")
  }

  // Generate resumo focused on weak topics
  async function startResumo() {
    if (!exam) return
    setMode("resumo")
    setLoadingResumo(true)
    setResumoError("")
    setResumoText("")
    setResumoSaved(false)

    try {
      const res = await fetch("/api/ai/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "resumo",
          content: withExamFocus(exam.contextSnapshot, exam, lang),
          courseName: exam.courseName,
          lang,
          selectedFileNames: exam.fileTitles,
          difficulty: "medio",
        }),
      })
      const data = await res.json()
      if (data.error) setResumoError(data.error)
      else setResumoText(data.text ?? "")
    } catch (err: any) {
      setResumoError(err?.message ?? "Erro")
    } finally {
      setLoadingResumo(false)
    }
  }

  function markTopicReviewed(topic: string) {
    patchExam("add_revision", { topic })
  }

  function markResumoAsRevision(topic?: string) {
    if (resumoSaved) return
    patchExam("add_revision", { topic })
    setResumoSaved(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#0a1a4a]" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">{t("Prova não encontrada", "Exam not found")}</p>
          <Link href="/dashboard/student" className="text-sm text-[#0a1a4a] hover:underline">
            ← {t("Voltar", "Back")}
          </Link>
        </div>
      </div>
    )
  }

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

  const weakPending = exam.topicsWeak.filter(tp => !exam.topicsReviewed.includes(tp))
  const weakDone = exam.topicsWeak.filter(tp => exam.topicsReviewed.includes(tp))

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 min-w-0">
            <AthenaLogo variant="full" size="md" />
            <Link href="/dashboard/student" className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap">
              ← {t("Voltar", "Back")}
            </Link>
          </div>
          <LangToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        {welcomeOpen && (
          <div className="mb-6 rounded-2xl border border-[#0a1a4a]/20 bg-[#0a1a4a]/5 p-5 relative">
            <button
              onClick={() => setWelcomeOpen(false)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-lg"
            >
              ×
            </button>
            <p className="font-bold text-[#0a1a4a]">
              🎯 {t("Seu plano de estudo está pronto!", "Your study plan is ready!")}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {t(
                `A athena mapeou ${exam.topicsWeak.length} tópico${exam.topicsWeak.length !== 1 ? "s" : ""} para focar. Para chegar em DE, você precisa revisar todos eles + 20 flashcards + 100% em um simulado. Bora?`,
                `Athena flagged ${exam.topicsWeak.length} topic${exam.topicsWeak.length !== 1 ? "s" : ""} to focus on. To reach DE, review them all + 20 flashcards + 100% on a simulado. Let's go?`
              )}
            </p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            🎯 {t("Estudar para provas", "Exam prep")} · {exam.courseName}
          </p>
          <h1 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-[#1a1a2e]">
            {exam.title}
          </h1>
          {exam.examDate && (
            <p className="mt-1 text-xs text-gray-500">
              {t("Data da prova: ", "Exam date: ")}
              {new Date(exam.examDate).toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Progress card */}
        <div className={`mb-6 rounded-2xl border-2 ${colors.border} ${colors.bg} p-5 sm:p-6`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-full border-4 bg-white"
                style={{ borderColor: colors.hex }}
              >
                <span className="text-lg font-bold" style={{ color: colors.hex }}>{label.abbr}</span>
                <span className="text-xs font-semibold text-gray-500">{progress.score}%</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: colors.hex }}>
                  {label.full}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#1a1a2e]">
                  {progress.nextMilestone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Stat label={t("Simulados", "Simulados")} value={exam.simuladoScores.length} />
              <Stat label={t("Revisões", "Revisions")} value={exam.revisionCount} />
              <Stat label={t("Flashcards", "Flashcards")} value={exam.flashcardsStudied} />
            </div>
          </div>

          {/* Unlock checklist for DE */}
          <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
            <UnlockChip done={progress.unlocksDE.simulado90} label={t("Simulado ≥90%", "Simulado ≥90%")} />
            <UnlockChip done={progress.unlocksDE.revisions3} label={t("3 revisões", "3 revisions")} />
            <UnlockChip done={progress.unlocksDE.flashcards20} label={t("20 flashcards", "20 flashcards")} />
            <UnlockChip done={progress.unlocksDE.allWeakReviewed} label={t("Tópicos fracos cobertos", "Weak topics covered")} />
          </div>
        </div>

        {mode === "hub" && (
          <>
            {/* Weak topics */}
            {exam.topicsWeak.length > 0 && (
              <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-[#1a1a2e]">
                    {t("Tópicos para revisar", "Topics to review")}
                  </h2>
                  <span className="text-xs text-gray-400">
                    {weakDone.length}/{exam.topicsWeak.length} {t("cobertos", "covered")}
                  </span>
                </div>
                {weakPending.length > 0 && (
                  <>
                    <p className="text-[11px] font-bold uppercase text-amber-600 mb-1.5">
                      {t("Pendentes", "Pending")}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {weakPending.map(topic => (
                        <button
                          key={topic}
                          onClick={() => markTopicReviewed(topic)}
                          className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                          title={t("Marcar como revisado", "Mark as reviewed")}
                        >
                          {topic} <span className="opacity-60 ml-1">✓</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {weakDone.length > 0 && (
                  <>
                    <p className="text-[11px] font-bold uppercase text-green-600 mb-1.5">
                      {t("Revisados", "Reviewed")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {weakDone.map(topic => (
                        <span key={topic} className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          ✓ {topic}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {exam.topicsStrong.length > 0 && (
              <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="text-sm font-bold text-[#1a1a2e] mb-3">
                  {t("Você já domina", "You already master")}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {exam.topicsStrong.map(topic => (
                    <span key={topic} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      ★ {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <ActionCard
                icon="📝"
                title={t("Simulado", "Simulado")}
                desc={t("5 questões focadas nas suas dificuldades", "5 questions focused on your gaps")}
                onClick={startSimulado}
                accent="#0a1a4a"
              />
              <ActionCard
                icon="🃏"
                title={t("Flashcards", "Flashcards")}
                desc={t("10 cards de estudo ativo — prioriza tópicos fracos", "10 active-recall cards — weak topics first")}
                onClick={startFlashcards}
                accent="#8b5cf6"
              />
              <ActionCard
                icon="📖"
                title={t("Resumo", "Summary")}
                desc={t("Resumo estruturado priorizando seus pontos fracos", "Structured summary prioritizing your gaps")}
                onClick={startResumo}
                accent="#0ea5e9"
              />
            </div>

            {exam.fileTitles.length > 0 && (
              <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[11px] font-bold uppercase text-gray-400 mb-2">
                  {t("Materiais incluídos nesta prova", "Materials in this exam")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {exam.fileTitles.map((t, i) => (
                    <span key={i} className="rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-[11px] text-gray-600">
                      📄 {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Simulado mode */}
        {mode === "simulado" && (
          <SectionWrap title={t("Simulado", "Simulado")} onBack={() => setMode("hub")}>
            {loadingQuiz ? (
              <LoadingBlock msg={t("Criando simulado focado nos seus pontos fracos…", "Building a simulado focused on your gaps…")} />
            ) : quizError ? (
              <ErrorBlock msg={quizError} />
            ) : quizFinished ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
                {(() => {
                  const correct = quizQuestions.reduce((a, q, i) => a + (quizAnswers[i] === q.correct ? 1 : 0), 0)
                  const pct = Math.round((correct / quizQuestions.length) * 100)
                  return (
                    <>
                      <div className="text-4xl mb-2">{pct >= 80 ? "🎯" : pct >= 60 ? "💪" : "🌱"}</div>
                      <h2 className="text-xl font-bold text-[#1a1a2e]">
                        {correct}/{quizQuestions.length} · {pct}%
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {quizSaved ? t("Resultado salvo no seu painel.", "Result saved to your panel.") : ""}
                      </p>
                      <div className="mt-5 flex gap-3 justify-center">
                        <button
                          onClick={() => setMode("hub")}
                          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                          {t("Voltar ao painel", "Back to panel")}
                        </button>
                        <button
                          onClick={startSimulado}
                          className="rounded-xl bg-[#0a1a4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#071245]"
                        >
                          {t("Novo simulado", "New simulado")}
                        </button>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : quizQuestions.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">
                    {t("Questão", "Question")} {currentQ + 1}/{quizQuestions.length}
                  </span>
                </div>
                <div className="mb-5 h-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#0a1a4a] transition-all"
                    style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }}
                  />
                </div>
                <p className="mb-5 text-base font-medium text-[#1a1a2e]">
                  {quizQuestions[currentQ].question}
                </p>
                <div className="space-y-2">
                  {quizQuestions[currentQ].options.map((opt, i) => {
                    const revealed = quizRevealed[currentQ]
                    const picked = quizAnswers[currentQ] === i
                    const isCorrect = i === quizQuestions[currentQ].correct
                    let cls = "border-gray-200 hover:border-gray-300"
                    if (revealed) {
                      if (isCorrect) cls = "border-green-400 bg-green-50 text-green-800"
                      else if (picked) cls = "border-red-400 bg-red-50 text-red-800"
                      else cls = "border-gray-200 opacity-60"
                    } else if (picked) cls = "border-[#0a1a4a] bg-[#0a1a4a]/5 text-[#0a1a4a]"
                    return (
                      <button
                        key={i}
                        onClick={() => answerQuiz(i)}
                        disabled={revealed}
                        className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${cls}`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {quizRevealed[currentQ] && (
                  <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                    <strong>{t("Explicação: ", "Explanation: ")}</strong>
                    {quizQuestions[currentQ].explanation}
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  {currentQ < quizQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQ(currentQ + 1)}
                      disabled={!quizRevealed[currentQ]}
                      className="rounded-xl bg-[#0a1a4a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#071245] disabled:opacity-30"
                    >
                      {t("Próxima →", "Next →")}
                    </button>
                  ) : (
                    <button
                      onClick={finalizeQuiz}
                      disabled={!quizRevealed[currentQ]}
                      className="rounded-xl bg-[#0a1a4a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#071245] disabled:opacity-30"
                    >
                      {t("Finalizar", "Finish")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </SectionWrap>
        )}

        {/* Flashcards mode */}
        {mode === "flashcards" && (
          <SectionWrap title={t("Flashcards", "Flashcards")} onBack={finishFlashcards}>
            {loadingCards ? (
              <LoadingBlock msg={t("Gerando flashcards…", "Generating flashcards…")} />
            ) : cardsError ? (
              <ErrorBlock msg={cardsError} />
            ) : flashcards.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {t("Card", "Card")} {currentCard + 1}/{flashcards.length} · {cardsViewed.size} {t("vistos", "viewed")}
                  </span>
                </div>
                <div
                  onClick={flipCard}
                  className="cursor-pointer rounded-2xl border-2 border-[#8b5cf6]/40 bg-gradient-to-br from-white to-[#8b5cf6]/5 p-8 sm:p-12 min-h-[240px] flex items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#8b5cf6] mb-3">
                      {cardFlipped ? t("Resposta", "Answer") : t("Pergunta", "Question")}
                    </p>
                    <p className="text-lg font-medium text-[#1a1a2e]">
                      {cardFlipped ? flashcards[currentCard].back : flashcards[currentCard].front}
                    </p>
                    {!cardFlipped && (
                      <p className="mt-4 text-[11px] text-gray-400">
                        {t("Clique para ver a resposta", "Click to flip")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => { setCurrentCard(Math.max(0, currentCard - 1)); setCardFlipped(false) }}
                    disabled={currentCard === 0}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  >
                    ← {t("Anterior", "Previous")}
                  </button>
                  {currentCard < flashcards.length - 1 ? (
                    <button
                      onClick={nextCard}
                      className="rounded-xl bg-[#8b5cf6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7c3aed]"
                    >
                      {t("Próximo →", "Next →")}
                    </button>
                  ) : (
                    <button
                      onClick={finishFlashcards}
                      className="rounded-xl bg-[#8b5cf6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7c3aed]"
                    >
                      {t("Concluir", "Finish")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </SectionWrap>
        )}

        {/* Resumo mode */}
        {mode === "resumo" && (
          <SectionWrap title={t("Resumo", "Summary")} onBack={() => setMode("hub")}>
            {loadingResumo ? (
              <LoadingBlock msg={t("Gerando resumo personalizado…", "Generating personalized summary…")} />
            ) : resumoError ? (
              <ErrorBlock msg={resumoError} />
            ) : resumoText && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <MarkdownRenderer content={resumoText} />
                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => markResumoAsRevision(exam.topicsWeak[0])}
                    disabled={resumoSaved}
                    className="rounded-xl bg-[#0ea5e9] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0284c7] disabled:opacity-40"
                  >
                    {resumoSaved
                      ? t("✓ Revisão registrada", "✓ Revision tracked")
                      : t("Marcar como revisado", "Mark as reviewed")}
                  </button>
                </div>
              </div>
            )}
          </SectionWrap>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/70 px-3 py-2 text-center min-w-[70px]">
      <p className="text-lg font-bold text-[#1a1a2e] leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
    </div>
  )
}

function UnlockChip({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
      done ? "bg-emerald-100 text-emerald-700" : "bg-white/70 text-gray-500 border border-gray-200"
    }`}>
      {done ? "✓" : "○"} {label}
    </span>
  )
}

function ActionCard({ icon, title, desc, onClick, accent }: { icon: string; title: string; desc: string; onClick: () => void; accent: string }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border-2 border-gray-200 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderColor: accent + "33" }}
    >
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: accent + "18" }}
      >
        {icon}
      </div>
      <p className="font-bold text-[#1a1a2e]">{title}</p>
      <p className="mt-1 text-xs text-gray-500 leading-relaxed">{desc}</p>
    </button>
  )
}

function SectionWrap({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[var(--font-heading)] text-lg font-bold text-[#1a1a2e]">{title}</h2>
        <button onClick={onBack} className="text-xs text-gray-500 hover:text-gray-700">
          ← Voltar ao painel
        </button>
      </div>
      {children}
    </div>
  )
}

function LoadingBlock({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
      <div className="flex justify-center gap-1 mb-3">
        {[0, 150, 300].map(d => (
          <span key={d} className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#0a1a4a]" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
      <p className="text-sm font-medium text-[#1a1a2e]">{msg}</p>
    </div>
  )
}

function ErrorBlock({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {msg}
    </div>
  )
}
