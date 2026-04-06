"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const COLORS = [
  { bar: "#071245", bg: "#eef1fb" },
  { bar: "#10b981", bg: "#ecfdf5" },
  { bar: "#f59e0b", bg: "#fffbeb" },
  { bar: "#f43f5e", bg: "#fff1f2" },
  { bar: "#0ea5e9", bg: "#f0f9ff" },
  { bar: "#8b5cf6", bg: "#f5f3ff" },
  { bar: "#14b8a6", bg: "#f0fdfa" },
  { bar: "#f97316", bg: "#fff7ed" },
]

interface ClassCardProps {
  id: string
  name: string
  section?: string
  teacherName?: string
  pendingCount?: number
  urgent?: boolean
  index: number
}

export function ClassCard({
  id,
  name,
  section,
  teacherName,
  pendingCount = 0,
  urgent = false,
  index,
}: ClassCardProps) {
  const color = COLORS[index % COLORS.length]

  return (
    <Link href={`/dashboard/student/${id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-0 overflow-hidden" style={{ backgroundColor: color.bg }}>
        <div className="h-2" style={{ backgroundColor: color.bar }} />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-semibold text-[#1a1a2e] group-hover:text-[#0a1a4a] transition-colors">
              {name}
            </CardTitle>
            {urgent && (
              <Badge variant="destructive" className="text-xs">
                Urgente
              </Badge>
            )}
          </div>
          {section && (
            <p className="text-xs text-gray-500">{section}</p>
          )}
        </CardHeader>
        <CardContent>
          {teacherName && (
            <p className="text-sm text-gray-600">{teacherName}</p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            {pendingCount > 0
              ? `${pendingCount} atividade${pendingCount > 1 ? "s" : ""} pendente${pendingCount > 1 ? "s" : ""}`
              : "Sem atividades pendentes"}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
