import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClipboardList, CheckCircle, AlertTriangle, TrendingUp, Calendar, User, Users } from 'lucide-react'
import Link from 'next/link'
import { formatDate, pct, gradeFromPct } from '@/lib/utils'

async function getLearnerData(userId: string) {
  // Step 1: get learner row — plain columns only, no joins
  const { data: learner, error: lErr } = await supabaseAdmin
    .from('learners')
    .select('id, user_id, year_level_id, class_group_id, exam_group_id, tutor_id, lesson_type, status')
    .eq('user_id', userId)
    .single()

  if (lErr || !learner) {
    console.error('Learner not found for user_id:', userId, lErr?.message)
    return null
  }

  // Step 2: fetch related data in parallel with safe individual queries
  const [yearRes, groupRes, examRes, tutorEduRes, submissionsRes] = await Promise.all([
    learner.year_level_id
      ? supabaseAdmin.from('year_levels').select('id, name, exam_group_id').eq('id', learner.year_level_id).single()
      : { data: null },
    learner.class_group_id
      ? supabaseAdmin.from('class_groups').select('id, name').eq('id', learner.class_group_id).single()
      : { data: null },
    learner.exam_group_id
      ? supabaseAdmin.from('exam_groups').select('id, name, code').eq('id', learner.exam_group_id).single()
      : { data: null },
    learner.tutor_id
      ? supabaseAdmin.from('educators').select('id, user_id, specialization').eq('id', learner.tutor_id).single()
      : { data: null },
    supabaseAdmin
      .from('assignment_submissions')
      .select('id, status, score, max_score, assignment_id, submitted_at, assignments(id, title, deadline, time_limit_mins)')
      .eq('learner_id', learner.id)
      .order('created_at', { ascending: false }),
  ])

  // Get year level's exam group if learner doesn't have one directly
  const yearExamGroupId = yearRes.data?.exam_group_id
  const effectiveExamId = learner.exam_group_id || yearExamGroupId
  let examGroup = examRes.data
  if (!examGroup && effectiveExamId && effectiveExamId !== learner.exam_group_id) {
    const { data: eg } = await supabaseAdmin.from('exam_groups').select('id, name, code').eq('id', effectiveExamId).single()
    examGroup = eg
  }

  // Get tutor's user name
  let tutorName: string | null = null
  if (tutorEduRes.data?.user_id) {
    const { data: tutorUser } = await supabaseAdmin.from('users').select('name').eq('id', tutorEduRes.data.user_id).single()
    tutorName = tutorUser?.name ?? null
  }

  const submissions = submissionsRes.data ?? []
  const pending   = submissions.filter(s => s.status === 'pending')
  const submitted = submissions.filter(s => s.status === 'submitted' || s.status === 'scored')
  const missed    = submissions.filter(s => s.status === 'missed')
  const avgScore  = submitted.length
    ? Math.round(submitted.reduce((a, s) => a + pct(s.score ?? 0, s.max_score ?? 1), 0) / submitted.length)
    : null

  return {
    learner,
    yearLevel:  yearRes.data,
    classGroup: groupRes.data,
    examGroup,
    tutorName,
    submissions,
    pending,
    submitted,
    missed,
    avgScore,
  }
}

