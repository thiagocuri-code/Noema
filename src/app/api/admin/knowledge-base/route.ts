import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { normalizeSubject } from "@/lib/course-name"

export const runtime = "nodejs"

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const entries = await prisma.knowledgeBase.findMany({
    orderBy: [{ grade: "asc" }, { subject: "asc" }, { createdAt: "desc" }],
  })
  return Response.json({ entries })
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const contentType = req.headers.get("content-type") || ""

    let grade: number
    let subject: string
    let title: string
    let content: string

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      grade = parseInt(String(form.get("grade") || "0"), 10)
      subject = String(form.get("subject") || "").trim()
      title = String(form.get("title") || "").trim()
      const textContent = String(form.get("content") || "").trim()
      const file = form.get("file") as File | null

      if (file && file.size > 0) {
        const buf = Buffer.from(await file.arrayBuffer())
        const { PDFParse } = await import("pdf-parse")
        const parser = new PDFParse({ data: buf })
        const parsed = await parser.getText()
        await parser.destroy()
        content = (parsed.text || "").trim()
        if (!title) title = file.name.replace(/\.pdf$/i, "")
      } else {
        content = textContent
      }
    } else {
      const body = await req.json()
      grade = parseInt(String(body.grade || "0"), 10)
      subject = String(body.subject || "").trim()
      title = String(body.title || "").trim()
      content = String(body.content || "").trim()
    }

    if (!grade || grade < 1 || grade > 3) {
      return Response.json({ error: "Ano inválido (1, 2 ou 3)." }, { status: 400 })
    }
    if (!subject || !title || !content) {
      return Response.json({ error: "Preencha matéria, título e conteúdo." }, { status: 400 })
    }

    const entry = await prisma.knowledgeBase.create({
      data: {
        grade,
        subject: normalizeSubject(subject),
        title,
        content,
      },
    })

    return Response.json({ entry })
  } catch (err: any) {
    console.error("[admin/knowledge-base POST]", err?.message)
    return Response.json({ error: "Erro ao salvar." }, { status: 500 })
  }
}
