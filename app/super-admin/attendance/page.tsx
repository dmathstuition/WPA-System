import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { Calendar, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { pct } from '@/lib/utils'

function fmt(d: string) {
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

export default async function SuperAdminAttendancePage() {
  const session = await getSession()

  // Get all lessons with attendance counts
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('id, title, lesson_date, lesson_type, attendance_locked, subjects(name), year_levels(name, exam_groups(name)), class_groups(name), lesson_educators(educators(users(name)))')
    .order('lesson_date', { ascending: false })
    .limit(100)

  // Get all attendance records
  const lessonIds = (lessons ?? []).map((l: any) => l.id)
  const { data: allAttendance } = lessonIds.length
    ? await supabaseAdmin.from('attendances').select('lesson_id, status').in('lesson_id', lessonIds)
    : { data: [] }

  // Build stats per lesson
  type LessonStat = { present: number; absent: number; total: number }
  const statsMap = new Map<string, LessonStat>()
  for (const a of allAttendance ?? []) {
    const s = statsMap.get(a.lesson_id) ?? { present: 0, absent: 0, total: 0 }
    s.total++
    if (a.status === 'present') s.present++
    else s.absent++
    statsMap.set(a.lesson_id, s)
  }

  // Academy-wide totals
  const totalPresent  = Array.from(statsMap.values()).reduce((s, r) => s + r.present, 0)
  const totalAbsent   = Array.from(statsMap.values()).reduce((s, r) => s + r.absent, 0)
  const totalMarked   = totalPresent + totalAbsent
  const overallRate   = pct(totalPresent, totalMarked)
  const lockedLessons = (lessons ?? []).filter((l: any) => l.attendance_locked).length

  // Per year level breakdown
  type YearStat = { name: string; present: number; total: number }
  const yearMap = new Map<string, YearStat>()
  for (const l of lessons ?? []) {
    const yl = (l as any).year_levels?.name ?? 'Unknown'
    const s  = statsMap.get(l.id)
    if (!s) continue
    const y = yearMap.get(yl) ?? { name: yl, present: 0, total: 0 }
    y.present += s.present
    y.total   += s.total
    yearMap.set(yl, y)
  }
  const yearStats = Array.from(yearMap.values()).sort((a, b) => b.total - a.total)

  return (
    <>
      <Topbar user={session!} title="Attendance Trends" subtitle="Academy-wide attendance analysis across all lessons" />
      <div className="p-5 space-y-5">

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Overall Attendance Rate" value={totalMarked > 0 ? overallRate + '%' : '—'} sub="Across all lessons" icon={TrendingUp} color="green" />
          <StatCard label="Total Present" value={totalPresent} sub="All time" icon={CheckCircle} color="green" />
          <StatCard label="Total Absent" value={totalAbsent} sub="All time" icon={XCircle} color="red" />
          <StatCard label="Lessons Locked" value={lockedLessons} sub={"of " + (lessons?.length ?? 0) + " total"} icon={Calendar} color="amber" />
        </div>

        {/* Year level breakdown */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-4">Attendance by Year Level</p>
          {yearStats.length === 0
            ? <p className="text-[12px] text-slate-400 text-center py-6">No attendance data yet</p>
            : (
              <div className="space-y-4">
                {yearStats.map(y => {
                  const rate = pct(y.present, y.total)
                  const barColor = rate >= 75 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626'
                  return (
                    <div key={y.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12.5px] font-semibold text-slate-700">{y.name}</span>
                        <div className="flex items-center gap-3 text-[11.5px]">
                          <span className="text-emerald-600 font-medium">{y.present} present</span>
                          <span className="text-red-500 font-medium">{y.total - y.present} absent</span>
                          <span className="font-bold" style={{ color: barColor }}>{rate}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: rate + '%', background: barColor }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </div>

        {/* Lesson-by-lesson table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="text-[13px] font-semibold text-slate-800">Lesson-by-Lesson Attendance</p>
          </div>
          {!lessons?.length
            ? <EmptyState message="No lessons yet." icon={<Calendar size={20} />} />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr>
                      {['Date','Lesson','Educator','Year','Group','Exam','Present','Absent','Rate','Status'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((l: any) => {
                      const s    = statsMap.get(l.id) ?? { present: 0, absent: 0, total: 0 }
                      const rate = pct(s.present, s.total)
                      const rc   = rate >= 75 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626'
                      const eduName = l.lesson_educators?.[0]?.educators?.users?.name ?? '—'
                      const examName = l.year_levels?.exam_groups?.name
                      return (
                        <tr key={l.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{fmt(l.lesson_date)}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[140px] truncate">{l.title}</td>
                          <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{eduName}</td>
                          <td className="px-4 py-2.5">{l.year_levels ? <Badge variant="info">{l.year_levels.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                          <td className="px-4 py-2.5">{l.class_groups ? <Badge variant="purple">Arm {l.class_groups.name}</Badge> : <span className="text-slate-400 text-[11px]">{l.lesson_type === 'one_to_one' ? '1:1' : 'All'}</span>}</td>
                          <td className="px-4 py-2.5">{examName ? <Badge variant="warning">{examName}</Badge> : <span className="text-slate-400">—</span>}</td>
                          <td className="px-4 py-2.5 font-bold text-emerald-600">{s.present}</td>
                          <td className="px-4 py-2.5 font-bold text-red-500">{s.absent}</td>
                          <td className="px-4 py-2.5">
                            {s.total > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: rate + '%', background: rc }} />
                                </div>
                                <span className="font-bold text-[11px]" style={{ color: rc }}>{rate}%</span>
                              </div>
                            ) : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant={l.attendance_locked ? 'success' : 'warning'}>
                              {l.attendance_locked ? 'Locked' : 'Open'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    </>
  )
}
