// Fix for school/corporate networks with self-signed SSL certificates
if (process.env.NODE_ENV === "development") process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { type, content, courseName, lang } = await req.json()

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "cole-sua-chave-aqui") {
    return Response.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 })
  }

  const langNote =
    lang === "en"
      ? "IMPORTANT: Respond entirely in English."
      : "Responda inteiramente em português."

  const prompts: Record<string, string> = {
    resumo: `Você é um tutor educacional especializado em criar resumos para o ENEM.
Crie um RESUMO DETALHADO do conteúdo abaixo sobre "${courseName}".
${langNote}

FORMATO:
- Use títulos e subtítulos (# e ##)
- Use listas com marcadores para pontos-chave
- Destaque definições em **negrito**
- Inclua exemplos práticos quando relevante
- Máximo 600 palavras

CONTEÚDO:
${content.slice(0, 12000)}`,

    flashcards: `Você é um tutor educacional criando flashcards de estudo ativo sobre "${courseName}".
Crie exatamente 10 flashcards com base no conteúdo abaixo.
${langNote}

Responda APENAS com JSON válido (sem texto antes ou depois):
[
  {"front": "pergunta ou conceito", "back": "resposta ou definição"},
  ...
]

CONTEÚDO:
${content.slice(0, 12000)}`,

    mapa: `Você é um tutor educacional criando um mapa mental sobre "${courseName}".
Crie um MAPA MENTAL em formato de texto estruturado com base no conteúdo abaixo.
${langNote}

FORMATO:
- Tópico central no topo (use ★)
- Use indentação (2 espaços por nível) para hierarquia
- Máximo 4 níveis de profundidade
- Use emojis relevantes para nós principais
- 3-5 palavras por nó

CONTEÚDO:
${content.slice(0, 12000)}`,

    guia: `Você é um tutor educacional criando um guia de estudo para o ENEM sobre "${courseName}".
Crie um GUIA DE ESTUDO estruturado com base no conteúdo abaixo.
${langNote}

FORMATO:
- Divida em etapas numeradas de estudo
- Seções: Conceitos Essenciais, Pontos de Atenção, Dicas para a Prova
- Inclua 3 perguntas de autoavaliação ao final
- Use markdown com títulos e listas
- Máximo 500 palavras

CONTEÚDO:
${content.slice(0, 12000)}`,
  }

  const prompt = prompts[type] ?? prompts.resumo

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1800,
      temperature: 0.7,
    })

    const text = completion.choices[0]?.message?.content ?? ""

    if (type === "flashcards") {
      try {
        const clean = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "")
        const flashcards = JSON.parse(clean)
        return Response.json({ flashcards })
      } catch {
        return Response.json({ error: "Erro ao processar flashcards." }, { status: 500 })
      }
    }

    return Response.json({ text })
  } catch (err: any) {
    console.error("OpenAI study error:", err?.message)
    return Response.json({ error: err?.message ?? "Erro de conexão" }, { status: 500 })
  }
}
