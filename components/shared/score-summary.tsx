'use client'

interface Props {
  submissions: { score?: number | null; max_score?: number | null; status: string }[]
}

export function ScoreSummary({ submissions }: Props) {
  const scored = submissions.filter(s => s.status === 'scored' && s.score != null && s.max_score)
  if (scored.length === 0) return null

  const percentages = scored.map(s => Math.round(((s.score ?? 0) / (s.max_score ?? 1)) * 100))
  const avg = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
  const highest = Math.max(...percentages)
  const lowest = Math.min(...percentages)

  const gradeColor = (p: number) => p >= 70 ? 'text-emerald-600' : p >= 50 ? 'text-amber-600' : 'text-red-500'
  const gradeBg = (p: number) => p >= 70 ? 'bg-emerald-50' : p >= 50 ? 'bg-amber-50' : 'bg-red-50'

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-t border-slate-100 bg-slate-50/50">
      <span className="text-[10.5px] text-slate-400 font-medium">Class stats:</span>
      {[
        { label: 'Avg', value: avg },
        { label: 'High', value: highest },
        { label: 'Low', value: lowest },
      ].map(s => (
        <span key={s.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold ${gradeBg(s.value)} ${gradeColor(s.value)}`}>
          {s.label}: {s.value}%
        </span>
      ))}
      <span className="text-[10px] text-slate-400">{scored.length} scored</span>
    </div>
  )
}
