"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Lang = "pt" | "en"

interface LangContextValue {
  lang: Lang
  toggle: () => void
  t: (pt: string, en: string) => string
}

const LangContext = createContext<LangContextValue>({
  lang: "pt",
  toggle: () => {},
  t: (pt) => pt,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("pt")

  useEffect(() => {
    const saved = localStorage.getItem("athena-lang") as Lang | null
    if (saved === "en" || saved === "pt") setLang(saved)
  }, [])

  function toggle() {
    setLang((prev) => {
      const next = prev === "pt" ? "en" : "pt"
      localStorage.setItem("athena-lang", next)
      return next
    })
  }

  function t(pt: string, en: string) {
    return lang === "en" ? en : pt
  }

  return (
    <LangContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}

// ── Language toggle button ──────────────────────────────────────────────────
export function LangToggle() {
  const { lang, toggle } = useLang()
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all hover:border-[#0a1a4a] hover:text-[#0a1a4a] active:scale-95"
      title={lang === "pt" ? "Switch to English" : "Mudar para Português"}
    >
      <span className="text-sm">{lang === "pt" ? "🇧🇷" : "🇺🇸"}</span>
      {lang === "pt" ? "EN" : "PT"}
    </button>
  )
}
