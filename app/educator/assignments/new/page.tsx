'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, Trash2, Check, Copy, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

interface Option { key: string; text: string; is_correct: boolean }
interface Question { text: string; marks: number; options: Option[] }

const KEYS = ['A', 'B', 'C', 'D']
const newOption = (key: string): Option => ({ key, text: '', is_correct: false })
const newQuestion = (): Question => ({ text: '', marks: 1, options: KEYS.map(newOption) })

export default function NewAssignmentPage() {
  const router      = useRouter()
  const params      = useSearchParams()
  const [lessons, setLessons]     = useState<any[]>([])
  const [form, setForm]           = useState({
    lesson_id:      params?.get('lesson_id') ?? '',
    title:          '',
    instructions:   '',
    time_limit_mins:'',
    deadline:       '',
  })
  const [questions, setQuestions] = useState<Question[]>([newQuestion()])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    fetch('/api/educator/lessons')
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setLessons(arr.filter((l: any) => l.attendance_locked))
      })
      .catch(() => setLessons([]))
  }, [])

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function addQuestion() { setQuestions(qs => [...qs, newQuestion()]) }
  function removeQuestion(i: number) { setQuestions(qs => qs.filter((_, idx) => idx !== i)) }
  function setQText(i: number, t: string) { setQuestions(qs => qs.map((q, idx) => idx===i ? {...q, text:t} : q)) }
  function setQMarks(i: number, m: number) { setQuestions(qs => qs.map((q, idx) => idx===i ? {...q, marks:m} : q)) }
  function setOText(qi: number, oi: number, t: string) {
    setQuestions(qs => qs.map((q, idx) => idx!==qi ? q : { ...q, options: q.options.map((o,j) => j===oi ? {...o,text:t} : o) }))
  }
  function setCorrect(qi: number, oi: number) {
    setQuestions(qs => qs.map((q, idx) => idx!==qi ? q : { ...q, options: q.options.map((o,j) => ({...o, is_correct: j===oi})) }))
  }

  async function save() {
    setError('')
    if (!form.lesson_id)                           { setError('Select a lesson'); return }
    if (!form.title.trim())                        { setError('Title is required'); return }
    if (!form.deadline)                            { setError('Deadline is required'); return }
    if (questions.some(q => !q.text.trim()))       { setError('All questions must have text'); return }
    if (questions.some(q => !q.options.some(o => o.is_correct))) { setError('Each question needs a correct answer'); return }
    if (questions.some(q => q.options.some(o => !o.text.trim()))) { setError('All answer options need text'); return }

    setSaving(true)

    const body = {
      lesson_id:       form.lesson_id,
      title:           form.title.trim(),
      instructions:    form.instructions.trim() || undefined,
      time_limit_mins: form.time_limit_mins ? parseInt(form.time_limit_mins) : undefined,
      deadline:        new Date(form.deadline).toISOString(),
      assignment_type: 'cbt',
      questions: questions.map((q, i) => ({
        text:    q.text.trim(),
        marks:   q.marks,
        order:   i,
        options: q.options.map(o => ({ key: o.key, text: o.text.trim(), is_correct: o.is_correct })),
      })),
    }

    try {
      const res  = await fetch('/api/educator/assignments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      // Always try to parse JSON — catch empty response
      let data: any = {}
      try { data = await res.json() } catch { /* empty response */ }

      if (!res.ok) {
        setError(data.error ?? 'Error creating assignment (status ' + res.status + ')')
        setSaving(false)
        return
      }

      if (data.share_url) {
        setShareLink(data.share_url)
      } else {
        router.push('/educator/assignments')
      }
    } catch (e: any) {
      setError('Network error: ' + e.message)
      setSaving(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Share link success screen ──────────────────────────────
  if (shareLink) return (
    <>
      <Topbar user={{ id:'', name:'Educator', email:'', role:'educator' }} title="Assignment Created" />
      <div className="p-5 max-w-lg">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <Check size={32} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[18px] font-black text-slate-900">Assignment Created!</p>
            <p className="text-[13px] text-slate-500 mt-1">
              Share this link with your learners. Anyone with the link can access and submit.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-left">
            <LinkIcon size={14} className="text-slate-400 flex-shrink-0" />
            <p className="text-[11.5px] text-slate-600 font-mono break-all flex-1">{shareLink}</p>
            <button onClick={copy}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>
              {copied ? <><Check size={11}/> Copied!</> : <><Copy size={11}/> Copy</>}
            </button>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => router.push('/educator/assignments')}>View All Assignments</Button>
            <Button onClick={() => {
              setShareLink('')
              setForm({ lesson_id:'', title:'', instructions:'', time_limit_mins:'', deadline:'' })
              setQuestions([newQuestion()])
              setSaving(false)
            }}>Create Another</Button>
          </div>
        </div>
      </div>
    </>
  )

  // ── Create form ────────────────────────────────────────────
  return (
    <>
      <Topbar user={{ id:'', name:'Educator', email:'', role:'educator' }}
              title="Create Assignment" subtitle="Build a CBT test for your learners" />
      <div className="p-5 max-w-3xl">
        <Link href="/educator/assignments"
              className="inline-flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 mb-5 transition">
          <ArrowLeft size={14} /> Back to Assignments
        </Link>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Details */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5 space-y-4">
          <p className="text-[13px] font-bold text-slate-800">Assignment Details</p>

          <div>
            <Label>Lesson * <span className="text-slate-400 font-normal text-[10.5px]">(attendance must be locked first)</span></Label>
            <select value={form.lesson_id} onChange={e => setF('lesson_id', e.target.value)}
              className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">— Select lesson —</option>
              {lessons.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.title} · {l.lesson_date}
                </option>
              ))}
            </select>
            {lessons.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No eligible lessons. Lock attendance on a lesson first, then create an assignment.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input className="mt-1" placeholder="e.g. Chapter 3 Quiz"
                     value={form.title} onChange={e => setF('title', e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Instructions <span className="text-slate-400 font-normal">(optional)</span></Label>
              <textarea value={form.instructions} onChange={e => setF('instructions', e.target.value)}
                rows={2} placeholder="Add any instructions for learners…"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <div>
              <Label>Deadline *</Label>
              <Input className="mt-1" type="datetime-local" value={form.deadline}
                     onChange={e => setF('deadline', e.target.value)} />
            </div>
            <div>
              <Label>Time Limit <span className="text-slate-400 font-normal">(minutes, optional)</span></Label>
              <Input className="mt-1" type="number" min="1" placeholder="e.g. 30"
                     value={form.time_limit_mins} onChange={e => setF('time_limit_mins', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-slate-800">Questions ({questions.length})</p>
            <Button size="sm" variant="outline" onClick={addQuestion}>
              <Plus size={12} /> Add Question
            </Button>
          </div>

          <div className="space-y-5">
            {questions.map((q, qi) => (
              <div key={qi} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-1">
                    {qi + 1}
                  </span>
                  <Input className="flex-1" placeholder="Question text…"
                         value={q.text} onChange={e => setQText(qi, e.target.value)} />
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-slate-500">Marks:</span>
                    <Input type="number" min="1" className="w-14 h-8 text-[12px]"
                           value={q.marks} onChange={e => setQMarks(qi, parseInt(e.target.value) || 1)} />
                  </div>
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(qi)}
                      className="text-red-400 hover:text-red-600 transition flex-shrink-0 mt-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="space-y-2 pl-9">
                  {q.options.map((o, oi) => (
                    <label key={oi}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition ${
                        o.is_correct ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                      }`}>
                      <button type="button" onClick={() => setCorrect(qi, oi)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                          o.is_correct ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-emerald-400'
                        }`}>
                        {o.is_correct && <Check size={10} className="text-white" />}
                      </button>
                      <span className="text-[11.5px] font-bold text-slate-400 w-4">{o.key}</span>
                      <Input className="flex-1 h-7 text-[12px] border-0 shadow-none focus-visible:ring-0 bg-transparent p-0"
                             placeholder={`Option ${o.key}…`}
                             value={o.text} onChange={e => setOText(qi, oi, e.target.value)} />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Creating…' : 'Create & Get Share Link'}
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/educator/assignments">Cancel</Link>
          </Button>
        </div>
      </div>
    </>
  )
}
