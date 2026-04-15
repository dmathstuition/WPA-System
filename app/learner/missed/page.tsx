import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function LearnerMissedPage() {
  const session = await getSession()
  if (!session) return null
  const { data: learner } = await supabaseAdmin.from('learners').select('id').eq('user_id', session.id).single()
  const { data: missed } = learner ? await supabaseAdmin.from('assignment_submissions')
    .select('*, assignments(title, deadline, lessons(subjects(name), year_levels(name)))')
    .eq('learner_id', learner.id).eq('status', 'missed')
    .order('created_at', { ascending: false }) : { data: [] }

  return (
    <>
      <Topbar user={session} title="Missed Work" subtitle="Assignments you did not submit before the deadline" />
      <div className="p-5">
        {(missed?.length ?? 0) > 0 && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
            <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
            <p className="text-[12.5px] text-red-700 font-medium">{missed!.length} missed assignment{missed!.length > 1 ? 's' : ''} — these cannot be retaken.</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {!missed?.length ? (
            <div className="flex flex-col items-center py-12 text-center">
              <CheckCircle size={32} className="text-emerald-400 mb-3" />
              <p className="text-[13px] font-semibold text-emerald-600">No missed assignments!</p>
              <p className="text-[11.5px] text-slate-400 mt-1">Keep it up — submit all tests before the deadline.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead><tr>{['Assignment','Subject','Year','Deadline'].map(h => <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50">{h}</th>)}</tr></thead>
                <tbody>
                  {missed.map((s: any) => (
                    <tr key={s.id} className="border-t border-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{s.assignments?.title}</td>
                      <td className="px-4 py-2.5"><Badge variant="teal">{(s.assignments?.lessons as any)?.subjects?.name ?? '—'}</Badge></td>
                      <td className="px-4 py-2.5"><Badge variant="info">{(s.assignments?.lessons as any)?.year_levels?.name ?? '—'}</Badge></td>
                      <td className="px-4 py-2.5 text-red-500 font-medium whitespace-nowrap">{formatDate(s.assignments?.deadline)}</td>
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
