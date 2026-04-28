'use client'

interface DonutChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
  label?: string
  sublabel?: string
}

export function DonutChart({ data, size = 140, label, sublabel }: DonutChartProps) {
  const total = data.reduce((a, d) => a + d.value, 0)
  if (total === 0) return null
  const r = (size - 20) / 2
  const cx = size / 2, cy = size / 2
  const strokeW = 18

  let cumAngle = -90 // Start from top
  const arcs = data.map(d => {
    const angle = (d.value / total) * 360
    const startAngle = cumAngle
    cumAngle += angle
    return { ...d, startAngle, angle }
  })

  function polarToCart(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function arcPath(startAngle: number, angle: number) {
    const start = polarToCart(cx, cy, r, startAngle)
    const end = polarToCart(cx, cy, r, startAngle + angle)
    const large = angle > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
        {/* Segments */}
        {arcs.map((a, i) => (
          a.angle > 0.5 && <path key={i} d={arcPath(a.startAngle, a.angle - 0.5)} fill="none"
            stroke={a.color} strokeWidth={strokeW} strokeLinecap="round" />
        ))}
        {/* Center text */}
        {label && <text x={cx} y={cy - 2} textAnchor="middle" className="fill-slate-900" style={{ fontSize: 18, fontWeight: 600 }}>{label}</text>}
        {sublabel && <text x={cx} y={cy + 13} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 9 }}>{sublabel}</text>}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[10px] text-slate-500">{d.label} <span className="font-medium text-slate-700">{d.value}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}
