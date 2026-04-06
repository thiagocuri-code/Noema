"use client"

import { Badge } from "@/components/ui/badge"
import type { Assignment } from "@/types/trix"

function getDueStatus(assignment: Assignment) {
  if (!assignment.dueDate) return { label: "Sem prazo", color: "bg-gray-100 text-gray-600" }

  const due = new Date(
    assignment.dueDate.year,
    assignment.dueDate.month - 1,
    assignment.dueDate.day
  )
  const now = new Date()
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) return { label: "Atrasado", color: "bg-red-100 text-red-700" }
  if (diff <= 3) return { label: `${diff}d restante${diff > 1 ? "s" : ""}`, color: "bg-amber-100 text-amber-700" }
  return { label: `${diff}d restantes`, color: "bg-green-100 text-green-700" }
}

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const status = getDueStatus(assignment)

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-[#1a1a2e]">{assignment.title}</h4>
        {assignment.description && (
          <p className="text-xs text-gray-500 line-clamp-1">
            {assignment.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={status.color}>
          {status.label}
        </Badge>
        {assignment.alternateLink && (
          <a
            href={assignment.alternateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#0a1a4a] hover:underline"
          >
            Abrir
          </a>
        )}
      </div>
    </div>
  )
}
