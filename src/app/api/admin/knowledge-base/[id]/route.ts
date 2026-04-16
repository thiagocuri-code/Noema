import { prisma } from "@/lib/prisma"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  await prisma.knowledgeBase.delete({ where: { id } })
  return Response.json({ ok: true })
}
