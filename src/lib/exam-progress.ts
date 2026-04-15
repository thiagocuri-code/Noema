// Gamificação do fluxo "Estudar para provas" — escola piloto Sebrae.
// Bandas: ND (0-69) · DP (70-79) · DS (80-99) · DE (100)
// Para DE, além de ≥90% no simulado, exigimos revisão + flashcards para evitar
// que o aluno "acerte de primeira e não estude".

export type Band = "ND" | "DP" | "DS" | "DE"

export interface ExamProgressInput {
  diagnosticScore: number | null
  simuladoScores: number[]
  revisionCount: number
  flashcardsStudied: number
  topicsWeak: string[]
  topicsReviewed: string[]
}

export interface ExamProgressResult {
  score: number // 0-100 composto
  band: Band
  simuladoAvg: number | null
  weakTopicsCovered: number // 0-1
  unlocksDE: {
    simulado90: boolean
    revisions3: boolean
    flashcards20: boolean
    allWeakReviewed: boolean
  }
  nextMilestone: string
}

const MIN_REVISIONS = 3
const MIN_FLASHCARDS = 20

export function computeExamProgress(input: ExamProgressInput): ExamProgressResult {
  const simuladoAvg = input.simuladoScores.length
    ? input.simuladoScores.reduce((a, b) => a + b, 0) / input.simuladoScores.length
    : null

  const baseScore = simuladoAvg ?? input.diagnosticScore ?? 0
  const revisionFactor = Math.min(input.revisionCount / MIN_REVISIONS, 1)
  const flashcardFactor = Math.min(input.flashcardsStudied / MIN_FLASHCARDS, 1)
  const weakTopicsCovered = input.topicsWeak.length
    ? input.topicsWeak.filter(t => input.topicsReviewed.includes(t)).length / input.topicsWeak.length
    : 1

  const composite =
    0.5 * baseScore +
    0.15 * revisionFactor * 100 +
    0.15 * flashcardFactor * 100 +
    0.2 * weakTopicsCovered * 100

  const lastSimulado = input.simuladoScores.at(-1) ?? 0
  const unlocksDE = {
    simulado90: lastSimulado >= 90,
    revisions3: input.revisionCount >= MIN_REVISIONS,
    flashcards20: input.flashcardsStudied >= MIN_FLASHCARDS,
    allWeakReviewed: weakTopicsCovered === 1 && input.topicsWeak.length > 0,
  }

  const allUnlocked = Object.values(unlocksDE).every(Boolean)
  let band: Band
  let score = Math.round(Math.min(composite, 99))
  if (allUnlocked && lastSimulado === 100) {
    band = "DE"
    score = 100
  } else if (score >= 80) {
    band = "DS"
  } else if (score >= 70) {
    band = "DP"
  } else {
    band = "ND"
  }

  let nextMilestone = ""
  if (band === "ND") nextMilestone = "Responda um simulado e revise tópicos fracos para chegar em DP (70%)."
  else if (band === "DP") nextMilestone = "Continue revisando — alcance 80% para entrar em DS."
  else if (band === "DS") {
    const missing: string[] = []
    if (!unlocksDE.simulado90) missing.push("tire 100% num simulado")
    if (!unlocksDE.revisions3) missing.push(`complete ${MIN_REVISIONS - input.revisionCount} revisão(ões)`)
    if (!unlocksDE.flashcards20) missing.push(`estude +${MIN_FLASHCARDS - input.flashcardsStudied} flashcards`)
    if (!unlocksDE.allWeakReviewed) missing.push("revise todos os tópicos fracos")
    nextMilestone = missing.length ? `Para DE: ${missing.join(" · ")}.` : "Tire 100% em um simulado final para DE."
  } else {
    nextMilestone = "Desenvolvido com excelência. Continue revisando para manter o nível."
  }

  return { score, band, simuladoAvg, weakTopicsCovered, unlocksDE, nextMilestone }
}

export function bandColor(band: Band): { bg: string; text: string; border: string; hex: string } {
  switch (band) {
    case "DE": return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", hex: "#059669" }
    case "DS": return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", hex: "#22c55e" }
    case "DP": return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", hex: "#f59e0b" }
    case "ND": return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", hex: "#ef4444" }
  }
}

export function bandLabel(band: Band, lang: string = "pt"): { abbr: string; full: string } {
  const labels = {
    ND: { pt: "Não Desenvolvido", en: "Not Developed" },
    DP: { pt: "Desenvolvido Parcialmente", en: "Partially Developed" },
    DS: { pt: "Desenvolvido", en: "Developed" },
    DE: { pt: "Desenvolvido com Excelência", en: "Developed with Excellence" },
  }
  return { abbr: band, full: lang === "en" ? labels[band].en : labels[band].pt }
}
