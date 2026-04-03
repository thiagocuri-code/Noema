"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

// ── Types ──────────────────────────────────────────────────────────────────────
interface Profile {
  learningStyle: string
  goal: string
  hardSubject: string
  helpPreference: string
  studyTime: string
  feedbackStyle: string
  schoolYear: string
  completedAt: string
}

type Answers = Partial<Omit<Profile, "completedAt">> & { goalOther?: string }

// ── Questions config ──────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    key: "learningStyle" as const,
    question: "Como você aprende melhor?",
    options: [
      { label: "Vendo exemplos visuais", icon: "👁️" },
      { label: "Lendo explicações detalhadas", icon: "📖" },
      { label: "Resolvendo exercícios", icon: "✏️" },
      { label: "Ouvindo alguém explicar", icon: "🎧" },
    ],
    multi: false,
  },
  {
    key: "goal" as const,
    question: "Qual é o seu objetivo após o ensino médio?",
    options: [
      { label: "Medicina", icon: "🩺" },
      { label: "Engenharia", icon: "⚙️" },
      { label: "Direito", icon: "⚖️" },
      { label: "Ciências Exatas", icon: "🔬" },
      { label: "Ciências Humanas", icon: "🏛️" },
      { label: "Ciências Biológicas", icon: "🧬" },
      { label: "Ainda não sei", icon: "🤷" },
    ],
    hasOther: true,
    multi: false,
  },
  {
    key: "hardSubject" as const,
    question: "Qual matéria você tem mais dificuldade hoje?",
    options: [
      { label: "Matemática", icon: "📐" },
      { label: "Física", icon: "⚡" },
      { label: "Química", icon: "🧪" },
      { label: "Biologia", icon: "🦠" },
      { label: "Português", icon: "📝" },
      { label: "História", icon: "🏺" },
      { label: "Geografia", icon: "🌍" },
      { label: "Inglês", icon: "🇺🇸" },
    ],
    multi: false,
  },
  {
    key: "helpPreference" as const,
    question: "Quando você trava em um exercício, o que prefere?",
    options: [
      { label: "Uma dica pequena para continuar sozinho", icon: "💡" },
      { label: "Uma explicação passo a passo", icon: "🪜" },
      { label: "Ver exemplos parecidos", icon: "📋" },
      { label: "Só a resposta para conferir", icon: "✅" },
    ],
    multi: false,
  },
  {
    key: "studyTime" as const,
    question: "Quanto tempo por dia você consegue estudar?",
    options: [
      { label: "Menos de 1 hora", icon: "⏱️" },
      { label: "1 a 2 horas", icon: "🕐" },
      { label: "2 a 4 horas", icon: "🕑" },
      { label: "Mais de 4 horas", icon: "🕓" },
    ],
    multi: false,
  },
  {
    key: "feedbackStyle" as const,
    question: "Como você prefere receber feedback?",
    options: [
      { label: "Direto e objetivo", icon: "🎯" },
      { label: "Com bastante encorajamento", icon: "🌟" },
      { label: "Muito detalhado", icon: "🔍" },
      { label: "Depende do momento", icon: "🎭" },
    ],
    multi: false,
  },
  {
    key: "schoolYear" as const,
    question: "Em qual ano do ensino médio você está?",
    options: [
      { label: "1º ano", icon: "1️⃣" },
      { label: "2º ano", icon: "2️⃣" },
      { label: "3º ano", icon: "3️⃣" },
      { label: "Já terminei", icon: "🎓" },
      { label: "Cursinho pré-vestibular", icon: "📚" },
    ],
    multi: false,
  },
] as const

