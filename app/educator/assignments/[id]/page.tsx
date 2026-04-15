import { getSession } from '@/lib/auth'
import { getAssignmentWithQuestions } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatDateTime, pct } from '@/lib/utils'

async function publishAction(id: string, educatorUserId: string) {
  'use server'
  const { publishAssignment } = await import('@/lib/db')
  await publishAssignment(id, educatorUserId)
}

export default async function AssignmentDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return null

  const assignment = await getAssignmentWithQuestions(params.id)
  if (!assignment) return <div className="p-8 text-center text-slate-400">Assignment not found.</div>

  const { data: submissions } = await supabaseAdmin
    .from('assignment_submissions')
    .select('*, learners(users(name), year_levels(name), class_groups(name))')
    .eq('assignment_id', params.id)
    .order('status')

  const subs = submissions ?? []
  const submitted = subs.filter(s => s.status === 'submitted' || s.status === 'scored')
  const missed = subs.filter(s => s.status === 'missed')
  const pending = subs.filter(s => s.status === 'pending')
  const avgScore = submitted.length ? Math.round(submitted.reduce((a, s) => a + pct(s.score ?? 0, s.max_score ?? 1), 0) / submitted.length) : null

  const lesson = assignment.lessons as any
  const questions = assignment.assignment_questions as any[]

  const statusVariant: Record<string,any> = { pending:'warning', submitted:'success', missed:'destructive', scored:'info' }

  return (
    <>
      <Topbar user={session} title={assignment.title} subtitle={lesson?.subjects?.name ?? ''} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <Link href="/educator/assignments" className="inline-flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft size={14} /> Back to Assignments
          </Link>
          {!assignment.is_published && (
            <form action={publishAction.bind(null, params.id, session.id)}>
              <Button type="submit" size="sm">Publish Assignment</Button>
            </form>
          )}
        </div>

        {/* Assignment info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Status', value: assignment.is_published ? 'Published' : 'Draft', color: assignment.is_published ? 'text-emerald-600' : 'text-amber-600' },
            { label: 'Deadline', value: formatDate(assignment.deadline), color: new Date(assignment.deadline) < new Date() ? 'text-red-500' : 'text-slate-800' },
            { label: 'Time Limit', value: assignment.time_limit_mins ? `${assignment.time_limit_mins} min` : 'No limit', color: 'text-slate-800' },
            { label: 'Questions', value: `${questions?.length ?? 0} questions`, color: 'text-slate-800' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
              <p className={`text-[13px] font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        {assignment.is_published && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total', value: subs.length, color: 'text-slate-800' },
              { label: 'Submitted', value: submitted.length, color: 'text-emerald-600' },
              { label: 'Missed', value: missed.length, color: 'text-red-500' },
              { label: 'Avg Score', value: avgScore !== null ? `${avgScore}%` : '—', color: 'text-blue-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
                <p className={`text-[22px] font-black ${color}`}>{value}</p>
                <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Questions */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <p className="text-[13px] font-semibold text-slate-800">Questions ({questions?.length ?? 0})</p>
            </div>
            <div className="p-5 space-y-4">
              {questions?.map((q: any, i: number) => (
                <div key={q.id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-start gap-2.5 mb-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <div>
                      <p className="text-[12.5px] font-semibold text-slate-800">{q.question_text}</p>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">{q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 pl-8">
                    {q.assignment_options?.sort((a: any, b: any) => a.option_key.localeCompare(b.option_key)).map((o: any) => (
                      <div key={o.id} className={`flex items-center gap-2 text-[12px] p-1.5 rounded-lg ${o.is_correct ? 'text-emerald-700 font-semibold bg-emerald-50' : 'text-slate-600'}`}>
                        {o.is_correct ? <CheckCircle size={13} className="text-emerald-600 flex-shrink-0" /> : <XCircle size={13} className="text-slate-300 flex-shrink-0" />}
                        {o.option_key}. {o.option_text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submissions */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <p className="text-[13px] font-semibold text-slate-800">Submissions ({subs.length})</p>
            </div>
            {!subs.length ? (
              <EmptyState message="No submissions yet. Publish the assignment first." />
            ) : (
              <div className="divide-y divide-slate-50">
                {subs.map((s: any) => {
                  const p = s.score !== null && s.max_score ? pct(s.score, s.max_score) : null
                  const color = p !== null ? (p >= 70 ? '#16a34a' : p >= 50 ? '#d97706' : '#dc2626') : '#94a3b8'
                  return (
                    <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-slate-800 truncate">{(s.learners as any)?.users?.name ?? '—'}</p>
                        <p className="text-[10.5px] text-slate-400">{(s.learners as any)?.year_levels?.name ?? ''}</p>
                      </div>
                      {p !== null && <span className="text-[12px] font-bold" style={{ color }}>{s.score}/{s.max_score} ({p}%)</span>}
                      <Badge variant={statusVariant[s.status] ?? 'secondary'}>{s.status}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
