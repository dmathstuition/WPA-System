import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { pct, formatDate } from '@/lib/utils'

export default async function EducatorSubmissionsPage() {
  const session = await getSession()
  if (!session) return null
  const { data: edu } = await supabaseAdmin.from('educators').select('id').eq('user_id', session.id).single()
  const { data: subs } = edu ? await supabaseAdmin.from('assignment_submissions')
    .select('*, assignments(title, deadline, lessons(subjects(name), year_levels(name))), learners(users(name))')
    .in('assignment_id', (await supabaseAdmin.from('assignments').select('id').eq('educator_id', edu.id)).data?.map(a => a.id) ?? [])
    .order('created_at', { ascending: false }) : { data: [] }

  const statusVariant: Record<string,any> = { pending:'warning', submitted:'success', missed:'destructive', scored:'info' }

  return (
    <>
      <Topbar user={session} title="Submissions" subtitle="All learner submissions across your assignments" />
      <div className="p-5">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {!subs?.length ? <EmptyState message="No submissions yet." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead><tr>{['Learner','Assignment','Subject','Score','Status','Submitted'].map(h => <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {subs.map((s: any) => {
                    const p = s.score !== null && s.max_score ? pct(s.score, s.max_score) : null
                    const color = p !== null ? (p >= 70 ? '#16a34a' : p >= 50 ? '#d97706' : '#dc2626') : '#94a3b8'
                    return (
                      <tr key={s.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{(s.learners as any)?.users?.name ?? '—'}</td>
                        <td className="px-4 py-2.5 text-slate-500 max-w-[160px] truncate">{(s.assignments as any)?.title ?? '—'}</td>
                        <td className="px-4 py-2.5">{(s.assignments?.lessons as any)?.subjects?.name ? <Badge variant="teal">{(s.assignments.lessons as any).subjects.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                        <td className="px-4 py-2.5 font-bold" style={{ color }}>{p !== null ? `${s.score}/${s.max_score} (${p}%)` : '—'}</td>
                        <td className="px-4 py-2.5"><Badge variant={statusVariant[s.status] ?? 'secondary'}>{s.status}</Badge></td>
                        <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{s.submitted_at ? formatDate(s.submitted_at) : '—'}</td>
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
