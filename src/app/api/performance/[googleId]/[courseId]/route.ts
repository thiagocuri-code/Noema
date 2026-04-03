import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ googleId: string; courseId: string }> }
) {
  const { googleId, courseId } = await params

  try {
    const student = await prisma.student.findUnique({
      where: { googleId },
      include: {
        performances: {
          where: { courseId },
          orderBy: { submittedAt: "desc" },
        },
        studyInteractions: {
          where: { courseId },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!student) {
      return Response.json({
        avgScore: null,
        simulados: [],
        revisoes: 0,
        darwinMessages: 0,
        recentActivities: [],
      })
    }

    const simulados = student.performances
    const avgScore =
      simulados.length > 0
        ? simulados.reduce((s, p) => s + p.score, 0) / simulados.length
        : null

    const revisoes = student.studyInteractions.filter(
      si => si.type === "revisao"
    ).length

    const darwinMessages = student.studyInteractions
      .filter(si => si.type === "darwin")
      .reduce((sum, si) => {
        const meta = si.metadata as any
        return sum + (meta?.messagesCount ?? 1)
      }, 0)

    // Build recent activities list (merged, sorted by date)
    const recentActivities: {
      type: string
      name: string
      score?: number
      date: string
    }[] = [
      ...simulados.map(p => ({
        type: "simulado",
        name: p.activityName,
        score: p.score,
        date: p.submittedAt.toISOString(),
      })),
      ...student.studyInteractions.map(si => {
        const meta = si.metadata as any
        return {
          type: si.type,
          name:
            si.type === "darwin"
              ? `${meta?.messagesCount ?? 1} perguntas ao Darwin`
              : `${meta?.contentType ?? "Material"} gerado`,
          date: si.createdAt.toISOString(),
        }
      }),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    return Response.json({
      avgScore,
      simulados,
      revisoes,
      darwinMessages,
      recentActivities,
    })
  } catch (err: any) {
    console.error("[performance/courseId]", err?.message)
    return Response.json({
      avgScore: null,
      simulados: [],
      revisoes: 0,
      darwinMessages: 0,
      recentActivities: [],
    })
  }
}
