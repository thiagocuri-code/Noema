import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { googleId, courseId, courseName, activityName, score, feedback } =
      await req.json()

    if (!googleId || !courseId || !activityName || score == null) {
      return Response.json({ error: "Dados ausentes." }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { googleId } })
    if (!student) {
      return Response.json({ error: "Aluno não encontrado." }, { status: 404 })
    }

    await prisma.performance.create({
      data: {
        studentId: student.id,
        courseId,
        courseName: courseName ?? "",
        activityName,
        score: Number(score),
        feedback: feedback ?? "",
      },
    })

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error("[performance/submit]", err?.message)
    return Response.json({ error: "Erro ao salvar desempenho." }, { status: 500 })
  }
}
