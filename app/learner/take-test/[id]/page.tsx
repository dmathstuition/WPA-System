'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Clock, ChevronRight, ChevronLeft, Send } from 'lucide-react'

export default function TakeTestPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [submissionId, setSubmissionId] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    fetch(`/api/learner/assignments?assignment_id=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setData(d.assignment)
        setSubmissionId(d.submission_id)
        if (d.assignment?.time_limit_mins) setTimeLeft(d.assignment.time_limit_mins * 60)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load test'); setLoading(false) })
  }, [id])

  const submit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    const questions = data?.assignment_questions ?? []
    const answerList = questions.map((q: any) => ({ question_id: q.id, option_id: answers[q.id] ?? '' })).filter((a: any) => a.option_id)
    const r = await fetch('/api/learner/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: submissionId, answers: answerList })
    })
    if (r.ok) {
      const result = await r.json()
      router.push(`/learner/result/${submissionId}?score=${result.score}&max=${result.max_score}`)
    } else { const e = await r.json(); setError(e.error ?? 'Submission failed'); setSubmitting(false) }
  }, [submitting, data, answers, submissionId, router])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) { submit(); return }
    timerRef.current = setInterval(() => setTimeLeft(t => (t ?? 1) - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [timeLeft, submit])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Loading test…</p></div>
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <p className="text-red-500 font-medium mb-3">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    </div>
  )

  const questions = data?.assignment_questions?.sort((a: any, b: any) => a.sort_order - b.sort_order) ?? []
  const q = questions[current]
  const totalQ = questions.length
  const answeredCount = Object.keys(answers).length
  const mins = Math.floor((timeLeft ?? 0) / 60)
  const secs = (timeLeft ?? 0) % 60
  const isUrgent = timeLeft !== null && timeLeft < 120

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div>
          <p className="text-[13px] font-bold text-slate-900 truncate max-w-[260px]">{data?.title}</p>
          <p className="text-[11px] text-slate-400">Question {current + 1} of {totalQ} · {answeredCount} answered</p>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold ${isUrgent ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
            <Clock size={14} />
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-200">
        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all" style={{ width: `${((current + 1) / totalQ) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="flex-1 flex items-start justify-center p-5 sm:p-8">
        <div className="w-full max-w-2xl">
          {q && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold flex items-center justify-center">{current + 1}</span>
                <span className="text-[11px] text-slate-400 font-medium">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
              </div>
              <p className="text-[15px] font-semibold text-slate-900 leading-relaxed mb-6">{q.question_text}</p>
              <div className="space-y-3">
                {q.assignment_options?.sort((a: any, b: any) => a.option_key.localeCompare(b.option_key)).map((opt: any) => (
                  <button key={opt.id} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.id }))}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${answers[q.id] === opt.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${answers[q.id] === opt.id ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{opt.option_key}</span>
                    <span className="text-[13px] text-slate-700">{opt.option_text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-5">
            <Button variant="outline" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>
              <ChevronLeft size={15} /> Previous
            </Button>
            {current < totalQ - 1 ? (
              <Button onClick={() => setCurrent(c => c + 1)}>
                Next <ChevronRight size={15} />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting}>
                <Send size={14} /> {submitting ? 'Submitting…' : `Submit (${answeredCount}/${totalQ} answered)`}
              </Button>
            )}
          </div>

          {/* Question overview dots */}
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {questions.map((_: any, i: number) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${i === current ? 'bg-amber-500 text-white' : answers[questions[i]?.id] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
