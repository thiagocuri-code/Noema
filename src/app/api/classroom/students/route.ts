// Busca alunos matriculados em uma turma via Google Classroom API
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accessToken = searchParams.get("accessToken")
  const courseId = searchParams.get("courseId")

  if (!accessToken || !courseId) {
    return Response.json({ error: "Parâmetros ausentes." }, { status: 400 })
  }

  const res = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/students?pageSize=30`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    const err = await res.json()
    return Response.json({ error: err.error?.message ?? "Erro ao buscar alunos." }, { status: res.status })
  }

  const data = await res.json()
  return Response.json({ students: data.students ?? [] })
}
