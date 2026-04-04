// Fix for school/corporate networks with self-signed SSL certificates
if (process.env.NODE_ENV === "development") process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { content, courseName, questionCount = 5, lang } = await req.json()

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "cole-sua-chave-aqui") {
    return Response.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 })
  }

  const langNote =
    lang === "en"
      ? "IMPORTANT: Write the entire quiz in English."
      : "Escreva o simulado inteiramente em português."

  const prompt = `Você é um professor especializado em criar provas estilo ENEM sobre "${courseName}".
Crie um simulado com EXATAMENTE ${questionCount} questões de múltipla escolha baseadas no conteúdo abaixo.
${langNote}

Responda APENAS com JSON válido (sem texto antes ou depois):
[
  {
    "question": "enunciado completo da questão",
    "options": ["A) opção A", "B) opção B", "C) opção C", "D) opção D"],
    "correct": 0,
    "explanation": "explicação breve e clara da resposta correta"
  }
]

Onde "correct" é o índice 0-3 da opção correta.
Varie os níveis de dificuldade (fácil, médio, difícil).
Foque nos conceitos mais importantes do conteúdo.

CONTEÚDO:
${content.slice(0, 10000)}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2500,
      temperature: 0.8,
    })

    const text = completion.choices[0]?.message?.content ?? ""

    try {
      const clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
      const questions = JSON.parse(clean)
      return Response.json({ questions })
    } catch {
      return Response.json({ error: "Erro ao processar questões." }, { status: 500 })
    }
  } catch (err: any) {
    console.error("OpenAI quiz error:", err?.message)
    return Response.json({ error: err?.message ?? "Erro de conexão" }, { status: 500 })
  }
}
