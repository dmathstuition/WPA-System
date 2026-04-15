import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AdminMissedPage() {
  const session = await getSession()
  const { data: missed } = await supabaseAdmin.from('assignment_submissions')
    .select('*, assignments(title, deadline, lessons(subjects(name), year_levels(name))), learners(users(name), year_levels(name), class_groups(name))')
    .eq('status', 'missed').order('created_at', { ascending: false })

  return (
    <>
      <Topbar user={session!} title="Missed Work" subtitle="All assignments not submitted before deadline" />
      <div className="p-5">
        {(missed?.length ?? 0) > 0 && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
            <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
            <p className="text-[12.5px] text-red-700 font-medium">{missed!.length} missed submission{missed!.length !== 1 ? 's' : ''} across all assignments.</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {!missed?.length ? (
            <div className="flex flex-col items-center py-12 text-center">
              <CheckCircle size={32} className="text-emerald-400 mb-3" />
              <p className="text-[13px] font-semibold text-emerald-600">No missed assignments!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead><tr>{['Learner','Year','Arm','Assignment','Subject','Deadline'].map(h => <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {missed.map((s: any) => (
                    <tr key={s.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{(s.learners as any)?.users?.name ?? '—'}</td>
                      <td className="px-4 py-2.5">{(s.learners as any)?.year_levels ? <Badge variant="info">{(s.learners as any).year_levels.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-2.5">{(s.learners as any)?.class_groups ? <Badge variant="purple">Arm {(s.learners as any).class_groups.name}</Badge> : <span className="text-slate-400">—</span>}</td>
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