const DRAFT_KEY = "trix_profile_draft"
const PROFILE_KEY = "trix_profile"

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [step, setStep] = useState<"intro" | "quiz" | "done">("intro")
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [goalOther, setGoalOther] = useState("")
  const [animDir, setAnimDir] = useState<"enter" | "exit">("enter")
  const [visible, setVisible] = useState(true)

  // Load draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        setAnswers(parsed.answers ?? {})
        setGoalOther(parsed.goalOther ?? "")
        if (typeof parsed.currentQ === "number") {
          setCurrentQ(parsed.currentQ)
          setStep("quiz")
        }
      }
    } catch { /* ignore */ }
  }, [])

  // Save draft on every answer change
  useEffect(() => {
    if (step !== "quiz") return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, goalOther, currentQ }))
    } catch { /* ignore */ }
  }, [answers, goalOther, currentQ, step])

  function goToQuiz() {
    setStep("quiz")
  }

  function selectOption(key: keyof Answers, value: string) {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  function nextQuestion() {
    if (currentQ < QUESTIONS.length - 1) {
      setVisible(false)
      setTimeout(() => {
        setCurrentQ(prev => prev + 1)
        setVisible(true)
      }, 220)
    } else {
      finishQuiz()
    }
  }

  function prevQuestion() {
    if (currentQ === 0) return
    setVisible(false)
    setTimeout(() => {
      setCurrentQ(prev => prev - 1)
      setVisible(true)
    }, 220)
  }

  function finishQuiz() {
    const q = QUESTIONS[currentQ]
    const goalValue =
      q.key === "goal" && answers.goal === undefined && goalOther
        ? goalOther
        : answers.goal === "Outro" && goalOther
          ? goalOther
          : answers.goal

    const profile: Profile = {
      learningStyle: answers.learningStyle ?? "",
      goal: goalValue ?? "",
      hardSubject: answers.hardSubject ?? "",
      helpPreference: answers.helpPreference ?? "",
      studyTime: answers.studyTime ?? "",
      feedbackStyle: answers.feedbackStyle ?? "",
      schoolYear: answers.schoolYear ?? "",
      completedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
      localStorage.removeItem(DRAFT_KEY)
    } catch { /* ignore */ }

    // Save to Supabase (fire-and-forget — don't block UI)
    const googleId = (session as any)?.googleId
    if (googleId) {
      fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, googleId }),
      }).catch(() => { /* ignore network errors */ })
    }

    setStep("done")
  }

  const q = QUESTIONS[currentQ]
  const currentAnswer = answers[q?.key as keyof Answers] as string | undefined
  const canProceed =
    q?.key === "goal"
      ? (currentAnswer && currentAnswer !== "Outro") || (currentAnswer === "Outro" && goalOther.trim().length > 0) || currentAnswer !== undefined
      : !!currentAnswer

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F7FF] px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6C47FF] shadow-lg shadow-[#6C47FF]/30">
              <span className="font-['Sora',sans-serif] text-2xl font-bold text-white">N</span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-['Sora',sans-serif] text-3xl font-bold text-[#1a1a2e]">
              Torne sua experiência única
            </h1>
            <p className="text-base leading-relaxed text-gray-500">
              Responder{" "}
              <span className="font-semibold text-[#6C47FF]">7 perguntas</span>{" "}
              permite que a Noema personalize completamente o jeito que ela te ensina.
              Leva menos de 2 minutos.
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            {["7 perguntas", "2 minutos", "100% seu"].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6C47FF]/10">
                  <span className="text-xs font-bold text-[#6C47FF]">{["7", "2", "★"][i]}</span>
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={goToQuiz}
            className="w-full rounded-2xl bg-[#6C47FF] py-4 font-['Sora',sans-serif] text-base font-semibold text-white shadow-lg shadow-[#6C47FF]/30 transition-all hover:bg-[#5a3de0] hover:shadow-[#6C47FF]/40 active:scale-[0.98]"
          >
            Vamos lá →
          </button>

          <button
            onClick={() => router.push("/dashboard/student")}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Pular por enquanto
          </button>
        </div>
      </div>
    )
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F7FF] px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#6C47FF]/10">
            <svg className="h-12 w-12 text-[#6C47FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="font-['Sora',sans-serif] text-2xl font-bold text-[#1a1a2e]">
              Pronto! A Noema já sabe como te ajudar.
            </h1>
            <p className="text-sm text-gray-500">
              Sua experiência foi personalizada com base nas suas respostas.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard/student")}
            className="w-full rounded-2xl bg-[#6C47FF] py-4 font-['Sora',sans-serif] text-base font-semibold text-white shadow-lg shadow-[#6C47FF]/30 transition-all hover:bg-[#5a3de0] active:scale-[0.98]"
          >
            Acessar meu painel →
          </button>
        </div>
      </div>
    )
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F7FF]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm px-6 py-4 border-b border-gray-100">
        <div className="mx-auto max-w-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-medium text-[#6C47FF]">
              {currentQ + 1} de {QUESTIONS.length}
            </span>
            <button
              onClick={() => router.push("/dashboard/student")}
              className="text-gray-400 hover:text-gray-600"
            >
              Pular
            </button>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#6C47FF] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div
          className="w-full max-w-lg space-y-6 transition-all duration-220"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(40px)",
          }}
        >
          <h2 className="font-['Sora',sans-serif] text-xl font-bold text-[#1a1a2e] text-center">
            {q.question}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {q.options.map((opt) => {
              const selected = currentAnswer === opt.label
              return (
                <button
                  key={opt.label}
                  onClick={() => selectOption(q.key as keyof Answers, opt.label)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all active:scale-[0.97] ${
                    selected
                      ? "border-[#6C47FF] bg-[#6C47FF]/8 text-[#6C47FF]"
                      : "border-gray-200 bg-white text-gray-700 hover:border-[#6C47FF]/40"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-sm font-medium leading-tight">{opt.label}</span>
                </button>
              )
            })}

            {/* "hasOther" extra option for goal question */}
            {"hasOther" in q && q.hasOther && (
              <button
                onClick={() => selectOption(q.key as keyof Answers, "Outro")}
                className={`col-span-2 flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all active:scale-[0.97] ${
                  currentAnswer === "Outro"
                    ? "border-[#6C47FF] bg-[#6C47FF]/8 text-[#6C47FF]"
                    : "border-gray-200 bg-white text-gray-700 hover:border-[#6C47FF]/40"
                }`}
              >
                <span className="text-2xl">✏️</span>
                <span className="text-sm font-medium">Outro</span>
              </button>
            )}
          </div>

          {/* "Outro" text field */}
          {"hasOther" in q && q.hasOther && currentAnswer === "Outro" && (
            <input
              type="text"
              value={goalOther}
              onChange={e => setGoalOther(e.target.value)}
              placeholder="Qual é o seu objetivo?"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF]/30"
              autoFocus
            />
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 pt-2">
            {currentQ > 0 && (
              <button
                onClick={prevQuestion}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                ← Anterior
              </button>
            )}
            <button
              onClick={nextQuestion}
              disabled={!canProceed}
              className="flex-1 rounded-xl bg-[#6C47FF] py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#5a3de0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {currentQ < QUESTIONS.length - 1 ? "Próxima →" : "Concluir →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
