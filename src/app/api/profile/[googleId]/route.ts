import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ googleId: string }> }
) {
  const { googleId } = await params
  try {
    const student = await prisma.student.findUnique({
      where: { googleId },
      include: { profile: true },
    })

    if (!student || !student.profile) {
      return Response.json({ profile: null })
    }

    return Response.json({ profile: student.profile })
  } catch (err: any) {
    console.error("[profile/get]", err?.message)
    return Response.json({ profile: null })
  }
}
