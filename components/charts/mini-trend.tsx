'use client'

interface MiniTrendProps {
  data: number[]
  color?: string
  height?: number
  width?: number
}

export function MiniTrend({ data, color = '#ea580c', height = 40, width = 120 }: MiniTrendProps) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const pad = 2

  const points = data.map((v, i) => ({
    x: i * step,
    y: pad + (height - pad * 2) - ((v - min) / range) * (height - pad * 2),
  }))

  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
  const areaD = pathD + ` L ${points[points.length-1].x} ${height} L 0 ${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace('#','')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r={2.5} fill={color} />
    </svg>
  )
}
