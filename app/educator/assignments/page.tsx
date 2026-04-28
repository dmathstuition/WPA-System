'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { ClipboardList, Plus, Copy, Check, ExternalLink, ChevronDown, ChevronUp, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { ScoreSummary } from '@/components/shared/score-summary'
import { fetchArray, postJSON } from '@/lib/fetch'

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scored:    { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
  submitted: { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Submitted' },
  pending:   { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Pending' },
  missed:    { bg: 'bg-red-100',     text: 'text-red-600',     label: 'Missed' },
}

export default function AssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [copied, setCopied]           = useState('')
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [deleting, setDeleting]       = useState('')

  function load() {
    setLoading(true)
    fetchArray('/api/educator/assignments').then(data => {
      setAssignments(data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  function copyLink(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(''), 2000)
  }

  async function deleteAssignment(id: string) {
    if (!confirm('Delete this assignment? Submission records will be removed but the stats have been captured.')) return
    setDeleting(id)
    const { ok, data } = await postJSON('/api/educator/assignments', { id }, 'DELETE')
    if (ok) {
      load()
      setExpanded(null)
    } else {
      alert(data?.error ?? 'Cannot delete')
    }
    setDeleting('')
  }

  const now = new Date()

  return (
    <>
      <Topbar user={{ id:'', name:'Educator', email:'', role:'educator' }}
              title="My Assignments" subtitle="Manage assignments and track submissions" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[13px] font-bold text-slate-800">
            {loading ? 'Loading…' : assignments.length + ' assignment' + (assignments.length !== 1 ? 's' : '')}
          </p>
          <Link href="/educator/assignments/new">
            <Button size="sm"><Plus size={13} /> Create Assignment</Button>
          </Link>
        </div>

        {loading ? (
          <div className="py-14 text-center">
            <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[12.5px] text-slate-400">Loading assignments…</p>
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState message="No assignments yet. Lock attendance on a lesson first, then create an assignment." icon={<ClipboardList size={20} />} />
        ) : (
          <div className="space-y-4">
            {assignments.map((a: any) => {
              const deadline  = a.deadline ? new Date(a.deadline) : null
              const isExpired = deadline ? deadline < now : false
              const isOpen    = expanded === a.id
              const subs      = a.submissions ?? []
              const stats     = a.stats ?? { total:0, submitted:0, scored:0, pending:0, missed:0 }

              return (
                <div key={a.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-bold text-slate-800">{a.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {a.subject?.name && <Badge variant="teal">{a.subject.name}</Badge>}
                          {a.lesson_date && <span className="text-[10.5px] text-slate-400">{a.lesson_date}</span>}
                          <Badge variant={a.assignment_type === 'pdf' ? 'info' : 'purple'}>
                            {a.assignment_type === 'pdf' ? '📄 PDF' : '📝 CBT'}
                          </Badge>
                          <Badge variant={isExpired ? 'destructive' : 'success'}>
                            {isExpired ? 'Closed' : 'Open'}
                          </Badge>
                        </div>
                        {deadline && (
                          <p className="text-[10.5px] text-slate-400 mt-1.5">
                            Due: {deadline.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                          </p>
                        )}
                      </div>

                      {/* Submission summary pills */}
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        {stats.scored > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10.5px] font-bold">
                            <Check size={10} /> {stats.scored} completed
                          </span>
                        )}
                        {stats.pending > 0 && (
                          <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10.5px] font-bold">
                            {stats.pending} pending
                          </span>
                        )}
                        {stats.missed > 0 && (
                          <span className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10.5px] font-bold">
                            {stats.missed} missed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Share link bar */}
                  {a.share_url && (
                    <div className="px-5 py-2.5 border-t border-slate-50 bg-slate-50/70 flex items-center gap-2">
                      <p className="text-[10px] font-mono text-slate-400 truncate flex-1">{a.share_url}</p>
                      <button onClick={() => copyLink(a.share_url)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-semibold transition ${
                          copied === a.share_url ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}>
                        {copied === a.share_url ? <><Check size={10}/> Copied</> : <><Copy size={10}/> Copy</>}
                      </button>
                    </div>
                  )}

                  {/* Expand/collapse submissions */}
                  <button onClick={() => setExpanded(isOpen ? null : a.id)}
                    className="w-full px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-left hover:bg-slate-50 transition">
                    <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-600">
                      <Users size={13} />
                      {stats.total} learner{stats.total !== 1 ? 's' : ''} assigned
                      {stats.submitted + stats.scored > 0 && (
                        <span className="text-emerald-600">· {stats.submitted + stats.scored} done</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {isExpired && (
                        <button onClick={(e) => { e.stopPropagation(); deleteAssignment(a.id) }}
                          disabled={deleting === a.id}
                          className="px-2 py-1 text-[10.5px] font-semibold text-red-500 hover:bg-red-50 rounded-md transition"
                          title="Delete expired assignment">
                          <Trash2 size={12} />
                        </button>
                      )}
                      {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </div>
                  </button>

                  {/* Score summary */}
                  {(a.submissions ?? []).length > 0 && <ScoreSummary submissions={a.submissions ?? []} />}

                  {/* Submissions table — expanded */}
                  {isOpen && (
                    <div className="border-t border-slate-100">
                      {subs.length === 0 ? (
                        <p className="px-5 py-6 text-center text-[12px] text-slate-400 italic">No learners assigned to this assignment yet.</p>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {subs.map((s: any) => {
                            const st = STATUS_STYLES[s.status] ?? STATUS_STYLES.pending
                            return (
                              <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                                {/* Learner avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
                                  s.status === 'scored' || s.status === 'submitted'
                                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                                    : s.status === 'missed'
                                      ? 'bg-gradient-to-br from-red-400 to-red-600'
                                      : 'bg-gradient-to-br from-amber-400 to-orange-500'
                                }`}>
                                  {(s.learner_name ?? '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
                                </div>

                                {/* Name + time */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12.5px] font-semibold text-slate-800 truncate">{s.learner_name}</p>
                                  {s.submitted_at && (
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      Submitted {new Date(s.submitted_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                                    </p>
                                  )}
                                </div>

                                {/* Score (if scored) */}
                                {s.status === 'scored' && s.score != null && s.max_score != null && (
                                  <div className="text-right flex-shrink-0 mr-2">
                                    <p className={`text-[14px] font-black leading-none ${
                                      (s.score / s.max_score) >= 0.7 ? 'text-emerald-600'
                                      : (s.score / s.max_score) >= 0.5 ? 'text-amber-600'
                                      : 'text-red-500'
                                    }`}>{s.score}/{s.max_score}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">
                                      {Math.round((s.score / s.max_score) * 100)}%
                                    </p>
                                  </div>
                                )}

                                {/* Status badge */}
                                <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold flex-shrink-0 ${st.bg} ${st.text}`}>
                                  {st.label}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
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
