import { prisma } from "@/lib/prisma"

const TEACHER_CODE = "TRIX2026"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get("code") !== TEACHER_CODE) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const students = await prisma.student.findMany({
      include: {
        profile: true,
        performances: { orderBy: { submittedAt: "desc" } },
        studyInteractions: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "asc" },
    })

    return Response.json({ students })
  } catch (err: any) {
    console.error("[teacher/students]", err?.message)
    return Response.json({ error: "Erro ao buscar alunos." }, { status: 500 })
  }
}
