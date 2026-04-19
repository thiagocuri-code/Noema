import { prisma } from "@/lib/prisma"

const TEACHER_CODE = "TRIX2026"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get("code") !== TEACHER_CODE) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { studentId } = await params

  try {
    // Delete all related records first, then the student
    await prisma.$transaction([
      prisma.examSession.deleteMany({ where: { studentId } }),
      prisma.studyInteraction.deleteMany({ where: { studentId } }),
      prisma.aiInteraction.deleteMany({ where: { studentId } }),
      prisma.performance.deleteMany({ where: { studentId } }),
      prisma.studentProfile.deleteMany({ where: { studentId } }),
      prisma.student.delete({ where: { id: studentId } }),
    ])

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error("[teacher/students/delete]", err?.message)
    return Response.json({ error: "Erro ao remover aluno." }, { status: 500 })
  }
}
