import { prisma } from "./prisma"
import { isEduEmail } from "./edu-filter"

const DAY = 24 * 60 * 60 * 1000

export type StudentMetrics = {
  totalEdu: number
  active7d: number
  engaged7d: number
  inactive30d: number
}

export type EngagementMetrics = {
  aiInteractions7d: number
  aiInteractions30d: number
  studyInteractions7d: number
  examSessionsActive7d: number
  totalExamSessions: number
}

export type DbSize = {
  totalBytes: number
  tables: Array<{ name: string; bytes: number; rows: number }>
}

export type TokenMetrics = {
  costUsdTotal: number
  costUsd7d: number
  costUsd30d: number
  inputTokensTotal: number
  outputTokensTotal: number
  byModel: Array<{ model: string; provider: string; costUsd: number; calls: number }>
  byRoute: Array<{ route: string; costUsd: number; calls: number }>
}

export async function getStudentMetrics(): Promise<StudentMetrics> {
  const students = await prisma.student.findMany({ select: { id: true, email: true } })
  const eduStudents = students.filter((s) => isEduEmail(s.email))
  const eduIds = eduStudents.map((s) => s.id)
  if (eduIds.length === 0) return { totalEdu: 0, active7d: 0, engaged7d: 0, inactive30d: 0 }

  const now = Date.now()
  const d7 = new Date(now - 7 * DAY)
  const d30 = new Date(now - 30 * DAY)

  const [ai7, study7, exam7, ai30, study30, exam30] = await Promise.all([
    prisma.aiInteraction.groupBy({
      by: ["studentId"],
      where: { studentId: { in: eduIds }, createdAt: { gte: d7 } },
      _count: { _all: true },
    }),
    prisma.studyInteraction.groupBy({
      by: ["studentId"],
      where: { studentId: { in: eduIds }, createdAt: { gte: d7 } },
      _count: { _all: true },
    }),
    prisma.examSession.groupBy({
      by: ["studentId"],
      where: { studentId: { in: eduIds }, updatedAt: { gte: d7 } },
      _count: { _all: true },
    }),
    prisma.aiInteraction.findMany({
      where: { studentId: { in: eduIds }, createdAt: { gte: d30 } },
      select: { studentId: true },
      distinct: ["studentId"],
    }),
    prisma.studyInteraction.findMany({
      where: { studentId: { in: eduIds }, createdAt: { gte: d30 } },
      select: { studentId: true },
      distinct: ["studentId"],
    }),
    prisma.examSession.findMany({
      where: { studentId: { in: eduIds }, updatedAt: { gte: d30 } },
      select: { studentId: true },
      distinct: ["studentId"],
    }),
  ])

  const counts7 = new Map<string, number>()
  for (const row of [...ai7, ...study7, ...exam7]) {
    const n = row._count._all as number
    counts7.set(row.studentId, (counts7.get(row.studentId) || 0) + n)
  }

  const active7d = counts7.size
  const engaged7d = [...counts7.values()].filter((n) => n >= 3).length

  const active30Ids = new Set<string>()
  for (const r of ai30) active30Ids.add(r.studentId)
  for (const r of study30) active30Ids.add(r.studentId)
  for (const r of exam30) active30Ids.add(r.studentId)
  const inactive30d = eduIds.filter((id) => !active30Ids.has(id)).length

  return {
    totalEdu: eduIds.length,
    active7d,
    engaged7d,
    inactive30d,
  }
}

export async function getEngagementMetrics(): Promise<EngagementMetrics> {
  const students = await prisma.student.findMany({ select: { id: true, email: true } })
  const eduIds = students.filter((s) => isEduEmail(s.email)).map((s) => s.id)

  const now = Date.now()
  const d7 = new Date(now - 7 * DAY)
  const d30 = new Date(now - 30 * DAY)

  const [ai7, ai30, study7, exam7, totalExams] = await Promise.all([
    prisma.aiInteraction.count({ where: { studentId: { in: eduIds }, createdAt: { gte: d7 } } }),
    prisma.aiInteraction.count({ where: { studentId: { in: eduIds }, createdAt: { gte: d30 } } }),
    prisma.studyInteraction.count({ where: { studentId: { in: eduIds }, createdAt: { gte: d7 } } }),
    prisma.examSession.count({ where: { studentId: { in: eduIds }, updatedAt: { gte: d7 } } }),
    prisma.examSession.count({ where: { studentId: { in: eduIds } } }),
  ])

  return {
    aiInteractions7d: ai7,
    aiInteractions30d: ai30,
    studyInteractions7d: study7,
    examSessionsActive7d: exam7,
    totalExamSessions: totalExams,
  }
}

export async function getDbSize(): Promise<DbSize> {
  const sizeRows = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
    `SELECT pg_database_size(current_database())::bigint AS total`,
  )
  const totalBytes = Number(sizeRows[0]?.total ?? 0)

  const tableRows = await prisma.$queryRawUnsafe<Array<{ name: string; bytes: bigint; rows: bigint }>>(
    `SELECT relname AS name,
            pg_total_relation_size(relid)::bigint AS bytes,
            n_live_tup::bigint AS rows
     FROM pg_stat_user_tables
     ORDER BY bytes DESC
     LIMIT 10`,
  )

  return {
    totalBytes,
    tables: tableRows.map((t) => ({ name: t.name, bytes: Number(t.bytes), rows: Number(t.rows) })),
  }
}

export async function getTokenMetrics(): Promise<TokenMetrics> {
  const now = Date.now()
  const d7 = new Date(now - 7 * DAY)
  const d30 = new Date(now - 30 * DAY)

  const [total, c7, c30, byModel, byRoute] = await Promise.all([
    prisma.aiUsage.aggregate({
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
    }),
    prisma.aiUsage.aggregate({
      where: { createdAt: { gte: d7 } },
      _sum: { costUsd: true },
    }),
    prisma.aiUsage.aggregate({
      where: { createdAt: { gte: d30 } },
      _sum: { costUsd: true },
    }),
    prisma.aiUsage.groupBy({
      by: ["provider", "model"],
      _sum: { costUsd: true },
      _count: { _all: true },
      orderBy: { _sum: { costUsd: "desc" } },
    }),
    prisma.aiUsage.groupBy({
      by: ["route"],
      _sum: { costUsd: true },
      _count: { _all: true },
      orderBy: { _sum: { costUsd: "desc" } },
    }),
  ])

  return {
    costUsdTotal: total._sum.costUsd ?? 0,
    costUsd7d: c7._sum.costUsd ?? 0,
    costUsd30d: c30._sum.costUsd ?? 0,
    inputTokensTotal: total._sum.inputTokens ?? 0,
    outputTokensTotal: total._sum.outputTokens ?? 0,
    byModel: byModel.map((r) => ({
      provider: r.provider,
      model: r.model,
      costUsd: r._sum.costUsd ?? 0,
      calls: r._count._all,
    })),
    byRoute: byRoute.map((r) => ({
      route: r.route,
      costUsd: r._sum.costUsd ?? 0,
      calls: r._count._all,
    })),
  }
}

export async function getKbCount(): Promise<{ total: number; byGrade: Record<number, number> }> {
  const rows = await prisma.knowledgeBase.groupBy({
    by: ["grade"],
    _count: { _all: true },
  })
  const byGrade: Record<number, number> = {}
  let total = 0
  for (const r of rows) {
    byGrade[r.grade] = r._count._all
    total += r._count._all
  }
  return { total, byGrade }
}
