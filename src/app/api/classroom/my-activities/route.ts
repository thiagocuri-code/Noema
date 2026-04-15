// Aggregates the signed-in student's own assignments + submission status
// across every ACTIVE course they're enrolled in. Used by the student
// dashboard overview panel.

interface CourseWork {
  id: string
  title: string
  workType?: string
  dueDate?: { year: number; month: number; day: number }
  dueTime?: { hours?: number; minutes?: number }
  maxPoints?: number
  alternateLink?: string
  creationTime?: string
}

interface StudentSubmission {
  id: string
  courseWorkId: string
  state?: "NEW" | "CREATED" | "TURNED_IN" | "RETURNED" | "RECLAIMED_BY_STUDENT"
  late?: boolean
  assignedGrade?: number
  draftGrade?: number
  updateTime?: string
}

export interface ActivityItem {
  courseId: string
  courseName: string
  id: string
  title: string
  alternateLink?: string
  dueDate?: string // ISO
  maxPoints?: number
  state: "PENDING" | "TURNED_IN" | "RETURNED" | "MISSING"
  late: boolean
  grade?: number // 0-100 normalized
  rawGrade?: number
}

function dueToIso(cw: CourseWork): string | undefined {
  if (!cw.dueDate) return undefined
  const { year, month, day } = cw.dueDate
  const h = cw.dueTime?.hours ?? 23
  const m = cw.dueTime?.minutes ?? 59
  const d = new Date(Date.UTC(year, month - 1, day, h, m))
  return d.toISOString()
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accessToken = searchParams.get("accessToken")

  if (!accessToken) {
    return Response.json({ error: "Token de acesso ausente." }, { status: 401 })
  }

  const headers = { Authorization: `Bearer ${accessToken}` }

  const coursesRes = await fetch(
    "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=30&studentId=me",
    { headers }
  )
  if (!coursesRes.ok) {
    const err = await coursesRes.json().catch(() => ({}))
    return Response.json(
      { error: err.error?.message ?? "Erro ao buscar turmas." },
      { status: coursesRes.status }
    )
  }
  const coursesData = await coursesRes.json()
  const courses: { id: string; name: string }[] = coursesData.courses ?? []

  const perCourse = await Promise.all(
    courses.map(async (course) => {
      const [cwRes, subRes] = await Promise.all([
        fetch(
          `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?pageSize=50`,
          { headers }
        ),
        fetch(
          `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork/-/studentSubmissions?userId=me&pageSize=100`,
          { headers }
        ),
      ])

      const cwData = cwRes.ok ? await cwRes.json() : { courseWork: [] }
      const subData = subRes.ok ? await subRes.json() : { studentSubmissions: [] }

      const courseWork: CourseWork[] = (cwData.courseWork ?? []).filter(
        (cw: CourseWork) => !cw.workType || cw.workType === "ASSIGNMENT" || cw.workType === "SHORT_ANSWER_QUESTION" || cw.workType === "MULTIPLE_CHOICE_QUESTION"
      )
      const submissions: StudentSubmission[] = subData.studentSubmissions ?? []

      const subByCw = new Map<string, StudentSubmission>()
      for (const s of submissions) subByCw.set(s.courseWorkId, s)

      const now = Date.now()

      const items: ActivityItem[] = courseWork.map((cw) => {
        const sub = subByCw.get(cw.id)
        const dueIso = dueToIso(cw)
        const isOverdue = !!(dueIso && new Date(dueIso).getTime() < now)

        let state: ActivityItem["state"] = "PENDING"
        if (sub?.state === "TURNED_IN") state = "TURNED_IN"
        else if (sub?.state === "RETURNED") state = "RETURNED"
        else if (isOverdue) state = "MISSING"
        else state = "PENDING"

        const raw = sub?.assignedGrade ?? sub?.draftGrade
        const max = cw.maxPoints
        const grade =
          raw != null && max && max > 0 ? Math.round((raw / max) * 100) : undefined

        return {
          courseId: course.id,
          courseName: course.name,
          id: cw.id,
          title: cw.title,
          alternateLink: cw.alternateLink,
          dueDate: dueIso,
          maxPoints: max,
          state,
          late: !!sub?.late,
          grade,
          rawGrade: raw,
        }
      })

      return { course, items }
    })
  )

  const activities: ActivityItem[] = perCourse.flatMap((c) => c.items)

  // Per-course aggregation
  const byCourse: Record<
    string,
    {
      courseId: string
      courseName: string
      total: number
      pending: number
      missing: number
      turnedIn: number
      returned: number
      gradedCount: number
      avgGrade: number | null
    }
  > = {}

  for (const c of perCourse) {
    const items = c.items
    const graded = items.filter((i) => i.grade != null).map((i) => i.grade!)
    byCourse[c.course.id] = {
      courseId: c.course.id,
      courseName: c.course.name,
      total: items.length,
      pending: items.filter((i) => i.state === "PENDING").length,
      missing: items.filter((i) => i.state === "MISSING").length,
      turnedIn: items.filter((i) => i.state === "TURNED_IN").length,
      returned: items.filter((i) => i.state === "RETURNED").length,
      gradedCount: graded.length,
      avgGrade: graded.length
        ? Math.round(graded.reduce((a, b) => a + b, 0) / graded.length)
        : null,
    }
  }

  const gradedAll = activities.filter((i) => i.grade != null).map((i) => i.grade!)
  const overall = {
    total: activities.length,
    pending: activities.filter((i) => i.state === "PENDING").length,
    missing: activities.filter((i) => i.state === "MISSING").length,
    turnedIn: activities.filter((i) => i.state === "TURNED_IN").length,
    returned: activities.filter((i) => i.state === "RETURNED").length,
    gradedCount: gradedAll.length,
    avgGrade: gradedAll.length
      ? Math.round(gradedAll.reduce((a, b) => a + b, 0) / gradedAll.length)
      : null,
  }

  return Response.json({ overall, byCourse, activities })
}
