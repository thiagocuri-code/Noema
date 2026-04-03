import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { profile, googleId } = await req.json()

    if (!googleId || !profile) {
      return Response.json({ error: "Dados ausentes." }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { googleId } })
    if (!student) {
      return Response.json({ error: "Aluno não encontrado." }, { status: 404 })
    }

    await prisma.studentProfile.upsert({
      where: { studentId: student.id },
      update: {
        learningStyle: profile.learningStyle,
        goal: profile.goal,
        hardSubject: profile.hardSubject,
        helpPreference: profile.helpPreference,
        studyTime: profile.studyTime,
        feedbackStyle: profile.feedbackStyle,
        schoolYear: profile.schoolYear,
      },
      create: {
        studentId: student.id,
        learningStyle: profile.learningStyle,
        goal: profile.goal,
        hardSubject: profile.hardSubject,
        helpPreference: profile.helpPreference,
        studyTime: profile.studyTime,
        feedbackStyle: profile.feedbackStyle,
        schoolYear: profile.schoolYear,
      },
    })

    return Response.json({ ok: true })
  } catch (err: any) {
    console.error("[profile/save]", err?.message)
    return Response.json({ error: "Erro ao salvar perfil." }, { status: 500 })
  }
}
