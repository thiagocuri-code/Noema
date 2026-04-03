"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ClassOverviewProps {
  courses: { id: string; name: string }[]
  interactions: { courseName: string; prompt: string; userId: string; createdAt: string }[]
}

export function ClassOverview({ courses, interactions }: ClassOverviewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        const courseInteractions = interactions.filter(
          (i) => i.courseName === course.name
        )
        const uniqueStudents = new Set(courseInteractions.map((i) => i.userId))
        const promptCounts: Record<string, number> = {}
        courseInteractions.forEach((i) => {
          const key = i.prompt.substring(0, 50)
          promptCounts[key] = (promptCounts[key] || 0) + 1
        })
        const topDoubts = Object.entries(promptCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)

        return (
          <Card key={course.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{course.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Alunos ativos na Noema</span>
                <span className="font-medium text-[#6C47FF]">
                  {uniqueStudents.size}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Interações</span>
                <span className="font-medium">{courseInteractions.length}</span>
              </div>
              {topDoubts.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Top dúvidas:</p>
                  <ul className="space-y-1">
                    {topDoubts.map(([q, count], i) => (
                      <li key={i} className="text-xs text-gray-600 truncate">
                        &quot;{q}...&quot;{" "}
                        <span className="text-gray-400">({count}x)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
