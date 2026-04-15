import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const {
      googleId,
      courseId,
      courseName,
      title,
      examDate,
      fileIds,
      fileTitles,
      contextSnapshot,
      diagnosticScore,
      diagnosticAnswers,
      topicsWeak,
      topicsStrong,
    } = await req.json()

    if (!googleId || !courseId || !title) {
      return Response.json({ error: "Dados ausentes." }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { googleId } })
    if (!student) {
      return Response.json({ error: "Aluno não encontrado." }, { status: 404 })
    }

    const exam = await prisma.examSession.create({
      data: {
        studentId: student.id,
        courseId,
        courseName: courseName ?? "",
        title,
        examDate: examDate ? new Date(examDate) : null,
        fileIds: fileIds ?? [],
        fileTitles: fileTitles ?? [],
        contextSnapshot: contextSnapshot ?? "",
        diagnosticScore: diagnosticScore ?? null,
        diagnosticAnswers: diagnosticAnswers ?? undefined,
        topicsWeak: topicsWeak ?? [],
        topicsStrong: topicsStrong ?? [],
        topicsReviewed: [],
        simuladoScores: [],
      },
    })

    return Response.json({ exam })
  } catch (err: any) {
    console.error("[exam/create]", err?.message)
    return Response.json({ error: "Erro ao criar prova." }, { status: 500 })
  }
}
