import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const googleId = searchParams.get("googleId")

    if (!googleId) {
      return Response.json({ error: "googleId ausente." }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { googleId } })
    if (!student) return Response.json({ exams: [] })

    const exams = await prisma.examSession.findMany({
      where: { studentId: student.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        courseId: true,
        courseName: true,
        title: true,
        examDate: true,
        fileTitles: true,
        topicsWeak: true,
        topicsStrong: true,
        topicsReviewed: true,
        diagnosticScore: true,
        simuladoScores: true,
        revisionCount: true,
        flashcardsStudied: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return Response.json({ exams })
  } catch (err: any) {
    console.error("[exam/list]", err?.message)
    return Response.json({ error: "Erro ao listar provas." }, { status: 500 })
  }
}
