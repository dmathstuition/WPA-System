import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { ClipboardList, Plus, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function EducatorAssignmentsPage() {
  const session = await getSession()
  if (!session) return null

  const { data: edu } = await supabaseAdmin
    .from('educators').select('id').eq('user_id', session.id).single()

  const assignments = edu ? await (async () => {
    const { data } = await supabaseAdmin
      .from('assignments')
      .select('id, title, deadline, is_published, share_url, assignment_type, created_at, lesson_id')
      .eq('educator_id', edu.id)
      .order('created_at', { ascending: false })
    if (!data?.length) return []

    const lessonIds = [...new Set(data.map((a: any) => a.lesson_id).filter(Boolean))]
    const { data: lessons } = lessonIds.length
      ? await supabaseAdmin.from('lessons').select('id, lesson_date, subject_id').in('id', lessonIds)
      : { data: [] }
    const subIds = [...new Set((lessons ?? []).map((l: any) => l.subject_id).filter(Boolean))]
    const { data: subjects } = subIds.length
      ? await supabaseAdmin.from('subjects').select('id, name').in('id', subIds)
      : { data: [] }
    const lMap = new Map((lessons  ?? []).map((l: any) => [l.id, l]))
    const sMap = new Map((subjects ?? []).map((s: any) => [s.id, s]))

    // Submission counts
    const aIds = data.map((a: any) => a.id)
    const { data: subs } = await supabaseAdmin
      .from('assignment_submissions')
      .select('assignment_id, status')
      .in('assignment_id', aIds)
    const subMap = new Map<string, { total: number; submitted: number; missed: number }>()
    for (const s of subs ?? []) {
      if (!subMap.has(s.assignment_id)) subMap.set(s.assignment_id, { total:0, submitted:0, missed:0 })
      const e = subMap.get(s.assignment_id)!
      e.total++
      if (s.status === 'submitted' || s.status === 'scored') e.submitted++
      if (s.status === 'missed') e.missed++
    }

    return data.map((a: any) => {
      const lesson = lMap.get(a.lesson_id)
      return { ...a, lesson_date: lesson?.lesson_date ?? null, subject: sMap.get(lesson?.subject_id) ?? null, subs: subMap.get(a.id) ?? { total:0, submitted:0, missed:0 } }
    })
  })() : []

  const now = new Date()

  return (
    <>
      <Topbar user={session} title="My Assignments" subtitle="Assignments you have created" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[13px] font-bold text-slate-800">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</p>
          <Link href="/educator/assignments/new">
            <Button size="sm"><Plus size={13} /> Create Assignment</Button>
          </Link>
        </div>

        {assignments.length === 0 ? (
          <EmptyState message="No assignments yet. Create one after locking attendance." icon={<ClipboardList size={20} />} />
        ) : (
          <div className="space-y-3">
            {assignments.map((a: any) => {
              const isExpired = a.deadline && new Date(a.deadline) < now
              return (
                <div key={a.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 truncate">{a.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {a.subject && <Badge variant="info">{a.subject.name}</Badge>}
                        {a.lesson_date && <span className="text-[10.5px] text-slate-400">{a.lesson_date}</span>}
                        <Badge variant={a.assignment_type === 'pdf' ? 'teal' : 'purple'}>
                          {a.assignment_type === 'pdf' ? '📄 PDF' : '📝 CBT'}
                        </Badge>
                        <Badge variant={isExpired ? 'destructive' : 'success'}>
                          {isExpired ? 'Closed' : 'Open'}
                        </Badge>
                      </div>
                      {a.deadline && (
                        <p className="text-[10.5px] text-slate-400 mt-1">
                          Due: {new Date(a.deadline).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-slate-700">{a.subs.submitted}/{a.subs.total}</p>
                        <p className="text-[9.5px] text-slate-400">submitted</p>
                      </div>
                      {a.subs.missed > 0 && (
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-red-500">{a.subs.missed}</p>
                          <p className="text-[9.5px] text-slate-400">missed</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Share link */}
                  {a.share_url && (
                    <div className="mt-3 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <p className="text-[10.5px] font-mono text-slate-500 truncate flex-1">{a.share_url}</p>
                      <button
                        onClick={() => { /* handled client-side */ }}
                        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
                        title="Copy link">
                        <Copy size={13} />
                      </button>
                      <a href={a.share_url} target="_blank" rel="noreferrer"
                        className="flex-shrink-0 text-slate-400 hover:text-amber-600 transition">
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
