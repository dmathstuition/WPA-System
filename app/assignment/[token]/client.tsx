'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileText, Check, Download } from 'lucide-react'

interface Props { assignment: any; token: string }

export default function AssignmentClient({ assignment, token }: Props) {
  const [name, setName]       = useState('')
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [pdfConfirm, setPdfConfirm] = useState(false)

  const isPDF = assignment.assignment_type === 'pdf'

  async function submit() {
    if (!name.trim()) { setError('Please enter your name'); return }
    setSaving(true); setError('')
    const res  = await fetch('/api/public/submit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, name, answers, type: assignment.assignment_type }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error submitting'); setSaving(false); return }
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
        <Check size={32} className="text-emerald-600" />
      </div>
      <p className="text-[18px] font-black text-slate-900">Submitted!</p>
      <p className="text-[13px] text-slate-500">Your assignment has been submitted. Your tutor will review it.</p>
      {assignment.assignment_type === 'cbt' && (
        <p className="text-[12px] text-amber-600 font-medium">Your score will be available once graded.</p>
      )}
    </div>
  )

  if (!started) return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <p className="text-[14px] font-bold text-slate-900">Enter your details to begin</p>
      <div>
        <Label>Your Full Name *</Label>
        <Input className="mt-1" placeholder="e.g. Chukwuemeka Bright"
               value={name} onChange={e => setName(e.target.value)} />
      </div>
      {error && <p className="text-[12px] text-red-500">{error}</p>}
      <Button onClick={() => { if (!name.trim()) { setError('Name required'); return } setError(''); setStarted(true) }}>
        {isPDF ? 'View Assignment' : 'Start Test'}
      </Button>
    </div>
  )

  if (isPDF) return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
      <p className="text-[14px] font-bold text-slate-900">PDF Assignment — {name}</p>
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <FileText size={24} className="text-slate-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-slate-700">{assignment.pdf_filename ?? 'assignment.pdf'}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Click to download and complete</p>
        </div>
        <a href={assignment.pdf_url} target="_blank" rel="noreferrer">
          <Button size="sm" variant="outline"><Download size={13} /> Download</Button>
        </a>
      </div>
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={pdfConfirm} onChange={e => setPdfConfirm(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-amber-500" />
          <span className="text-[12.5px] text-slate-600">
            I confirm I have downloaded and completed the PDF assignment.
          </span>
        </label>
      </div>
      {error && <p className="text-[12px] text-red-500">{error}</p>}
      <Button onClick={submit} disabled={!pdfConfirm || saving}>
        {saving ? 'Submitting…' : 'Mark as Submitted'}
      </Button>
    </div>
  )

  // CBT test
  const questions = assignment.questions ?? []
  const allAnswered = questions.every((q: any) => answers[q.id])

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <p className="text-[12.5px] text-amber-800 font-medium">Taking test as: <strong>{name}</strong></p>
        <p className="text-[11.5px] text-amber-600">{Object.keys(answers).length}/{questions.length} answered</p>
      </div>

      {questions.map((q: any, qi: number) => (
        <div key={q.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-3">
            <span className="text-amber-500 font-black mr-2">Q{qi+1}.</span>{q.question_text}
          </p>
          <div className="space-y-2">
            {(q.assignment_options ?? []).map((o: any) => (
              <label key={o.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${answers[q.id] === o.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${answers[q.id] === o.id ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>
                  {answers[q.id] === o.id && <Check size={10} className="text-white" />}
                </div>
                <input type="radio" name={q.id} value={o.id} className="sr-only"
                  onChange={() => setAnswers(a => ({ ...a, [q.id]: o.id }))} />
                <span className="text-[12.5px] text-slate-700">
                  <span className="font-bold text-slate-500 mr-1">{o.option_key}.</span>{o.option_text}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {error && <p className="text-[12px] text-red-500">{error}</p>}
      <Button onClick={submit} disabled={!allAnswered || saving} className="w-full py-3">
        {saving ? 'Submitting…' : 'Submit Test'}
      </Button>
      {!allAnswered && (
        <p className="text-[11.5px] text-slate-400 text-center">Answer all questions to submit</p>
      )}
    </div>
  )
}
