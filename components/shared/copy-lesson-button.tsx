'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyLessonButton({ lessonId }: { lessonId: string }) {
  const [show, setShow] = useState(false)
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function copy() {
    if (!date) { setError('Pick a date'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/educator/lessons/copy', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId, new_date: date })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed'); setLoading(false); return }
    setDone(true); setLoading(false)
    setTimeout(() => { setShow(false); setDone(false); setDate('') }, 1500)
  }

  if (!show) return (
    <button onClick={() => setShow(true)} title="Repeat this lesson"
      className="text-slate-400 hover:text-orange-600 transition p-1 rounded hover:bg-orange-50">
      <Copy size={13} />
    </button>
  )

  return (
    <div className="flex items-center gap-1.5">
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        className="h-7 px-2 text-[11px] border border-slate-200 rounded-md focus:outline-none focus:border-orange-400" />
      <button onClick={copy} disabled={loading || done}
        className="h-7 px-2 text-[11px] font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1">
        {done ? <><Check size={11} /> Done</> : loading ? 'Copying…' : 'Copy'}
      </button>
      <button onClick={() => { setShow(false); setError('') }} className="text-slate-400 hover:text-slate-600 text-[11px]">✕</button>
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  )
}
