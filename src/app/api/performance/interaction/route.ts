import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { googleId, courseId, courseName, type, metadata } = await req.json()

    if (!googleId || !courseId || !type) {
      return Response.json({ error: "Dados ausentes." }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { googleId } })
    if (!student) {
      // Don't block — student may not have been created yet
      return Response.json({ ok: true })
    }

    await prisma.studyInteraction.create({
      data: {
        studentId: student.id,
        courseId,
        courseName: courseName ?? "",
        type,
        metadata: metadata ?? {},
      },
    })

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error("[performance/interaction]", err?.message)
    return Response.json({ error: "Erro ao salvar interação." }, { status: 500 })
  }
}
