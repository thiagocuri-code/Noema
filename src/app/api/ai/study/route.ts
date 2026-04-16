// Fix for school/corporate networks with self-signed SSL certificates
if (process.env.NODE_ENV === "development") process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import OpenAI from "openai"
import { trackAiUsage, extractOpenAIUsage } from "@/lib/ai-track"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = "gpt-4o"

export async function POST(req: Request) {
  const { type, content, courseName, lang, selectedFileNames, difficulty } = await req.json()

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "cole-sua-chave-aqui") {
    return Response.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 })
  }

  const langNote =
    lang === "en"
      ? "IMPORTANT: Respond entirely in English."
      : "Responda inteiramente em português."

  const sourceBlock = selectedFileNames?.length
    ? `\nFONTES SELECIONADAS PELO ALUNO: ${selectedFileNames.join(", ")}\nIMPORTANTE: Use APENAS o conteúdo fornecido abaixo como fonte principal. Se algum tópico não estiver coberto pelo material, mencione claramente antes de complementar com conhecimento geral.\n`
    : ""

  const contentOnlyRule = `\nREGRA CRÍTICA: Foque EXCLUSIVAMENTE no conteúdo acadêmico/matéria. NÃO inclua informações sobre datas de entrega, avisos do professor, quando o conteúdo foi ensinado, prazos, ou informações administrativas. Apenas conceitos, definições, fórmulas, teorias e conhecimento da disciplina.\n`

  const difficultyNote =
    difficulty === "facil"
      ? "\nNÍVEL: SIMPLES — Use linguagem acessível, foque nos 3-4 conceitos fundamentais apenas. Sem detalhes avançados.\n"
      : difficulty === "dificil"
      ? "\nNÍVEL: AVANÇADO — Máxima profundidade: nuances, exceções, conexões entre conceitos e exemplos complexos.\n"
      : "\nNÍVEL: PADRÃO — Equilíbrio entre cobertura e clareza, adequado para o ENEM.\n"

  const safeContent = (content ?? "").slice(0, 12000)
  const contentBlock = safeContent.trim().length > 0
    ? `\nCONTEÚDO:\n${safeContent}`
    : `\n(Sem conteúdo de materiais. Use seu conhecimento geral sobre ${courseName} para o nivel ENEM.)`

  const prompts: Record<string, string> = {
    resumo: `Você é um tutor educacional especializado em criar resumos para o ENEM.
Crie um RESUMO DETALHADO do conteúdo abaixo sobre "${courseName}".
${langNote}
${sourceBlock}${contentOnlyRule}${difficultyNote}
FORMATO OBRIGATÓRIO (Markdown):
- Use # para título principal e ## para subtítulos
- Use **negrito** para definições e conceitos-chave
- Use listas com marcadores (- ou *) para pontos-chave
- Use \`código\` para termos técnicos quando aplicável
- Para fórmulas matemáticas/químicas, use notação LaTeX: $E = mc^2$ para inline, $$\\sum_{i=1}^{n} x_i$$ para bloco
- Inclua > blockquotes para informações importantes ou "dica ENEM"
- Inclua exemplos práticos quando relevante
- Máximo 800 palavras
- Organize logicamente: conceitos fundamentais → desenvolvimento → aplicações
${contentBlock}`,

    flashcards: `Você é um tutor educacional criando flashcards de estudo ativo sobre "${courseName}".
Crie exatamente 10 flashcards com base no conteúdo abaixo.
${langNote}
${sourceBlock}${contentOnlyRule}${difficultyNote}
REGRAS:
- Varie entre perguntas conceituais, aplicações práticas e comparações
- Use linguagem direta e clara
- Inclua fórmulas LaTeX se o conteúdo for de exatas (ex: $F = ma$)
- Cada resposta deve ter 1-3 frases

Responda em JSON com a estrutura:
{ "flashcards": [ {"front": "pergunta ou conceito", "back": "resposta ou definição"} ] }
${contentBlock}`,

    mapa: `Você é um especialista em mapas mentais educacionais para o ENEM brasileiro.
Sua tarefa é gerar um mapa mental em JSON sobre o conteúdo fornecido pelo professor.
Matéria: "${courseName}".
${langNote}
${sourceBlock}${contentOnlyRule}${difficultyNote}
REGRAS ABSOLUTAS — NUNCA VIOLE:

1. PROIBIDO mencionar questões, exercícios ou gabaritos em qualquer nó.
   Nunca use: "Questão 1", "Questão 2", "Alternativa A", "Exercício",
   "Questões de Escolha", "Questões de Revisão" ou qualquer variação.
   O mapa é sobre CONCEITOS, não sobre provas.

2. PROIBIDO nós vagos ou genéricos sem significado conceitual.
   Nunca use: "Exemplos Complexos", "Outros Conceitos", "Mais detalhes",
   "Ver mais", "Conceitos Gerais" ou labels sem substância real.
   Todo nó deve nomear um conceito, fenômeno, lei, fórmula ou aplicação específica.

3. TODOS os ramos principais devem ter a mesma profundidade (mínimo 2 níveis
   de filhos cada). Nenhum ramo pode ser mais raso que os outros.

4. Máximo 6 palavras por label de nó. Seja específico e direto.

5. Mínimo 4 ramos principais saindo do nó raiz.

6. Fórmulas químicas e matemáticas devem aparecer nos nós quando relevante.

ESTRUTURA OBRIGATÓRIA DOS RAMOS:
- Nível 1 (ramo): categoria conceitual real
- Nível 2 (filho): conceito específico
- Nível 3 (neto): exemplo concreto ou fórmula

Responda APENAS com o JSON válido abaixo, sem markdown, sem explicações, sem texto antes ou depois:
{
  "root": "TÍTULO DA MATÉRIA",
  "children": [
    {
      "id": "1",
      "label": "Ramo Principal",
      "color": "#3D5FC0",
      "children": [
        {
          "id": "1.1",
          "label": "Conceito Específico",
          "children": [
            { "id": "1.1.1", "label": "Exemplo ou Fórmula", "children": [] }
          ]
        }
      ]
    }
  ]
}

Use cores diferentes para cada ramo principal:
Ramo 1: #3D5FC0, Ramo 2: #E67E22, Ramo 3: #27AE60, Ramo 4: #8E44AD, Ramo 5: #E74C3C, Ramo 6: #1ABC9C
${contentBlock}`,

    guia: `Você é um tutor educacional criando um guia de estudo para o ENEM sobre "${courseName}".
Crie um GUIA DE ESTUDO estruturado com base no conteúdo abaixo.
${langNote}
${sourceBlock}${contentOnlyRule}${difficultyNote}
FORMATO OBRIGATÓRIO (Markdown):
- Use # para título e ## para seções
- Divida em etapas numeradas de estudo (### Etapa 1, ### Etapa 2, etc.)
- Seções obrigatórias:
  ## 📚 Conceitos Essenciais (com definições em **negrito**)
  ## ⚠️ Pontos de Atenção (erros comuns e armadilhas)
  ## 💡 Dicas para a Prova (estratégias práticas)
  ## ✅ Autoavaliação (5 perguntas reflexivas em lista numerada)
- Use > blockquote para dicas especiais
- Use fórmulas LaTeX quando aplicável: $f(x) = ax^2 + bx + c$
- Máximo 700 palavras
${contentBlock}`,
  }

  const prompt = prompts[type] ?? prompts.resumo
  const wantsJson = type === "flashcards" || type === "mapa"

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2500,
      temperature: 0.7,
      ...(wantsJson ? { response_format: { type: "json_object" as const } } : {}),
    })

    const usage = extractOpenAIUsage(completion)
    await trackAiUsage({ provider: "openai", model: MODEL, ...usage, route: `/api/ai/study:${type}` })

    const text = completion.choices[0]?.message?.content ?? ""

    if (type === "flashcards") {
      let parsed: any
      try { parsed = JSON.parse(text) } catch {
        parsed = extractJsonObject(text) ?? { flashcards: extractJsonArray(text) }
      }
      const flashcards = Array.isArray(parsed?.flashcards) ? parsed.flashcards : Array.isArray(parsed) ? parsed : null
      if (!flashcards || flashcards.length === 0) {
        console.error("[ai/study] flashcards parse failed. Raw:", text.slice(0, 400))
        return Response.json({ error: "Erro ao processar flashcards." }, { status: 500 })
      }
      return Response.json({ flashcards })
    }

    if (type === "mapa") {
      const mindmap = extractJsonObject(text)
      if (mindmap) return Response.json({ mindmap })
      return Response.json({ text })
    }

    return Response.json({ text })
  } catch (err: any) {
    console.error("[ai/study] OpenAI error:", err?.message)
    return Response.json({ error: err?.message ?? "Erro de conexão" }, { status: 500 })
  }
}

function extractJsonArray(text: string): any[] | null {
  if (!text) return null
  let s = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : null } catch { /* */ }
  const start = s.indexOf("[")
  const end = s.lastIndexOf("]")
  if (start >= 0 && end > start) {
    try { const v = JSON.parse(s.slice(start, end + 1)); return Array.isArray(v) ? v : null } catch { /* */ }
  }
  return null
}

function extractJsonObject(text: string): any | null {
  if (!text) return null
  let s = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()
  try { const v = JSON.parse(s); return typeof v === "object" && v !== null ? v : null } catch { /* */ }
  const start = s.indexOf("{")
  const end = s.lastIndexOf("}")
  if (start >= 0 && end > start) {
    try { return JSON.parse(s.slice(start, end + 1)) } catch { /* */ }
  }
  return null
}
