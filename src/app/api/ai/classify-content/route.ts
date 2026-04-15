import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { announcements, courseName } = await req.json()

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "API key missing" }, { status: 500 })
  }

  if (!announcements?.length) {
    return Response.json({ classified: [] })
  }

  const items = announcements.map((a: { id: string; text: string; fileNames: string[] }, i: number) => {
    const files = a.fileNames.length > 0 ? `\nArquivos anexos: ${a.fileNames.join(", ")}` : ""
    return `[${i}] ID=${a.id}\n${a.text.slice(0, 500)}${files}`
  }).join("\n---\n")

  const prompt = `Você é um assistente educacional. Analise os avisos abaixo postados no mural da turma "${courseName}" no Google Classroom.

Para CADA aviso, classifique:
- Se contém MATERIAL DE ESTUDO (menção a capítulos, avaliações, conteúdos, provas, exercícios, slides, livros, temas para estudar) → gere um título descritivo curto (máx 80 chars) que diga O QUE o aluno vai estudar. Formato: "Nome do Assunto — Detalhes". Exemplos:
  "Revolução Russa — Cap. 26, Avaliação 4º elemento"
  "República Oligárquica — Caps. 28-29, Revoltas"
  "Caderno de Humanidades — 2ª Avaliação"
- Se é APENAS um aviso administrativo (parabéns, boas férias, recados gerais sem conteúdo de estudo) → retorne exatamente "AVISO"

Responda APENAS com JSON válido, sem markdown:
[
  { "id": "...", "title": "...", "isStudy": true },
  { "id": "...", "title": "AVISO", "isStudy": false }
]

AVISOS:
${items}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
    })

    const text = completion.choices[0]?.message?.content ?? "[]"
    const clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
    const classified = JSON.parse(clean)
    return Response.json({ classified })
  } catch (err: any) {
    console.error("[classify-content] error:", err?.message)
    return Response.json({ classified: [] })
  }
}
