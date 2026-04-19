"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { LotusLogo } from "@/components/shared/lotus-logo"

// ── Types ──────────────────────────────────────────────────────────────────────
interface Profile {
  learningStyle: string   // Perfil: Auditivo / Visual / Sinestésico
  goal: string            // Área + detalhe: "Exatas > Engenharia da Computação"
  hardSubject: string     // Matéria com mais dificuldade (do Classroom)
  helpPreference: string  // Formato de ajuda
  studyTime: string       // Estilo de aprendizagem (reused field)
  feedbackStyle: string   // Tom do feedback
  schoolYear: string      // Matéria com mais facilidade (reused field)
  completedAt: string
}

type Answers = Partial<Omit<Profile, "completedAt">>

// ── Goal sub-areas ─────────────────────────────────────────────────────────────
const GOAL_AREAS: {
  label: string
  icon: string
  courses: string[]
}[] = [
  {
    label: "Exatas",
    icon: "🔬",
    courses: [
      "Engenharia Civil",
      "Engenharia Mecânica",
      "Engenharia da Computação",
      "Engenharia Elétrica",
      "Engenharia Química",
      "Ciência da Computação",
      "Matemática",
      "Física",
      "Estatística",
      "Arquitetura",
    ],
  },
  {
    label: "Humanas",
    icon: "🏛️",
    courses: [
      "Direito",
      "Psicologia",
      "Administração",
      "Economia",
      "Ciências Sociais",
      "Relações Internacionais",
      "Jornalismo",
      "Publicidade",
      "Pedagogia",
      "Filosofia",
      "História",
    ],
  },
  {
    label: "Biológicas",
    icon: "🧬",
    courses: [
      "Medicina",
      "Enfermagem",
      "Odontologia",
      "Biomedicina",
      "Farmácia",
      "Nutrição",
      "Biologia",
      "Fisioterapia",
      "Educação Física",
      "Veterinária",
    ],
  },
  {
    label: "Não sei ainda",
    icon: "🤷",
    courses: [],
  },
]

// ── Profile type descriptions ──────────────────────────────────────────────────
const PROFILE_TYPES = [
  {
    label: "Visual",
    icon: "👁️",
    desc: "Aprende melhor com imagens, diagramas, mapas mentais e cores.",
  },
  {
    label: "Auditivo",
    icon: "🎧",
    desc: "Aprende melhor ouvindo explicações, podcasts e discussões.",
  },
  {
    label: "Sinestésico",
    icon: "🤲",
    desc: "Aprende melhor praticando, experimentando e fazendo exercícios.",
  },
]

