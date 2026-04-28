'use client'
import { DonutChart } from './donut-chart'

interface Props {
  classes: any[]
  learnersByClass: Record<string, any[]>
  missedCount: number
  totalLearners: number
}

export function EducatorCharts({ classes, learnersByClass, missedCount, totalLearners }: Props) {
  const generalCount = classes.filter(c => c.lesson_type !== 'one_to_one').length
  const otoCount = classes.filter(c => c.lesson_type === 'one_to_one').length
  const typeDonut = [
    { label: 'General', value: generalCount, color: '#3b82f6' },
    { label: '1:1', value: otoCount, color: '#8b5cf6' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200/60 p-4">
        <p className="text-[12px] font-semibold text-slate-700 mb-3">Overview</p>
        <div className="space-y-2">
          {[
            { label: 'Total learners', value: totalLearners, color: 'text-blue-600' },
            { label: 'Classes', value: classes.length, color: 'text-orange-600' },
            { label: 'Missed work', value: missedCount, color: missedCount > 0 ? 'text-red-500' : 'text-slate-400' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">{s.label}</span>
              <span className={`text-[13px] font-semibold tabular-nums ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
      {typeDonut.length > 1 && (
        <div className="bg-white rounded-lg border border-slate-200/60 p-4">
          <p className="text-[12px] font-semibold text-slate-700 mb-3">Class Types</p>
          <DonutChart data={typeDonut} size={110} label={String(classes.length)} sublabel="classes" />
        </div>
      )}
    </div>
  )
}
