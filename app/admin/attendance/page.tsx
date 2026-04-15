import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDate, pct } from '@/lib/utils'

export default async function AdminAttendancePage() {
  const session = await getSession()
  const { data: lessons } = await supabaseAdmin.from('lessons')
    .select('id, title, lesson_date, attendance_locked, subjects(name), year_levels(name), class_groups(name)')
    .order('lesson_date', { ascending: false }).limit(50)

  const lessonIds = lessons?.map(l => l.id) ?? []
  const { data: attStats } = lessonIds.length ? await supabaseAdmin.from('attendances')
    .select('lesson_id, status').in('lesson_id', lessonIds) : { data: [] }

  const statsMap = new Map<string, { present: number; total: number }>()
  for (const a of attStats ?? []) {
    const s = statsMap.get(a.lesson_id) ?? { present: 0, total: 0 }
    s.total++
    if (a.status === 'present') s.present++
    statsMap.set(a.lesson_id, s)
  }

  return (
    <>
      <Topbar user={session!} title="Attendance Report" subtitle="Lesson-by-lesson attendance breakdown" />
      <div className="p-5">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {!lessons?.length ? <EmptyState message="No lessons yet." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead><tr>{['Date','Lesson','Year','Group','Subject','Present','Absent','Rate','Status'].map(h => <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {lessons.map((l: any) => {
                    const s = statsMap.get(l.id) ?? { present: 0, total: 0 }
                    const rate = pct(s.present, s.total)
                    const rateColor = rate >= 75 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626'
                    return (
                      <tr key={l.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{formatDate(l.lesson_date)}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[160px] truncate">{l.title}</td>
                        <td className="px-4 py-2.5">{l.year_levels ? <Badge variant="info">{l.year_levels.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                        <td className="px-4 py-2.5">{l.class_groups ? <Badge variant="purple">Arm {l.class_groups.name}</Badge> : <span className="text-slate-400 text-[11px]">1:1</span>}</td>
                        <td className="px-4 py-2.5 text-slate-600">{l.subjects?.name ?? '—'}</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-600">{s.present}</td>
                        <td className="px-4 py-2.5 font-bold text-red-500">{s.total - s.present}</td>
                        <td className="px-4 py-2.5">
                          {s.total > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${rate}%`, background: rateColor }} />
                              </div>
                              <span className="font-bold text-[11px]" style={{ color: rateColor }}>{rate}%</span>
                            </div>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-2.5"><Badge variant={l.attendance_locked ? 'success' : 'warning'}>{l.attendance_locked ? 'Locked' : 'Open'}</Badge></td>
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
