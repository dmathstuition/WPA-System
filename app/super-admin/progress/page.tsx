import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { TrendingUp, Users, CheckCircle, AlertTriangle, ClipboardList } from 'lucide-react'
import { pct, gradeFromPct } from '@/lib/utils'

export default async function SuperAdminProgressPage() {
  const session = await getSession()

  // All submissions with learner and assignment details
  const { data: submissions } = await supabaseAdmin
    .from('assignment_submissions')
    .select('id, status, score, max_score, submitted_at, learner_id, assignment_id, learners(users(name), year_levels(name, exam_groups(name)), class_groups(name)), assignments(title, deadline, lessons(subjects(name)))')
    .order('submitted_at', { ascending: false })

  const all        = submissions ?? []
  const submitted  = all.filter(s => s.status === 'submitted' || s.status === 'scored')
  const missed     = all.filter(s => s.status === 'missed')
  const pending    = all.filter(s => s.status === 'pending')

  // Academy average
  const scoredSubs = submitted.filter(s => s.score !== null && s.max_score)
  const avgScore   = scoredSubs.length
    ? Math.round(scoredSubs.reduce((a, s) => a + pct(s.score ?? 0, s.max_score ?? 1), 0) / scoredSubs.length)
    : null

  // Per year level performance
  type YearPerf = { name: string; submitted: number; missed: number; total: number; totalPct: number; count: number }
  const yearMap = new Map<string, YearPerf>()
  for (const s of all) {
    const yl = (s.learners as any)?.year_levels?.name ?? 'Unknown'
    const y  = yearMap.get(yl) ?? { name: yl, submitted: 0, missed: 0, total: 0, totalPct: 0, count: 0 }
    y.total++
    if (s.status === 'submitted' || s.status === 'scored') {
      y.submitted++
      if (s.score !== null && s.max_score) { y.totalPct += pct(s.score, s.max_score); y.count++ }
    }
    if (s.status === 'missed') y.missed++
    yearMap.set(yl, y)
  }
  const yearPerf = Array.from(yearMap.values()).sort((a, b) => b.total - a.total)

  // Per learner performance (top + bottom)
  type LearnerPerf = { id: string; name: string; year: string; group: string; exam: string; submitted: number; missed: number; avg: number | null; count: number }
  const learnerMap = new Map<string, LearnerPerf>()
  for (const s of all) {
    const lid  = s.learner_id
    const info = s.learners as any
    const existing = learnerMap.get(lid) ?? {
      id: lid,
      name:  info?.users?.name ?? '—',
      year:  info?.year_levels?.name ?? '—',
      group: info?.class_groups?.name ?? '',
      exam:  info?.year_levels?.exam_groups?.name ?? '',
      submitted: 0, missed: 0, avg: null, count: 0
    }
    if (s.status === 'submitted' || s.status === 'scored') {
      existing.submitted++
      if (s.score !== null && s.max_score) {
        const prev = existing.avg ?? 0
        existing.avg = Math.round((prev * existing.count + pct(s.score, s.max_score)) / (existing.count + 1))
        existing.count++
      }
    }
    if (s.status === 'missed') existing.missed++
    learnerMap.set(lid, existing)
  }
  const allLearners = Array.from(learnerMap.values())
  const topLearners = [...allLearners].filter(l => l.avg !== null).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0)).slice(0, 10)
  const atRisk      = [...allLearners].filter(l => l.missed > 0 || (l.avg !== null && l.avg < 50)).sort((a, b) => b.missed - a.missed).slice(0, 10)

  return (
    <>
      <Topbar user={session!} title="Learner Progress" subtitle="Academy-wide performance and progress tracking" />
      <div className="p-5 space-y-5">

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Academy Average" value={avgScore !== null ? avgScore + '%' : '—'} sub={avgScore !== null ? 'Grade ' + gradeFromPct(avgScore) : 'No scores yet'} icon={TrendingUp} color="blue" />
          <StatCard label="Submitted" value={submitted.length} sub="Completed tests" icon={CheckCircle} color="green" />
          <StatCard label="Missed" value={missed.length} sub="Not submitted" icon={AlertTriangle} color="red" />
          <StatCard label="Pending" value={pending.length} sub="Not yet taken" icon={ClipboardList} color="amber" />
        </div>

        {/* Year level performance */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-4">Performance by Year Level</p>
          {yearPerf.length === 0
            ? <p className="text-[12px] text-slate-400 text-center py-6">No submission data yet</p>
            : (
              <div className="space-y-4">
                {yearPerf.map(y => {
                  const compRate = pct(y.submitted, y.total)
                  const avgPct   = y.count > 0 ? Math.round(y.totalPct / y.count) : null
                  const barColor = compRate >= 75 ? '#16a34a' : compRate >= 50 ? '#d97706' : '#dc2626'
                  return (
                    <div key={y.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12.5px] font-semibold text-slate-700">{y.name}</span>
                        <div className="flex items-center gap-3 text-[11.5px]">
                          {avgPct !== null && (
                            <span className="font-bold text-blue-600">Avg: {avgPct}%</span>
                          )}
                          {y.missed > 0 && (
                            <span className="text-red-500 font-medium">{y.missed} missed</span>
                          )}
                          <span className="font-bold" style={{ color: barColor }}>{compRate}% complete</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: compRate + '%', background: barColor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Top performers */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <p className="text-[13px] font-semibold text-slate-800">Top Performers</p>
            </div>
            {topLearners.length === 0
              ? <EmptyState message="No scores yet." />
              : (
                <div className="divide-y divide-slate-50">
                  {topLearners.map((l, i) => {
                    const color = (l.avg ?? 0) >= 70 ? '#16a34a' : (l.avg ?? 0) >= 50 ? '#d97706' : '#dc2626'
                    return (
                      <div key={l.id} className="px-5 py-3 flex items-center gap-3">
                        <span className="text-[14px] font-black text-amber-500 w-6 flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-semibold text-slate-800 truncate">{l.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {l.year && <Badge variant="info" style={{ fontSize: '9px', padding: '1px 5px' }}>{l.year}</Badge>}
                            {l.group && <Badge variant="purple" style={{ fontSize: '9px', padding: '1px 5px' }}>Arm {l.group}</Badge>}
                            {l.exam && <Badge variant="warning" style={{ fontSize: '9px', padding: '1px 5px' }}>{l.exam}</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[16px] font-black" style={{ color }}>{l.avg}%</span>
                          <p className="text-[10px] text-slate-400">{l.submitted} tests</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
          </div>

          {/* At-risk learners */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" />
              <p className="text-[13px] font-semibold text-red-700">At-Risk Learners</p>
            </div>
            {atRisk.length === 0
              ? (
                <div className="flex flex-col items-center py-10">
                  <CheckCircle size={28} className="text-emerald-400 mb-2" />
                  <p className="text-[12.5px] font-semibold text-emerald-600">No at-risk learners</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {atRisk.map(l => (
                    <div key={l.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-slate-800 truncate">{l.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {l.year && <Badge variant="info" style={{ fontSize: '9px', padding: '1px 5px' }}>{l.year}</Badge>}
                          {l.exam && <Badge variant="warning" style={{ fontSize: '9px', padding: '1px 5px' }}>{l.exam}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {l.missed > 0 && <Badge variant="destructive">{l.missed} missed</Badge>}
                        {l.avg !== null && (
                          <span className="text-[13px] font-bold" style={{ color: (l.avg ?? 0) < 50 ? '#dc2626' : '#d97706' }}>{l.avg}%</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

        </div>

        {/* Full submissions table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="text-[13px] font-semibold text-slate-800">All Submissions</p>
          </div>
          {all.length === 0
            ? <EmptyState message="No submissions yet." icon={<ClipboardList size={20} />} />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr>
                      {['Learner', 'Year', 'Exam', 'Assignment', 'Subject', 'Score', 'Status'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {all.slice(0, 50).map((s: any) => {
                      const p = s.score !== null && s.max_score ? pct(s.score, s.max_score) : null
                      const color = p !== null ? (p >= 70 ? '#16a34a' : p >= 50 ? '#d97706' : '#dc2626') : '#94a3b8'
                      const statusVariant: Record<string,any> = { pending:'warning', submitted:'success', missed:'destructive', scored:'info' }
                      const learnerInfo = s.learners as any
                      return (
                        <tr key={s.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{learnerInfo?.users?.name ?? '—'}</td>
                          <td className="px-4 py-2.5">{learnerInfo?.year_levels?.name ? <Badge variant="info">{learnerInfo.year_levels.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                          <td className="px-4 py-2.5">{learnerInfo?.year_levels?.exam_groups?.name ? <Badge variant="warning">{learnerInfo.year_levels.exam_groups.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                          <td className="px-4 py-2.5 text-slate-600 max-w-[140px] truncate">{(s.assignments as any)?.title ?? '—'}</td>
                          <td className="px-4 py-2.5">{(s.assignments as any)?.lessons?.subjects?.name ? <Badge variant="teal">{(s.assignments as any).lessons.subjects.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                          <td className="px-4 py-2.5 font-bold" style={{ color }}>
                            {p !== null ? s.score + '/' + s.max_score + ' (' + p + '%)' : '—'}
                          </td>
                          <td className="px-4 py-2.5"><Badge variant={statusVariant[s.status] ?? 'secondary'}>{s.status}</Badge></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {all.length > 50 && (
                  <p className="px-5 py-3 text-[11.5px] text-slate-400 border-t border-slate-50">
                    Showing 50 of {all.length} submissions
                  </p>
                )}
              </div>
            )}
        </div>

      </div>
    </>
  )
}
