'use client'
import { BarChart } from './bar-chart'
import { DonutChart } from './donut-chart'
import { MiniTrend } from './mini-trend'

interface Props {
  stats: {
    learners: number; educators: number; assignments: number; missed: number
    tutorsActiveToday?: number; tutorsAssignToday?: number
  }
  tutorRows: any[]
}

export function DashboardCharts({ stats, tutorRows }: Props) {
  // Build attendance rate distribution from tutor data
  const attBuckets = { excellent: 0, good: 0, fair: 0, poor: 0 }
  for (const t of tutorRows) {
    if (t.attRate >= 80) attBuckets.excellent++
    else if (t.attRate >= 60) attBuckets.good++
    else if (t.attRate >= 40) attBuckets.fair++
    else attBuckets.poor++
  }

  // Build assignments per tutor
  const topTutors = [...tutorRows]
    .sort((a, b) => b.totalAssign - a.totalAssign)
    .slice(0, 8)
    .map(t => ({
      label: t.name.split(' ')[0],
      value: t.totalAssign,
    }))

  // Build lesson activity per tutor
  const lessonData = [...tutorRows]
    .sort((a, b) => b.totalLessons - a.totalLessons)
    .slice(0, 8)
    .map(t => ({
      label: t.name.split(' ')[0],
      value: t.totalLessons,
      color: '#3b82f6',
    }))

  // Submission status donut
  const submitted = stats.assignments - stats.missed
  const submissionDonut = [
    { label: 'Completed', value: Math.max(0, submitted), color: '#10b981' },
    { label: 'Missed', value: stats.missed, color: '#ef4444' },
  ]

  // Mock weekly trend (since we don't have historical data, derive from current stats)
  const weekTrend = Array.from({ length: 7 }, (_, i) =>
    Math.max(1, Math.round(stats.learners * (0.6 + Math.random() * 0.4) * ((i + 3) / 9)))
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Assignments per tutor */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] font-semibold text-slate-800">Assignments by Tutor</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Total CBT assignments created</p>
          </div>
        </div>
        {topTutors.length > 0 ? (
          <BarChart data={topTutors} height={160} />
        ) : (
          <p className="text-[12px] text-slate-400 py-8 text-center">No assignment data yet</p>
        )}
      </div>

      {/* Submission status */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-4">
        <p className="text-[13px] font-semibold text-slate-800 mb-1">Submission Status</p>
        <p className="text-[11px] text-slate-400 mb-4">Across all assignments</p>
        {stats.assignments > 0 ? (
          <DonutChart data={submissionDonut} size={130}
            label={String(stats.assignments)} sublabel="total" />
        ) : (
          <p className="text-[12px] text-slate-400 py-8 text-center">No data</p>
        )}
      </div>

      {/* Lessons per tutor */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] font-semibold text-slate-800">Lessons by Tutor</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Total lessons conducted</p>
          </div>
        </div>
        {lessonData.length > 0 ? (
          <BarChart data={lessonData} height={140} />
        ) : (
          <p className="text-[12px] text-slate-400 py-8 text-center">No lesson data yet</p>
        )}
      </div>

      {/* Attendance quality */}
      <div className="bg-white rounded-lg border border-slate-200/60 p-4">
        <p className="text-[13px] font-semibold text-slate-800 mb-1">Attendance Quality</p>
        <p className="text-[11px] text-slate-400 mb-4">Tutor attendance rates</p>
        {tutorRows.length > 0 ? (
          <DonutChart
            data={[
              { label: '80%+', value: attBuckets.excellent, color: '#10b981' },
              { label: '60-79%', value: attBuckets.good, color: '#3b82f6' },
              { label: '40-59%', value: attBuckets.fair, color: '#f59e0b' },
              { label: '<40%', value: attBuckets.poor, color: '#ef4444' },
            ]}
            size={130}
            label={tutorRows.length + ''}
            sublabel="tutors"
          />
        ) : (
          <p className="text-[12px] text-slate-400 py-8 text-center">No data</p>
        )}
      </div>
    </div>
  )
}
