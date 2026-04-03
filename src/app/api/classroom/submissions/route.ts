// Busca submissões de todos os alunos para todos os assignments de uma turma
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accessToken = searchParams.get("accessToken")
  const courseId = searchParams.get("courseId")

  if (!accessToken || !courseId) {
    return Response.json({ error: "Parâmetros ausentes." }, { status: 400 })
  }

  const headers = { Authorization: `Bearer ${accessToken}` }

  // Busca todos os assignments
  const cwRes = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork?pageSize=20`,
    { headers }
  )
  if (!cwRes.ok) return Response.json({ submissions: [] })

  const cwData = await cwRes.json()
  const assignments: any[] = cwData.courseWork ?? []

  // Para cada assignment, busca as submissões
  const submissionsByAssignment = await Promise.all(
    assignments.map(async (cw) => {
      const subRes = await fetch(
        `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${cw.id}/studentSubmissions?pageSize=30`,
        { headers }
      )
      if (!subRes.ok) return { assignmentId: cw.id, assignmentTitle: cw.title, submissions: [] }
      const subData = await subRes.json()
      return {
        assignmentId: cw.id,
        assignmentTitle: cw.title,
        dueDate: cw.dueDate,
        submissions: subData.studentSubmissions ?? [],
      }
    })
  )

  return Response.json({ submissionsByAssignment })
}
