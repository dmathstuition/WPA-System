import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { TrendingUp } from 'lucide-react'
import { formatDate, pct, gradeFromPct } from '@/lib/utils'

export default async function ScoresPage() {
  const session = await getSession()
  if (!session) return null
  const { data: learner } = await supabaseAdmin.from('learners').select('id').eq('user_id', session.id).single()
  const { data: subs } = learner ? await supabaseAdmin.from('assignment_submissions')
    .select('*, assignments(title, deadline, lessons(subjects(name), year_levels(name)))')
    .eq('learner_id', learner.id).eq('status', 'submitted')
    .order('submitted_at', { ascending: false }) : { data: [] }

  const scores = subs ?? []
  const avg = scores.length ? Math.round(scores.reduce((a, s) => a + pct(s.score ?? 0, s.max_score ?? 1), 0) / scores.length) : null

  return (
    <>
      <Topbar user={session} title="My Scores" subtitle="All completed assessments and results" />
      <div className="p-5">
        {avg !== null && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 mb-5 text-white flex items-center gap-5">
            <div className="text-center">
              <p className="text-[36px] font-black leading-none">{avg}%</p>
              <p className="text-[11px] opacity-70 mt-1">Overall Average</p>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-3 text-center">
              <div><p className="text-[20px] font-bold">{scores.length}</p><p className="text-[10px] opacity-70">Tests Taken</p></div>
              <div><p className="text-[20px] font-bold">{scores.filter(s => pct(s.score??0,s.max_score??1)>=70).length}</p><p className="text-[10px] opacity-70">Passed</p></div>
              <div><p className="text-[20px] font-bold">{gradeFromPct(avg)}</p><p className="text-[10px] opacity-70">Grade</p></div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {scores.length === 0 ? <EmptyState message="No completed tests yet." icon={<TrendingUp size={20} />} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead><tr>{['Assignment','Subject','Year','Submitted','Score','%','Grade'].map(h => <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {scores.map((s: any) => {
                    const p = pct(s.score ?? 0, s.max_score ?? 1)
                    const g = gradeFromPct(p)
                    const color = p >= 70 ? '#16a34a' : p >= 50 ? '#d97706' : '#dc2626'
                    return (
                      <tr key={s.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[160px] truncate">{s.assignments?.title}</td>
                        <td className="px-4 py-2.5"><Badge variant="teal">{(s.assignments?.lessons as any)?.subjects?.name ?? '—'}</Badge></td>
                        <td className="px-4 py-2.5"><Badge variant="info">{(s.assignments?.lessons as any)?.year_levels?.name ?? '—'}</Badge></td>
                        <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{s.submitted_at ? formatDate(s.submitted_at) : '—'}</td>
                        <td className="px-4 py-2.5 font-bold" style={{ color }}>{s.score}/{s.max_score}</td>
                        <td className="px-4 py-2.5 font-bold" style={{ color }}>{p}%</td>
                        <td className="px-4 py-2.5"><span className="font-black text-[13px]" style={{ color }}>{g}</span></td>
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
