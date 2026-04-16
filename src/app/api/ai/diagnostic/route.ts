// Fix for school/corporate networks with self-signed SSL certificates
if (process.env.NODE_ENV === "development") process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import OpenAI from "openai"
import { trackAiUsage, extractOpenAIUsage } from "@/lib/ai-track"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = "gpt-4o"

// Generates a diagnostic quiz with topic tags so weak/strong areas can be mapped.
export async function POST(req: Request) {
  const { content, courseName, examTitle, lang, selectedFileNames } = await req.json()

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "cole-sua-chave-aqui") {
    return Response.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 })
  }

  const langNote =
    lang === "en"
      ? "IMPORTANT: Write the diagnostic quiz in English."
      : "Escreva o diagnóstico inteiramente em português."

  const sourceBlock = selectedFileNames?.length
    ? `\nFONTES SELECIONADAS PELO ALUNO (provão de ${examTitle}): ${selectedFileNames.join(", ")}\nGere questões cobrindo os principais tópicos presentes nesses materiais.\n`
    : ""

  const safeContent = (content ?? "").slice(0, 10000)
  const contentBlock = safeContent.trim().length > 0
    ? `\nCONTEÚDO:\n${safeContent}`
    : `\n(Sem conteúdo de materiais. Use seu conhecimento geral sobre ${courseName} para criar um diagnóstico nivel ENEM da prova "${examTitle}".)`

  const prompt = `Você é um tutor especializado em diagnosticar o nível de um aluno em "${courseName}" ANTES dele começar a estudar para a prova "${examTitle}".
Crie um DIAGNÓSTICO com EXATAMENTE 8 questões de múltipla escolha baseadas no conteúdo abaixo.
${langNote}
${sourceBlock}

OBJETIVO:
- Cobrir pelo menos 5 tópicos DIFERENTES da matéria (um por questão ou mais)
- Variar a dificuldade: 3 fáceis, 3 médias, 2 difíceis
- Cada questão deve ter uma TAG DE TÓPICO clara e concisa (2-4 palavras) — ex.: "Função quadrática", "Leis de Newton", "Revolução Francesa"

REGRA CRÍTICA: Crie questões APENAS sobre o conteúdo acadêmico. NÃO pergunte sobre datas de entrega, avisos, prazos.

Responda em JSON com a estrutura:
{
  "questions": [
    {
      "question": "enunciado",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct": 0,
      "topic": "tag curta do tópico",
      "difficulty": "facil",
      "explanation": "breve"
    }
  ]
}
${contentBlock}`

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
      response_format: { type: "json_object" },
    })

    const usage = extractOpenAIUsage(completion)
    await trackAiUsage({ provider: "openai", model: MODEL, ...usage, route: "/api/ai/diagnostic" })

    const text = completion.choices[0]?.message?.content ?? ""
    let parsed: any
    try { parsed = JSON.parse(text) } catch {
      console.error("[ai/diagnostic] parse failed. Raw:", text.slice(0, 400))
      return Response.json({ error: "Erro ao processar diagnóstico." }, { status: 500 })
    }
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : Array.isArray(parsed) ? parsed : null
    if (!questions || questions.length === 0) {
      console.error("[ai/diagnostic] empty questions. Raw:", text.slice(0, 400))
      return Response.json({ error: "Não foi possível gerar diagnóstico para esse conteúdo." }, { status: 500 })
    }
    return Response.json({ questions })
  } catch (err: any) {
    console.error("[ai/diagnostic] OpenAI error:", err?.message)
    return Response.json({ error: err?.message ?? "Erro de conexão" }, { status: 500 })
  }
}
