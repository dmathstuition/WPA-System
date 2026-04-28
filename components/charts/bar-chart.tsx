'use client'

interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  height?: number
}

export function BarChart({ data, height = 180 }: BarChartProps) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = Math.min(32, Math.floor(280 / data.length))
  const gap = Math.min(12, Math.floor(60 / data.length))
  const totalW = data.length * (barW + gap) - gap
  const padL = 36, padB = 28, padT = 8

  // Y-axis ticks
  const ticks = [0, Math.round(max * 0.5), max]

  return (
    <svg viewBox={`0 0 ${totalW + padL + 16} ${height + padB + padT}`} className="w-full" style={{ maxHeight: height + padB + padT }}>
      {/* Y-axis labels + grid */}
      {ticks.map((t, i) => {
        const y = padT + height - (t / max) * height
        return (
          <g key={i}>
            <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-slate-400" style={{ fontSize: 9 }}>{t}</text>
            <line x1={padL} y1={y} x2={totalW + padL} y2={y} stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray={i === 0 ? 'none' : '3,3'} />
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = (d.value / max) * height
        const x = padL + i * (barW + gap)
        const y = padT + height - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={3}
              fill={d.color ?? '#ea580c'} opacity={0.85} />
            {/* Value on top */}
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" className="fill-slate-600" style={{ fontSize: 9, fontWeight: 600 }}>{d.value}</text>
            )}
            {/* Label */}
            <text x={x + barW / 2} y={padT + height + 14} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 8 }}>{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
