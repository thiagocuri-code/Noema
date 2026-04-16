import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import KnowledgeBaseClient from "./knowledge-base-client"

export default async function KnowledgeBasePage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login")

  const entries = await prisma.knowledgeBase.findMany({
    orderBy: [{ grade: "asc" }, { subject: "asc" }, { createdAt: "desc" }],
  })

  return <KnowledgeBaseClient initialEntries={entries.map(serialize)} />
}

function serialize(e: { id: string; grade: number; subject: string; title: string; content: string; createdAt: Date }) {
  return {
    id: e.id,
    grade: e.grade,
    subject: e.subject,
    title: e.title,
    content: e.content,
    createdAt: e.createdAt.toISOString(),
  }
}
