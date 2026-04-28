'use client'
import { useState } from 'react'
import { RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RepeatWeekButton({ lessons }: { lessons: any[] }) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [results, setResults] = useState<{ ok: number; fail: number }>({ ok: 0, fail: 0 })

  async function repeatAll() {
    setLoading(true)
    let ok = 0, fail = 0

    for (const l of lessons) {
      // Add 7 days to the lesson date
      const oldDate = new Date(l.lesson_date)
      const newDate = new Date(oldDate)
      newDate.setDate(newDate.getDate() + 7)
      const dateStr = newDate.toISOString().split('T')[0]

      try {
        const res = await fetch('/api/educator/lessons/copy', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: l.id, new_date: dateStr })
        })
        if (res.ok) ok++
        else fail++
      } catch { fail++ }
    }

    setResults({ ok, fail })
    setDone(true)
    setLoading(false)
    setTimeout(() => { setDone(false); setShow(false) }, 3000)
  }

  if (lessons.length === 0) return null

  if (!show) return (
    <button onClick={() => setShow(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
      <RefreshCw size={12} /> Repeat Week
    </button>
  )

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 flex-wrap">
      <p className="text-[12px] text-slate-700">
        Copy <strong>{lessons.length}</strong> lesson{lessons.length > 1 ? 's' : ''} to next week?
      </p>
      {done ? (
        <span className="text-[11.5px] text-emerald-600 font-medium flex items-center gap-1"><Check size={12} /> {results.ok} copied{results.fail ? ', ' + results.fail + ' skipped' : ''}</span>
      ) : (
        <>
          <Button size="sm" onClick={repeatAll} disabled={loading}>{loading ? 'Copying…' : 'Yes, repeat all'}</Button>
          <button onClick={() => setShow(false)} className="text-[11px] text-slate-500">Cancel</button>
        </>
      )}
    </div>
  )
}
