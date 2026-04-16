// Fix for school/corporate networks with self-signed SSL certificates
if (process.env.NODE_ENV === "development") process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import OpenAI from "openai"
import { trackAiUsage, extractOpenAIUsage } from "@/lib/ai-track"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = "gpt-4o"

export async function POST(req: Request) {
  const { content, courseName, questionCount = 5, lang, selectedFileNames } = await req.json()

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "cole-sua-chave-aqui") {
    return Response.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 })
  }

  const langNote =
    lang === "en"
      ? "IMPORTANT: Write the entire quiz in English."
      : "Escreva o simulado inteiramente em português."

  const sourceBlock = selectedFileNames?.length
    ? `\nFONTES SELECIONADAS: ${selectedFileNames.join(", ")}\nCrie as questões baseando-se EXCLUSIVAMENTE no conteúdo fornecido abaixo. As questões devem ser diretamente derivadas do material — não invente conceitos que não estejam no conteúdo.\n`
    : ""

  const contentOnlyRule = `\nREGRA CRÍTICA: Crie questões APENAS sobre o conteúdo acadêmico/matéria. NÃO crie questões sobre datas de entrega, avisos do professor, quando o conteúdo foi ensinado, prazos, ou informações administrativas. Apenas conceitos, definições, fórmulas, teorias e conhecimento da disciplina.\n`

  const safeContent = (content ?? "").slice(0, 10000)
  const contentBlock = safeContent.trim().length > 0
    ? `\nCONTEÚDO:\n${safeContent}`
    : `\n(Sem conteúdo de materiais. Use seu conhecimento geral sobre ${courseName} para criar questões nivel ENEM.)`

  const prompt = `Você é um professor especializado em criar provas estilo ENEM sobre "${courseName}".
Crie um simulado com EXATAMENTE ${questionCount} questões de múltipla escolha baseadas no conteúdo abaixo.
${langNote}
${sourceBlock}${contentOnlyRule}
Responda em JSON com a estrutura:
{
  "questions": [
    {
      "question": "enunciado completo",
      "options": ["A) opção A", "B) opção B", "C) opção C", "D) opção D"],
      "correct": 0,
      "explanation": "explicação breve da resposta correta"
    }
  ]
}

Onde "correct" é o índice 0-3 da opção correta.
Varie níveis (fácil, médio, difícil) e foque nos conceitos principais.
${contentBlock}`

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2500,
      temperature: 0.8,
      response_format: { type: "json_object" },
    })

    const usage = extractOpenAIUsage(completion)
    await trackAiUsage({ provider: "openai", model: MODEL, ...usage, route: "/api/ai/quiz" })

    const text = completion.choices[0]?.message?.content ?? ""
    let parsed: any
    try { parsed = JSON.parse(text) } catch (e) {
      console.error("[ai/quiz] JSON parse failed. Raw:", text.slice(0, 400))
      return Response.json({ error: "Erro ao processar questões." }, { status: 500 })
    }
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : Array.isArray(parsed) ? parsed : null
    if (!questions || questions.length === 0) {
      console.error("[ai/quiz] empty/invalid questions. Raw:", text.slice(0, 400))
      return Response.json({ error: "Não foi possível gerar questões para esse conteúdo." }, { status: 500 })
    }
    return Response.json({ questions })
  } catch (err: any) {
    console.error("[ai/quiz] OpenAI error:", err?.message)
    return Response.json({ error: err?.message ?? "Erro de conexão" }, { status: 500 })
  }
}
