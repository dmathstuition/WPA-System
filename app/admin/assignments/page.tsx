import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ClipboardList } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AdminAssignmentsPage() {
  const session = await getSession()
  const { data: assignments } = await supabaseAdmin.from('assignments')
    .select('*, educators(users(name)), lessons(title, lesson_date, subjects(name), year_levels(name), class_groups(name)), assignment_questions(count)')
    .order('created_at', { ascending: false })

  const { data: subStats } = await supabaseAdmin.from('assignment_submissions')
    .select('assignment_id, status')

  const statsMap = new Map<string, { submitted: number; missed: number; total: number }>()
  for (const s of subStats ?? []) {
    const m = statsMap.get(s.assignment_id) ?? { submitted: 0, missed: 0, total: 0 }
    m.total++
    if (s.status === 'submitted' || s.status === 'scored') m.submitted++
    if (s.status === 'missed') m.missed++
    statsMap.set(s.assignment_id, m)
  }

  return (
    <>
      <Topbar user={session!} title="Assignments" subtitle="All CBT assignments across all educators" />
      <div className="p-5">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {!assignments?.length ? <EmptyState message="No assignments yet." icon={<ClipboardList size={20} />} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead><tr>{['Title','Educator','Subject','Year','Deadline','Questions','Submitted','Missed','Status'].map(h => <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {assignments.map((a: any) => {
                    const s = statsMap.get(a.id) ?? { submitted: 0, missed: 0, total: 0 }
                    return (
                      <tr key={a.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[150px] truncate">{a.title}</td>
                        <td className="px-4 py-2.5 text-slate-500">{(a.educators as any)?.users?.name ?? '—'}</td>
                        <td className="px-4 py-2.5">{(a.lessons as any)?.subjects?.name ? <Badge variant="teal">{(a.lessons as any).subjects.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                        <td className="px-4 py-2.5">{(a.lessons as any)?.year_levels?.name ? <Badge variant="info">{(a.lessons as any).year_levels.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: new Date(a.deadline) < new Date() ? '#dc2626' : '#374151' }}>{formatDate(a.deadline)}</td>
                        <td className="px-4 py-2.5 text-center font-bold">{Array.isArray(a.assignment_questions) ? a.assignment_questions.length : 0}</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-600">{s.submitted}/{s.total}</td>
                        <td className="px-4 py-2.5">{s.missed > 0 ? <Badge variant="destructive">{s.missed} missed</Badge> : <span className="text-slate-400">—</span>}</td>
                        <td className="px-4 py-2.5"><Badge variant={a.is_published ? 'success' : 'warning'}>{a.is_published ? 'Published' : 'Draft'}</Badge></td>
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
