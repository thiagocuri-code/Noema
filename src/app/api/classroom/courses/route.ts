export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accessToken = searchParams.get("accessToken")

  if (!accessToken) {
    return Response.json({ error: "Token de acesso ausente." }, { status: 401 })
  }

  const res = await fetch(
    "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=30",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    const err = await res.json()
    return Response.json(
      { error: err.error?.message ?? "Erro ao buscar turmas do Classroom." },
      { status: res.status }
    )
  }

  const data = await res.json()
  return Response.json({ courses: data.courses ?? [] })
}
