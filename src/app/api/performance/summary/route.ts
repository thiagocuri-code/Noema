import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const googleId = searchParams.get("googleId")

  if (!googleId) {
    return Response.json({ error: "googleId ausente." }, { status: 400 })
  }

  try {
    const student = await prisma.student.findUnique({
      where: { googleId },
      include: {
        performances: true,
        studyInteractions: true,
      },
    })

    if (!student) return Response.json({ summary: {} })

    // Group performances by courseId
    const summary: Record<string, { avgScore: number; totalActivities: number }> = {}

    const byCourse: Record<string, number[]> = {}
    for (const p of student.performances) {
      if (!byCourse[p.courseId]) byCourse[p.courseId] = []
      byCourse[p.courseId].push(p.score)
    }

    for (const [courseId, scores] of Object.entries(byCourse)) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      // Count study interactions for this course too
      const interactions = student.studyInteractions.filter(
        s => s.courseId === courseId
      ).length
      summary[courseId] = {
        avgScore: avg,
        totalActivities: scores.length + interactions,
      }
    }

    // Courses with only study interactions (no quiz scores)
    for (const si of student.studyInteractions) {
      if (!summary[si.courseId]) {
        summary[si.courseId] = { avgScore: 0, totalActivities: 0 }
      }
      if (!byCourse[si.courseId]) {
        summary[si.courseId].totalActivities += 1
      }
    }

    return Response.json({ summary })
  } catch (err: any) {
    console.error("[performance/summary]", err?.message)
    return Response.json({ summary: {} })
  }
}