const DRAFT_KEY = "trix_profile_draft"
const PROFILE_KEY = "trix_profile"

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [step, setStep] = useState<"intro" | "quiz" | "done">("intro")
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [visible, setVisible] = useState(true)

  // Goal sub-selection state
  const [goalArea, setGoalArea] = useState<string | null>(null)
  const [goalCourse, setGoalCourse] = useState<string | null>(null)

  // Classroom courses for difficulty/ease questions
  const [classroomCourses, setClassroomCourses] = useState<string[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)

  const TOTAL_QUESTIONS = 6

  // Load draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        setAnswers(parsed.answers ?? {})
        setGoalArea(parsed.goalArea ?? null)
        setGoalCourse(parsed.goalCourse ?? null)
        if (typeof parsed.currentQ === "number") {
          setCurrentQ(parsed.currentQ)
          setStep("quiz")
        }
      }
    } catch { /* ignore */ }
  }, [])

  // Fetch Classroom courses when entering quiz
  useEffect(() => {
    if (step !== "quiz" || !session?.accessToken) return
    setCoursesLoading(true)
    fetch(`/api/classroom/courses?accessToken=${session.accessToken}`)
      .then(r => r.json())
      .then(data => {
        const names = (data.courses ?? []).map((c: { name: string }) => c.name)
        setClassroomCourses(names)
      })
      .catch(() => {})
      .finally(() => setCoursesLoading(false))
  }, [step, session?.accessToken])

  // Save draft on every change
  useEffect(() => {
    if (step !== "quiz") return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, goalArea, goalCourse, currentQ }))
    } catch { /* ignore */ }
  }, [answers, goalArea, goalCourse, currentQ, step])

  function selectAnswer(key: keyof Answers, value: string) {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  function nextQuestion() {
    if (currentQ < TOTAL_QUESTIONS - 1) {
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
    const goalValue =
      goalArea === "Não sei ainda"
        ? "Não sei ainda"
        : goalCourse
          ? `${goalArea} > ${goalCourse}`
          : goalArea ?? ""

    const profile: Profile = {
      learningStyle: answers.learningStyle ?? "",
      goal: goalValue,
      hardSubject: answers.hardSubject ?? "",
      helpPreference: answers.helpPreference ?? "",
      studyTime: answers.studyTime ?? "",       // stores learning method
      feedbackStyle: answers.feedbackStyle ?? "",
      schoolYear: answers.schoolYear ?? "",     // stores easy subject
      completedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
      localStorage.removeItem(DRAFT_KEY)
    } catch { /* ignore */ }

    const googleId = (session as any)?.googleId
    if (googleId) {
      fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, googleId }),
      }).catch(() => {})
    }

    setStep("done")
  }

  // ── Can proceed logic per question ─────────────────────────────────────────
  function canProceed(): boolean {
    switch (currentQ) {
      case 0: return !!answers.learningStyle
      case 1: return goalArea === "Não sei ainda" || !!goalCourse
      case 2: return !!answers.hardSubject
      case 3: return !!answers.schoolYear
      case 4: return !!answers.helpPreference
      // case 5 handles both studyTime and feedbackStyle in a combined way
      case 5: return !!answers.feedbackStyle
      default: return false
    }
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <LotusLogo variant="full" size="lg" />
          </div>

          <div className="space-y-3">
            <h1 className="font-[var(--font-heading)] text-3xl font-bold text-[#1a1a2e]">
              Torne sua experiência única
            </h1>
            <p className="text-base leading-relaxed text-gray-500">
              Responder{" "}
              <span className="font-semibold text-[#0a1a4a]">6 perguntas</span>{" "}
              permite que a lótus personalize completamente o jeito que ela te ensina.
              Leva menos de 2 minutos.
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            {["6 perguntas", "2 minutos", "100% seu"].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a1a4a]/10">
                  <span className="text-xs font-bold text-[#0a1a4a]">{["6", "2", "★"][i]}</span>
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep("quiz")}
            className="w-full rounded-2xl bg-[#0a1a4a] py-4 font-[var(--font-heading)] text-base font-semibold text-white shadow-lg shadow-[#0a1a4a]/30 transition-all hover:bg-[#071245] hover:shadow-[#0a1a4a]/40 active:scale-[0.98]"
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#0a1a4a]/10">
            <svg className="h-12 w-12 text-[#0a1a4a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="font-[var(--font-heading)] text-2xl font-bold text-[#1a1a2e]">
              Pronto! A lótus já sabe como te ajudar.
            </h1>
            <p className="text-sm text-gray-500">
              Sua experiência foi personalizada com base nas suas respostas.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard/student")}
            className="w-full rounded-2xl bg-[#0a1a4a] py-4 font-[var(--font-heading)] text-base font-semibold text-white shadow-lg shadow-[#0a1a4a]/30 transition-all hover:bg-[#071245] active:scale-[0.98]"
          >
            Acessar meu painel →
          </button>
        </div>
      </div>
    )
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  const progress = ((currentQ + 1) / TOTAL_QUESTIONS) * 100

  // Render the current question content
  function renderQuestion() {
    switch (currentQ) {
      // ── Q1: Perfil do Estudante ──────────────────────────────────────────
      case 0:
        return (
          <>
            <h2 className="font-[var(--font-heading)] text-xl font-bold text-[#1a1a2e] text-center">
              Qual é o seu perfil de estudante?
            </h2>
            <div className="space-y-3">
              {PROFILE_TYPES.map(pt => {
                const selected = answers.learningStyle === pt.label
                return (
                  <button
                    key={pt.label}
                    onClick={() => selectAnswer("learningStyle", pt.label)}
                    className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.98] ${
                      selected
                        ? "border-[#0a1a4a] bg-[#0a1a4a]/8"
                        : "border-gray-200 bg-white hover:border-[#0a1a4a]/40"
                    }`}
                  >
                    <span className="text-3xl">{pt.icon}</span>
                    <div>
                      <p className={`text-sm font-bold ${selected ? "text-[#0a1a4a]" : "text-[#1a1a2e]"}`}>
                        {pt.label}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                        {pt.desc}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )

      // ── Q2: Objetivo / Área ──────────────────────────────────────────────
      case 1:
        const selectedArea = GOAL_AREAS.find(a => a.label === goalArea)
        return (
          <>
            <h2 className="font-[var(--font-heading)] text-xl font-bold text-[#1a1a2e] text-center">
              Qual área você pretende seguir?
            </h2>

            {/* Step 1: Choose area */}
            <div className="grid grid-cols-2 gap-3">
              {GOAL_AREAS.map(area => {
                const selected = goalArea === area.label
                return (
                  <button
                    key={area.label}
                    onClick={() => {
                      setGoalArea(area.label)
                      setGoalCourse(null)
                      if (area.courses.length === 0) {
                        // "Não sei ainda" — no sub-selection needed
                      }
                    }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all active:scale-[0.97] ${
                      selected
                        ? "border-[#0a1a4a] bg-[#0a1a4a]/8 text-[#0a1a4a]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-[#0a1a4a]/40"
                    }`}
                  >
                    <span className="text-2xl">{area.icon}</span>
                    <span className="text-sm font-medium">{area.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Step 2: Choose specific course */}
            {selectedArea && selectedArea.courses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Selecione o curso
                </p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {selectedArea.courses.map(course => {
                    const selected = goalCourse === course
                    return (
                      <button
                        key={course}
                        onClick={() => setGoalCourse(course)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                          selected
                            ? "border-[#0a1a4a] bg-[#0a1a4a]/10 text-[#0a1a4a]"
                            : "border-gray-200 bg-white text-gray-600 hover:border-[#0a1a4a]/50"
                        }`}
                      >
                        {course}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )

      // ── Q3: Maior dificuldade (do Classroom) ────────────────────────────
      case 2:
        return (
          <>
            <h2 className="font-[var(--font-heading)] text-xl font-bold text-[#1a1a2e] text-center">
              Qual matéria você tem mais dificuldade?
            </h2>
            <p className="text-center text-xs text-gray-400">
              Baseado nas suas turmas do Google Classroom
            </p>
            {coursesLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0a1a4a] border-t-transparent" />
              </div>
            ) : classroomCourses.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {classroomCourses.map(course => {
                  const selected = answers.hardSubject === course
                  return (
                    <button
                      key={course}
                      onClick={() => selectAnswer("hardSubject", course)}
                      className={`rounded-2xl border-2 px-4 py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                        selected
                          ? "border-[#0a1a4a] bg-[#0a1a4a]/8 text-[#0a1a4a]"
                          : "border-gray-200 bg-white text-gray-700 hover:border-[#0a1a4a]/40"
                      }`}
                    >
                      {course}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
                Nenhuma turma encontrada no Classroom.
              </div>
            )}
          </>
        )

      // ── Q4: Maior facilidade (do Classroom) ─────────────────────────────
      case 3:
        return (
          <>
            <h2 className="font-[var(--font-heading)] text-xl font-bold text-[#1a1a2e] text-center">
              E qual matéria é mais fácil pra você?
            </h2>
            <p className="text-center text-xs text-gray-400">
              Baseado nas suas turmas do Google Classroom
            </p>
            {coursesLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0a1a4a] border-t-transparent" />
              </div>
            ) : classroomCourses.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {classroomCourses.map(course => {
                  const selected = answers.schoolYear === course
                  return (
                    <button
                      key={course}
                      onClick={() => selectAnswer("schoolYear", course)}
                      className={`rounded-2xl border-2 px-4 py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                        selected
                          ? "border-[#0a1a4a] bg-[#0a1a4a]/8 text-[#0a1a4a]"
                          : "border-gray-200 bg-white text-gray-700 hover:border-[#0a1a4a]/40"
                      }`}
                    >
                      {course}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
                Nenhuma turma encontrada no Classroom.
              </div>
            )}
          </>
        )

      // ── Q5: Formato de ajuda + Estilo de aprendizagem ───────────────────
      case 4:
        return (
          <>
            <h2 className="font-[var(--font-heading)] text-xl font-bold text-[#1a1a2e] text-center">
              Quando trava, o que prefere?
            </h2>
            <div className="space-y-3">
              {[
                { label: "Resumo rápido", icon: "⚡", desc: "Um resumo direto do que precisa saber" },
                { label: "Passo a passo", icon: "🪜", desc: "Explicação detalhada, etapa por etapa" },
                { label: "Dicas até a resposta", icon: "💡", desc: "Pequenas dicas que guiam até você resolver sozinho" },
              ].map(opt => {
                const selected = answers.helpPreference === opt.label
                return (
                  <button
                    key={opt.label}
                    onClick={() => selectAnswer("helpPreference", opt.label)}
                    className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.98] ${
                      selected
                        ? "border-[#0a1a4a] bg-[#0a1a4a]/8"
                        : "border-gray-200 bg-white hover:border-[#0a1a4a]/40"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className={`text-sm font-bold ${selected ? "text-[#0a1a4a]" : "text-[#1a1a2e]"}`}>
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Learning style sub-section */}
            {answers.helpPreference && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">
                  Como prefere aprender?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Exemplos", icon: "📋" },
                    { label: "Analogias", icon: "🔗" },
                    { label: "Teoria direta", icon: "📖" },
                    { label: "Exercícios", icon: "✏️" },
                  ].map(opt => {
                    const selected = answers.studyTime === opt.label
                    return (
                      <button
                        key={opt.label}
                        onClick={() => selectAnswer("studyTime", opt.label)}
                        className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all active:scale-[0.97] ${
                          selected
                            ? "border-[#0a1a4a] bg-[#0a1a4a]/8 text-[#0a1a4a]"
                            : "border-gray-200 bg-white text-gray-700 hover:border-[#0a1a4a]/40"
                        }`}
                      >
                        <span className="text-xl">{opt.icon}</span>
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )

      // ── Q6: Tom do feedback ─────────────────────────────────────────────
      case 5:
        return (
          <>
            <h2 className="font-[var(--font-heading)] text-xl font-bold text-[#1a1a2e] text-center">
              Qual tom de feedback você prefere?
            </h2>
            <div className="space-y-3">
              {[
                { label: "Direto e crítico", icon: "🎯", desc: "Sem rodeios. Me diz onde errei e como melhorar." },
                { label: "Motivador", icon: "🌟", desc: "Celebra os acertos e me encoraja nos erros." },
                { label: "Equilibrado", icon: "⚖️", desc: "Um pouco de cada, dependendo da situação." },
              ].map(opt => {
                const selected = answers.feedbackStyle === opt.label
                return (
                  <button
                    key={opt.label}
                    onClick={() => selectAnswer("feedbackStyle", opt.label)}
                    className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.98] ${
                      selected
                        ? "border-[#0a1a4a] bg-[#0a1a4a]/8"
                        : "border-gray-200 bg-white hover:border-[#0a1a4a]/40"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className={`text-sm font-bold ${selected ? "text-[#0a1a4a]" : "text-[#1a1a2e]"}`}>
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm px-6 py-4 border-b border-gray-100">
        <div className="mx-auto max-w-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-medium text-[#0a1a4a]">
              {currentQ + 1} de {TOTAL_QUESTIONS}
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
              className="h-full rounded-full bg-[#0a1a4a] transition-all duration-500"
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
          {renderQuestion()}

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
              disabled={!canProceed()}
              className="flex-1 rounded-xl bg-[#0a1a4a] py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#071245] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {currentQ < TOTAL_QUESTIONS - 1 ? "Próxima →" : "Concluir →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
