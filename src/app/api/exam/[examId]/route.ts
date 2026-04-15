import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params
    const { searchParams } = new URL(req.url)
    const googleId = searchParams.get("googleId")

    if (!googleId) {
      return Response.json({ error: "googleId ausente." }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { googleId } })
    if (!student) return Response.json({ error: "Aluno não encontrado." }, { status: 404 })

    const exam = await prisma.examSession.findFirst({
      where: { id: examId, studentId: student.id },
    })

    if (!exam) return Response.json({ error: "Prova não encontrada." }, { status: 404 })
    return Response.json({ exam })
  } catch (err: any) {
    console.error("[exam/get]", err?.message)
    return Response.json({ error: "Erro ao carregar prova." }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params
    const body = await req.json()
    const { googleId, action, data } = body

    if (!googleId || !action) {
      return Response.json({ error: "Dados ausentes." }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { googleId } })
    if (!student) return Response.json({ error: "Aluno não encontrado." }, { status: 404 })

    const exam = await prisma.examSession.findFirst({
      where: { id: examId, studentId: student.id },
    })
    if (!exam) return Response.json({ error: "Prova não encontrada." }, { status: 404 })

    let updateData: any = {}

    if (action === "add_simulado_score") {
      const score = Number(data.score)
      updateData = { simuladoScores: [...exam.simuladoScores, score] }
    } else if (action === "add_revision") {
      const topic = data.topic as string | undefined
      const reviewed = topic && !exam.topicsReviewed.includes(topic)
        ? [...exam.topicsReviewed, topic]
        : exam.topicsReviewed
      updateData = {
        revisionCount: exam.revisionCount + 1,
        topicsReviewed: reviewed,
      }
    } else if (action === "add_flashcards") {
      const count = Number(data.count ?? 1)
      updateData = { flashcardsStudied: exam.flashcardsStudied + count }
    } else if (action === "update_topics") {
      updateData = {
        topicsWeak: data.topicsWeak ?? exam.topicsWeak,
        topicsStrong: data.topicsStrong ?? exam.topicsStrong,
      }
    } else {
      return Response.json({ error: "Ação inválida." }, { status: 400 })
    }

    const updated = await prisma.examSession.update({
      where: { id: examId },
      data: updateData,
    })

    return Response.json({ exam: updated })
  } catch (err: any) {
    console.error("[exam/patch]", err?.message)
    return Response.json({ error: "Erro ao atualizar prova." }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params
    const { searchParams } = new URL(req.url)
    const googleId = searchParams.get("googleId")

    if (!googleId) {
      return Response.json({ error: "googleId ausente." }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { googleId } })
    if (!student) return Response.json({ error: "Aluno não encontrado." }, { status: 404 })

    await prisma.examSession.deleteMany({
      where: { id: examId, studentId: student.id },
    })

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error("[exam/delete]", err?.message)
    return Response.json({ error: "Erro ao deletar prova." }, { status: 500 })
  }
}
