"use client"

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts"

interface ProgressRingProps {
  value: number
  label: string
}

export function ProgressRing({ value, label }: ProgressRingProps) {
  const data = [{ name: label, value, fill: "#6C47FF" }]

  return (
    <div className="flex flex-col items-center">
      <div className="h-32 w-32">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={10}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "#f3f4f6" }}
              dataKey="value"
              cornerRadius={5}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 text-center">
        <p className="text-lg font-bold text-[#6C47FF]">{value}%</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}
