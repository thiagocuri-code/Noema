import { prisma } from "@/lib/prisma"
import { parseCourseName } from "@/lib/course-name"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const courseName = searchParams.get("courseName") || ""

    const parsed = parseCourseName(courseName)
    if (!parsed.grade || !parsed.subjectNormalized) {
      return Response.json({ entries: [], parsed })
    }

    const entries = await prisma.knowledgeBase.findMany({
      where: {
        grade: parsed.grade,
        subject: parsed.subjectNormalized,
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json({ entries, parsed })
  } catch (err: any) {
    console.error("[knowledge-base GET]", err?.message)
    return Response.json({ entries: [], error: "Erro ao carregar base." }, { status: 500 })
  }
}
