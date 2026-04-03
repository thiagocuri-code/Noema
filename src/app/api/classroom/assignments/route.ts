export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accessToken = searchParams.get("accessToken")
  const courseId = searchParams.get("courseId")

  if (!accessToken || !courseId) {
    return Response.json({ error: "Parâmetros ausentes." }, { status: 400 })
  }

  const headers = { Authorization: `Bearer ${accessToken}` }

  const [cwRes, annRes, matRes] = await Promise.all([
    fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork?pageSize=20`, { headers }),
    fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements?pageSize=10`, { headers }),
    fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWorkMaterials?pageSize=20`, { headers }),
  ])

  const [cwData, annData, matData] = await Promise.all([
    cwRes.ok ? cwRes.json() : { courseWork: [] },
    annRes.ok ? annRes.json() : { announcements: [] },
    matRes.ok ? matRes.json() : { courseWorkMaterial: [] },
  ])

  // Extract Drive file IDs from materials attachments
  function extractDriveFiles(materials: any[]): { id: string; title: string }[] {
    const files: { id: string; title: string }[] = []
    for (const m of materials ?? []) {
      if (m.driveFile?.driveFile?.id) {
        files.push({ id: m.driveFile.driveFile.id, title: m.driveFile.driveFile.title ?? "" })
      }
    }
    return files
  }

  const assignments = (cwData.courseWork ?? []).map((cw: any) => ({
    id: cw.id,
    title: cw.title,
    description: cw.description,
    dueDate: cw.dueDate,
    dueTime: cw.dueTime,
    alternateLink: cw.alternateLink,
    driveFiles: extractDriveFiles(cw.materials),
  }))

  const materials = (matData.courseWorkMaterial ?? []).map((m: any) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    alternateLink: m.alternateLink,
    driveFiles: extractDriveFiles(m.materials),
  }))

  const announcements = (annData.announcements ?? []).map((a: any) => ({
    id: a.id,
    text: a.text,
    alternateLink: a.alternateLink,
    driveFiles: extractDriveFiles(a.materials),
  }))

  return Response.json({ assignments, materials, announcements })
}
