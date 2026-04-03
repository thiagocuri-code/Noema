"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLang, LangToggle } from "@/lib/lang-context"

// ── Types ──────────────────────────────────────────────────────────────────────
interface Course {
  id: string
  name: string
  section?: string
  alternateLink?: string
}

interface CourseSummary {
  avgScore: number
  totalActivities: number
}

// ── Score Ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ avg }: { avg: number | null }) {
  const size = 40
  const stroke = 4
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = avg != null ? Math.min(Math.max(avg, 0), 100) : 0
  const dash = (pct / 100) * circ

  const color =
    avg == null ? "#d1d5db"
    : avg >= 70 ? "#22c55e"
    : avg >= 50 ? "#f59e0b"
    : "#ef4444"

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
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
        style={{ color: avg == null ? "#9ca3af" : color }}
      >
        {avg == null ? "—" : Math.round(avg)}
      </span>
    </div>
  )
}

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

// ── Constants ──────────────────────────────────────────────────────────────────
const COLORS = ["#6C47FF", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316"]
const ICONS = ["📐", "⚡", "📖", "🧬", "🌍", "🎨", "💻", "📊"]
const PROFILE_KEY = "trix_profile"

const PROFILE_FIELDS: {
  key: keyof Profile
  label: string
  icon: string
  question: string
  options: string[]
}[] = [
  {
    key: "learningStyle",
    label: "Estilo de aprendizado",
    icon: "🧠",
    question: "Como você aprende melhor?",
    options: ["Vendo exemplos visuais", "Lendo explicações detalhadas", "Resolvendo exercícios", "Ouvindo alguém explicar"],
  },
  {
    key: "goal",
    label: "Objetivo",
    icon: "🎯",
    question: "Qual é o seu objetivo?",
    options: ["Medicina", "Engenharia", "Direito", "Ciências Exatas", "Ciências Humanas", "Ciências Biológicas", "Ainda não sei"],
  },
  {
    key: "hardSubject",
    label: "Maior dificuldade",
    icon: "📚",
    question: "Qual matéria tem mais dificuldade?",
    options: ["Matemática", "Física", "Química", "Biologia", "Português", "História", "Geografia", "Inglês"],
  },
  {
    key: "helpPreference",
    label: "Preferência de ajuda",
    icon: "💡",
    question: "Quando trava, o que prefere?",
    options: ["Uma dica pequena para continuar sozinho", "Uma explicação passo a passo", "Ver exemplos parecidos", "Só a resposta para conferir"],
  },
  {
    key: "studyTime",
    label: "Tempo de estudo",
    icon: "⏱️",
    question: "Quanto tempo estuda por dia?",
    options: ["Menos de 1 hora", "1 a 2 horas", "2 a 4 horas", "Mais de 4 horas"],
  },
  {
    key: "feedbackStyle",
    label: "Estilo de feedback",
    icon: "💬",
    question: "Como prefere receber feedback?",
    options: ["Direto e objetivo", "Com bastante encorajamento", "Muito detalhado", "Depende do momento"],
  },
  {
    key: "schoolYear",
    label: "Ano escolar",
    icon: "🎓",
    question: "Em qual ano está?",
    options: ["1º ano", "2º ano", "3º ano", "Já terminei", "Cursinho pré-vestibular"],
  },
]

// ── Profile Modal ─────────────────────────────────────────────────────────────
function ProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: Profile
  onClose: () => void
  onSave: (p: Profile) => void
}) {
  const [draft, setDraft] = useState<Profile>({ ...profile })
  const [editingKey, setEditingKey] = useState<keyof Profile | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  function pickOption(key: keyof Profile, value: string) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setEditingKey(null)
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-['Sora',sans-serif] text-base font-bold text-[#1a1a2e]">
            Seu perfil de aprendizado
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {PROFILE_FIELDS.map(field => {
            const isEditing = editingKey === field.key
            return (
              <div
                key={field.key}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{field.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-gray-400">{field.label}</p>
                      <p className="text-sm font-semibold text-[#1a1a2e]">
                        {draft[field.key] || "—"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingKey(isEditing ? null : field.key)}
                    className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      isEditing
                        ? "border-[#6C47FF] bg-[#6C47FF] text-white"
                        : "border-gray-200 bg-white text-gray-500 hover:border-[#6C47FF] hover:text-[#6C47FF]"
                    }`}
                  >
                    {isEditing ? "Cancelar" : "Editar"}
                  </button>
                </div>

                {isEditing && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {field.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => pickOption(field.key, opt)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                          draft[field.key] === opt
                            ? "border-[#6C47FF] bg-[#6C47FF]/10 text-[#6C47FF]"
                            : "border-gray-200 bg-white text-gray-600 hover:border-[#6C47FF]/50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Fechar
          </button>
          <button
            onClick={() => { onSave(draft); onClose() }}
            className="flex-1 rounded-xl bg-[#6C47FF] py-2.5 text-sm font-semibold text-white hover:bg-[#5a3de0]"
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { data: session } = useSession()
  const { t } = useLang()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [profile, setProfile] = useState<Profile | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [perfSummary, setPerfSummary] = useState<Record<string, CourseSummary>>({})

  // Load profile: localStorage first (instant), then verify with Supabase
  useEffect(() => {
    // Immediate: read from localStorage cache
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (raw) setProfile(JSON.parse(raw))
    } catch { /* ignore */ }

    // Listen for storage changes (e.g. onboarding in another tab)
    function onStorage() {
      try {
        const raw = localStorage.getItem(PROFILE_KEY)
        setProfile(raw ? JSON.parse(raw) : null)
      } catch { setProfile(null) }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // Secondary: fetch from Supabase to stay in sync across devices
  useEffect(() => {
    const googleId = (session as any)?.googleId
    if (!googleId) return
    fetch(`/api/profile/${googleId}`)
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          // Update cache and state with server version
          const merged = { ...data.profile, completedAt: data.profile.completedAt ?? new Date().toISOString() }
          try { localStorage.setItem(PROFILE_KEY, JSON.stringify(merged)) } catch { /* ignore */ }
          setProfile(merged)
        } else if (!localStorage.getItem(PROFILE_KEY)) {
          setProfile(null)
        }
      })
      .catch(() => { /* keep localStorage version on network error */ })
  }, [(session as any)?.googleId])

  // Fetch performance summary for score rings
  useEffect(() => {
    const googleId = (session as any)?.googleId
    if (!googleId) return
    fetch(`/api/performance/summary?googleId=${googleId}`)
      .then(r => r.json())
      .then(data => { if (data.summary) setPerfSummary(data.summary) })
      .catch(() => { /* ignore */ })
  }, [(session as any)?.googleId])

  useEffect(() => {
    if (!session?.accessToken) return
    fetch(`/api/classroom/courses?accessToken=${session.accessToken}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setCourses(data.courses ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError(t("Não foi possível carregar as turmas.", "Could not load your classes."))
        setLoading(false)
      })
  }, [session?.accessToken])

  function handleSaveProfile(updated: Profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updated))
      setProfile(updated)
    } catch { /* ignore */ }
    // Sync to Supabase
    const googleId = (session as any)?.googleId
    if (googleId) {
      fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: updated, googleId }),
      }).catch(() => { /* ignore */ })
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Profile modal */}
      {showModal && profile && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowModal(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Topbar */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C47FF]">
              <span className="text-sm font-bold text-white">N</span>
            </div>
            <span className="font-['Sora',sans-serif] text-lg font-bold text-[#1a1a2e]">Noema</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Dynamic profile button */}
            {profile ? (
              <button
                onClick={() => setShowModal(true)}
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#6C47FF] px-3 py-1.5 text-xs font-semibold text-[#6C47FF] transition-all hover:bg-[#6C47FF]/8"
              >
                <span>👤</span>
                {t("Seu perfil", "Your profile")}
              </button>
            ) : (
              <button
                onClick={() => router.push("/onboarding")}
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#6C47FF] px-3 py-1.5 text-xs font-semibold text-[#6C47FF] transition-all hover:bg-[#6C47FF]/8"
              >
                <span>✨</span>
                {t("Complete seu perfil", "Complete your profile")}
              </button>
            )}
            <LangToggle />
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt="foto"
                className="h-8 w-8 rounded-full ring-2 ring-[#6C47FF]/20"
              />
            )}
            <span className="hidden text-sm font-medium text-gray-700 sm:block">
              {session?.user?.name?.split(" ")[0]}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {t("Sair", "Sign out")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Onboarding CTA banner — shown only when profile incomplete */}
        {!profile && !loading && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#6C47FF]/20 bg-[#6C47FF]/5 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-[#6C47FF]">
                ✨ {t("Personalize sua experiência", "Personalize your experience")}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {t(
                  "Responda 7 perguntas rápidas e deixe a Noema te ensinar do seu jeito.",
                  "Answer 7 quick questions and let Noema teach you your way."
                )}
              </p>
            </div>
            <button
              onClick={() => router.push("/onboarding")}
              className="flex-shrink-0 rounded-xl bg-[#6C47FF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5a3de0]"
            >
              {t("Começar →", "Start →")}
            </button>
          </div>
        )}

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-['Sora',sans-serif] text-2xl font-bold text-[#1a1a2e]">
            {t("Olá", "Hello")}, {session?.user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading
              ? t("Carregando suas turmas do Google Classroom...", "Loading your Google Classroom classes...")
              : t(
                  `${courses.length} turma${courses.length !== 1 ? "s" : ""} ativa${courses.length !== 1 ? "s" : ""} no Classroom`,
                  `${courses.length} active class${courses.length !== 1 ? "es" : ""} in Classroom`
                )}
          </p>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Courses Grid */}
        {!loading && !error && (
          <>
            {courses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                <p className="text-gray-400">
                  {t("Nenhuma turma ativa encontrada no Google Classroom.", "No active classes found in Google Classroom.")}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course, i) => {
                  const color = COLORS[i % COLORS.length]
                  const icon = ICONS[i % ICONS.length]
                  return (
                    <Link key={course.id} href={`/dashboard/student/${course.id}`}>
                      <div className="group relative cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl" style={{ backgroundColor: color }} />
                        {/* Score ring — top right */}
                        <div className="absolute right-4 top-4">
                          <ScoreRing avg={perfSummary[course.id]?.avgScore ?? null} />
                        </div>
                        <div
                          className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                          style={{ backgroundColor: color + "18" }}
                        >
                          {icon}
                        </div>
                        <h3 className="font-['Sora',sans-serif] text-base font-bold text-[#1a1a2e] group-hover:text-[#6C47FF] transition-colors line-clamp-2 pr-10">
                          {course.name}
                        </h3>
                        {course.section && (
                          <p className="mt-1 text-sm text-gray-500">{course.section}</p>
                        )}
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-gray-400">Google Classroom</span>
                          <span className="text-xs font-medium" style={{ color }}>
                            {t("Entrar →", "Enter →")}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
