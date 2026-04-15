import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function LearnerAssignmentsPage({ searchParams }: { searchParams: { filter?: string } }) {
  const session = await getSession()
  if (!session) return null
  const { data: learner } = await supabaseAdmin.from('learners').select('id').eq('user_id', session.id).single()
  const { data: subs } = learner ? await supabaseAdmin.from('assignment_submissions')
    .select('*, assignments(id, title, deadline, time_limit_mins, is_published, lessons(subjects(name), year_levels(name)))')
    .eq('learner_id', learner.id).order('created_at', { ascending: false }) : { data: [] }

  const filter = searchParams.filter ?? 'all'
  const all = subs ?? []
  const filtered = filter === 'all' ? all : all.filter(s => s.status === filter)

  const statusVariant: Record<string, any> = { pending: 'warning', submitted: 'success', missed: 'destructive', scored: 'info' }
  const tabs = [['all','All'],['pending','Pending'],['submitted','Submitted'],['missed','Missed']]

  return (
    <>
      <Topbar user={session} title="My Assignments" subtitle="All your CBT assignments" />
      <div className="p-5">
        <div className="flex flex-wrap gap-2 mb-5">
          {tabs.map(([val, label]) => (
            <Link key={val} href={`?filter=${val}`}
              className={`px-4 py-1.5 rounded-full text-[11.5px] font-semibold transition border ${filter === val ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'}`}>
              {label}
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? <EmptyState message="No assignments in this category." icon={<ClipboardList size={20} />} /> : (
            <div className="divide-y divide-slate-50">
              {filtered.map((s: any) => {
                const isPending = s.status === 'pending'
                const deadline = new Date(s.assignments?.deadline)
                const overdue = deadline < new Date()
                return (
                  <div key={s.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-slate-800 truncate">{s.assignments?.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {(s.assignments?.lessons as any)?.subjects?.name ?? '—'} ·
                        Due <span className={overdue && isPending ? 'text-red-500 font-medium' : ''}>{formatDate(s.assignments?.deadline)}</span>
                        {s.assignments?.time_limit_mins && ` · ${s.assignments.time_limit_mins} min`}
                      </p>
                    </div>
                    <Badge variant={statusVariant[s.status] ?? 'secondary'}>{s.status}</Badge>
                    {isPending && !overdue && (
                      <Link href={`/learner/take-test/${s.assignment_id}`}>
                        <Button size="sm">Start Test</Button>
                      </Link>
                    )}
                    {(s.status === 'submitted' || s.status === 'scored') && (
                      <Link href={`/learner/result/${s.id}`}>
                        <Button size="sm" variant="outline">View Result</Button>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
