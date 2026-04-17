import OpenAI from "openai"
import { trackAiUsage, extractOpenAIUsage } from "@/lib/ai-track"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = "gpt-4o"

export async function POST(req: Request) {
  const { items: rawItems, courseName } = await req.json()

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "API key missing" }, { status: 500 })
  }

  if (!rawItems?.length) {
    return Response.json({ classified: [] })
  }

  const items = rawItems.map((a: { id: string; text: string; fileNames?: string[] }, i: number) => {
    const files = a.fileNames && a.fileNames.length > 0 ? `\nArquivos anexos: ${a.fileNames.join(", ")}` : ""
    return `[${i}] ID=${a.id}\n${a.text.slice(0, 500)}${files}`
  }).join("\n---\n")

  const prompt = `Você é um assistente educacional. Analise os conteúdos abaixo da turma "${courseName}" no Google Classroom.

Para CADA item, faça duas coisas:

1. IDENTIFIQUE A MATÉRIA do conteúdo. Use nomes curtos e padronizados:
   "História", "Química", "Matemática", "Física", "Biologia", "Sociologia", "Filosofia", "Geografia", "Português", "Inglês", "Arte", "Ed. Física", "Literatura", "Redação", "Espanhol"
   Se não for possível identificar a matéria → use "Geral"

2. CLASSIFIQUE o conteúdo:
   - Se contém MATERIAL DE ESTUDO (menção a capítulos, avaliações, conteúdos, provas, exercícios, slides, livros, temas) → gere um título descritivo curto (máx 80 chars). Formato: "Nome do Assunto — Detalhes". Exemplos:
     "Revolução Russa — Cap. 26, Avaliação 4º elemento"
     "República Oligárquica — Caps. 28-29, Revoltas"
   - Se é APENAS aviso administrativo (parabéns, boas férias, recados sem conteúdo de estudo) ou não tem conteúdo significativo → title = "AVISO"

Responda APENAS com JSON válido, sem markdown:
[
  { "id": "...", "title": "...", "subject": "História", "isStudy": true },
  { "id": "...", "title": "AVISO", "subject": "Geral", "isStudy": false }
]

CONTEÚDOS:
${items}`

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
    })

    const usage = extractOpenAIUsage(completion)
    await trackAiUsage({ provider: "openai", model: MODEL, ...usage, route: "/api/ai/classify-content" })

    const text = completion.choices[0]?.message?.content ?? "[]"
    const clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
    const classified = JSON.parse(clean)
    return Response.json({ classified })
  } catch (err: any) {
    console.error("[classify-content] error:", err?.message)
    return Response.json({ classified: [] })
  }
}
