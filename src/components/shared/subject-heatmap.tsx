"use client"

interface HeatmapData {
  day: string
  [subject: string]: string | number
}

interface SubjectHeatmapProps {
  data: HeatmapData[]
  subjects: string[]
}

function getIntensity(value: number, max: number) {
  if (value === 0) return "bg-gray-100"
  const ratio = value / max
  if (ratio > 0.75) return "bg-[#0a1a4a]"
  if (ratio > 0.5) return "bg-[#0a1a4a]/70"
  if (ratio > 0.25) return "bg-[#0a1a4a]/40"
  return "bg-[#0a1a4a]/20"
}

export function SubjectHeatmap({ data, subjects }: SubjectHeatmapProps) {
  const max = Math.max(
    ...data.flatMap((d) =>
      subjects.map((s) => (typeof d[s] === "number" ? (d[s] as number) : 0))
    ),
    1
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left text-xs text-gray-500 pb-2 pr-3">Matéria</th>
            {data.map((d) => (
              <th key={d.day} className="text-xs text-gray-400 pb-2 px-1">
                {d.day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject}>
              <td className="text-xs text-gray-600 pr-3 py-1 whitespace-nowrap">
                {subject}
              </td>
              {data.map((d) => {
                const val = typeof d[subject] === "number" ? (d[subject] as number) : 0
                return (
                  <td key={d.day} className="px-1 py-1">
                    <div
                      className={`h-6 w-6 rounded-sm ${getIntensity(val, max)}`}
                      title={`${subject}: ${val} interações em ${d.day}`}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