export default async function LearnerDashboard() {
  const session = await getSession()
  if (!session) return null

  const data = await getLearnerData(session.id)

  if (!data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center p-8">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Users size={24} className="text-slate-400" />
        </div>
        <p className="text-[14px] font-semibold text-slate-700 mb-1">Profile not set up yet</p>
        <p className="text-[12px] text-slate-400">Contact your administrator to complete your account setup.</p>
      </div>
    </div>
  )

  const { learner, yearLevel, classGroup, examGroup, tutorName, pending, submitted, missed, avgScore, submissions } = data
  const isOTO = learner.lesson_type === 'one_to_one'
  const hour  = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <Topbar user={session} title="My Dashboard" subtitle={`Good ${greeting}, ${session.name.split(' ')[0]}`} />
      <div className="p-5 space-y-5">

        {/* Class / type banner */}
        <div className="rounded-2xl p-5 text-white flex items-start justify-between flex-wrap gap-4"
          style={{ background: isOTO
            ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
            : 'linear-gradient(135deg,#f59e0b,#ea580c)' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                {isOTO ? <User size={13} /> : <Users size={13} />}
              </div>
              <span className="text-[11px] font-bold opacity-70 uppercase tracking-widest">
                {isOTO ? 'One-to-One Learning' : 'General Class'}
              </span>
            </div>
            <p className="text-[20px] font-black leading-tight">
              {isOTO
                ? (examGroup?.name ? examGroup.name + ' Preparation' : 'Private Tuition')
                : (yearLevel?.name ?? '—') + (classGroup?.name ? ' · Arm ' + classGroup.name : '')}
            </p>
            {isOTO && tutorName && (
              <p className="text-[12px] opacity-80 mt-1.5">Tutor: {tutorName}</p>
            )}
            {examGroup && (
              <p className="text-[11.5px] opacity-70 mt-1">
                {isOTO ? 'Exam: ' : 'Exam Group: '}{examGroup.name}{examGroup.code ? ' (' + examGroup.code + ')' : ''}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[11px] opacity-60">Today</p>
            <p className="text-[13px] font-bold">{new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'short' })}</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Pending Tests"  value={pending.length}   sub="Complete before deadline"  icon={ClipboardList} color="amber" />
          <StatCard label="Submitted"      value={submitted.length} sub="Tests completed"            icon={CheckCircle}  color="green" />
          <StatCard label="Missed"         value={missed.length}    sub="Deadline passed"            icon={AlertTriangle} color="red" />
          <StatCard label="Avg Score"
            value={avgScore !== null ? avgScore + '%' : '—'}
            sub={avgScore !== null ? 'Grade ' + gradeFromPct(avgScore) : 'No scores yet'}
            icon={TrendingUp} color="blue" />
        </div>

        {/* Pending tests — urgent */}
        {pending.length > 0 && (
          <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-amber-800">⏰ Pending Tests ({pending.length})</p>
              <Link href="/learner/assignments" className="text-[11.5px] text-amber-600 font-medium hover:text-amber-700">View all →</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {pending.map((s: any) => {
                const deadline = new Date(s.assignments?.deadline)
                const overdue  = deadline < new Date()
                const urgent   = !overdue && deadline.getTime() - Date.now() < 86400000
                return (
                  <div key={s.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-slate-800 truncate">{s.assignments?.title ?? '—'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Due:{' '}
                        <span className={overdue ? 'text-red-500 font-bold' : urgent ? 'text-amber-600 font-semibold' : ''}>
                          {s.assignments?.deadline ? formatDate(s.assignments.deadline) : '—'}
                        </span>
                        {s.assignments?.time_limit_mins ? ' · ' + s.assignments.time_limit_mins + ' min' : ''}
                      </p>
                    </div>
                    {overdue
                      ? <Badge variant="destructive">Overdue</Badge>
                      : (
                        <Link href={'/learner/take-test/' + s.assignment_id} className="flex-shrink-0">
                          <Button size="sm">Start Test</Button>
                        </Link>
                      )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Missed work alert */}
        {missed.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-[12.5px] text-red-700 font-medium">
                You have <strong>{missed.length}</strong> missed assignment{missed.length !== 1 ? 's' : ''}.
              </p>
            </div>
            <Link href="/learner/missed" className="text-[11.5px] text-red-600 font-semibold hover:text-red-700">View →</Link>
          </div>
        )}

        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-slate-800">Recent Activity</p>
            <Link href="/learner/assignments" className="text-[11.5px] text-amber-600 font-medium hover:text-amber-700">All assignments →</Link>
          </div>
          {submissions.length === 0 ? (
            <EmptyState message="No assignments yet — check back after your next lesson." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr>
                    {['Assignment','Deadline','Score','Status'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 8).map((s: any) => {
                    const score = s.score !== null && s.max_score ? pct(s.score, s.max_score) : null
                    const statusV: Record<string,any> = { pending:'warning', submitted:'success', missed:'destructive', scored:'info' }
                    const scoreColor = score !== null ? (score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626') : '#94a3b8'
                    return (
                      <tr key={s.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[180px] truncate">{s.assignments?.title ?? '—'}</td>
                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                          {s.assignments?.deadline ? formatDate(s.assignments.deadline) : '—'}
                        </td>
                        <td className="px-4 py-2.5 font-bold" style={{ color: scoreColor }}>
                          {score !== null ? score + '% (' + gradeFromPct(score) + ')' : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={statusV[s.status] ?? 'secondary'}>{s.status}</Badge>
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
