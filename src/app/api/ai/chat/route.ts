// Fix for school/corporate networks with self-signed SSL certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `Você é Darwin, um tutor de IA educacional ético para o ensino médio brasileiro.

REGRAS ABSOLUTAS:
1. NUNCA entregue a resposta final de uma atividade ou exercício
2. SEMPRE guie o raciocínio com perguntas socráticas
3. Faça UMA pergunta reflexiva de cada vez
4. Se o aluno já tentou algo, reconheça o esforço e aprofunde
5. Foco em ENEM e vestibulares brasileiros
6. Linguagem próxima e encorajadora, mas séria e precisa
7. Quando houver conteúdo dos materiais disponível, baseie suas perguntas nele

FORMATO:
- Máximo 150 palavras por resposta
- Comece reconhecendo o que o aluno perguntou
- Termine sempre com uma pergunta ou desafio de raciocínio

Contexto da turma e materiais do professor:
{CONTEXT}`

export async function POST(req: Request) {
  const { message, courseName, courseContext, history, lang, profile, googleId, courseId } =
    await req.json()

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "cole-sua-chave-aqui") {
    return Response.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 })
  }

  const langInstruction =
    lang === "en"
      ? "\n\nIMPORTANT: The student has selected English. Respond ONLY in English from now on."
      : ""

  const profileBlock =
    profile && profile.learningStyle
      ? `\nPerfil do aluno que você está tutorando:
- Como aprende melhor: ${profile.learningStyle}
- Objetivo de carreira: ${profile.goal}
- Maior dificuldade: ${profile.hardSubject}
- Prefere quando trava: ${profile.helpPreference}
- Tempo de estudo diário: ${profile.studyTime}
- Estilo de feedback preferido: ${profile.feedbackStyle}
- Ano escolar: ${profile.schoolYear}

Use essas informações para personalizar COMPLETAMENTE seu tom, seus exemplos e seu nível de detalhe em cada resposta.\n`
      : ""

  const contextBlock = courseContext
    ? `Matéria: ${courseName}.\n\n${courseContext.slice(0, 12000)}`
    : `Matéria: ${courseName}.`

  const systemContent =
    profileBlock + SYSTEM_PROMPT.replace("{CONTEXT}", contextBlock) + langInstruction

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...(history ?? []).slice(-10),
    { role: "user", content: message },
  ]

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 350,
      temperature: 0.7,
    })

    const responseText = completion.choices[0]?.message?.content ?? ""

    // Save interaction to DB (fire-and-forget)
    if (googleId) {
      const fingerprint = crypto
        .createHash("sha256")
        .update(`${googleId}:${message}:${responseText}`)
        .digest("hex")

      prisma.student
        .findUnique({ where: { googleId } })
        .then((student) => {
          if (!student) return
          return prisma.aiInteraction.create({
            data: {
              studentId: student.id,
              courseId: courseId ?? "unknown",
              courseName: courseName ?? "",
              prompt: message,
              response: responseText,
              fingerprint,
            },
          })
        })
        .catch((err) => console.error("[ai/chat] DB save failed:", err?.message))
    }

    return Response.json({ response: responseText })
  } catch (err: any) {
    console.error("OpenAI error:", err?.message, err?.cause?.message)
    return Response.json(
      { error: `Erro: ${err?.message ?? "falha de conexão"}` },
      { status: 500 }
    )
  }
}
