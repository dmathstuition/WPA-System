import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function EducatorMissedPage() {
  const session = await getSession()
  if (!session) return null
  const { data: edu } = await supabaseAdmin.from('educators').select('id').eq('user_id', session.id).single()
  const assignIds = edu ? (await supabaseAdmin.from('assignments').select('id').eq('educator_id', edu.id)).data?.map(a => a.id) ?? [] : []
  const { data: missed } = assignIds.length ? await supabaseAdmin.from('assignment_submissions')
    .select('*, assignments(title, deadline, lessons(subjects(name))), learners(users(name), year_levels(name))')
    .in('assignment_id', assignIds).eq('status', 'missed').order('created_at', { ascending: false }) : { data: [] }

  return (
    <>
      <Topbar user={session} title="Missed Work" subtitle="Learners who did not submit before the deadline" />
      <div className="p-5">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {!missed?.length ? (
            <div className="flex flex-col items-center py-12">
              <CheckCircle size={32} className="text-emerald-400 mb-3" />
              <p className="text-[13px] font-semibold text-emerald-600">No missed assignments!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead><tr>{['Learner','Year','Assignment','Subject','Deadline'].map(h => <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50">{h}</th>)}</tr></thead>
                <tbody>
                  {missed.map((s: any) => (
                    <tr key={s.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{(s.learners as any)?.users?.name ?? '—'}</td>
                      <td className="px-4 py-2.5">{(s.learners as any)?.year_levels?.name ? <Badge variant="info">{(s.learners as any).year_levels.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-2.5 text-slate-600 max-w-[160px] truncate">{(s.assignments as any)?.title ?? '—'}</td>
                      <td className="px-4 py-2.5">{(s.assignments?.lessons as any)?.subjects?.name ? <Badge variant="teal">{(s.assignments.lessons as any).subjects.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-2.5 text-red-500 font-medium whitespace-nowrap">{(s.assignments as any)?.deadline ? formatDate((s.assignments as any).deadline) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
