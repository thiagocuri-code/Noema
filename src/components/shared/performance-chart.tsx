"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface DataPoint {
  date: string
  [subject: string]: string | number
}

interface PerformanceChartProps {
  data: DataPoint[]
  subjects: string[]
}

const COLORS = ["#6C47FF", "#22c55e", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"]

export function PerformanceChart({ data, subjects }: PerformanceChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {subjects.map((subject, i) => (
            <Line
              key={subject}
              type="monotone"
              dataKey={subject}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
