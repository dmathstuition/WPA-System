'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, XCircle, Lock } from 'lucide-react'
import Link from 'next/link'

function initials(name: string) {
  return (name ?? '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)
}

export default function AttendancePage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  // Always initialise as array — never allow non-array state
  const [records, setRecords] = useState<any[]>([])
  const [lesson,  setLesson]  = useState<any>(null)
  const [locked,  setLocked]  = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg,     setMsg]     = useState('')
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch('/api/educator/attendance?lesson_id=' + id)
      .then(async r => {
        const text = await r.text()
        // Safe parse — never crash on empty body
        let data: any = {}
        try { data = JSON.parse(text) } catch { data = {} }

        if (!r.ok) {
          setError(data?.error ?? 'Failed to load attendance (status ' + r.status + ')')
          setLoading(false)
          return
        }

        // Handle {lesson, records} shape (current API)
        if (data && typeof data === 'object' && 'records' in data) {
          setLesson(data.lesson ?? null)
          setLocked(data.lesson?.attendance_locked ?? false)
          setRecords(Array.isArray(data.records) ? data.records : [])
        }
        // Handle legacy plain array shape
        else if (Array.isArray(data)) {
          setRecords(data.map((r: any) => ({
            learner_id:       r.learner_id ?? r.learner?.id ?? '',
            name:             r.name ?? r.learner?.users?.name ?? '—',
            email:            r.email ?? '',
            admission_number: r.admission_number ?? '',
            status:           r.status ?? 'absent',
          })))
        }
        // API returned an error object
        else if (data?.error) {
          setError(data.error)
        }
        // Fallback — empty
        else {
          setRecords([])
        }
        setLoading(false)
      })
      .catch(e => {
        setError('Network error: ' + e.message)
        setLoading(false)
      })
  }, [id])

  function toggle(learnerId: string) {
    if (locked) return
    setRecords(rs =>
      (Array.isArray(rs) ? rs : []).map(r =>
        r.learner_id === learnerId
          ? { ...r, status: r.status === 'present' ? 'absent' : 'present' }
          : r
      )
    )
  }

  function markAll(status: 'present' | 'absent') {
    if (locked) return
    setRecords(rs => (Array.isArray(rs) ? rs : []).map(r => ({ ...r, status })))
  }

  async function save(doLock = false) {
    const safeRecs = Array.isArray(records) ? records : []
    setSaving(true); setMsg(''); setError('')
    try {
      const res = await fetch('/api/educator/attendance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: id,
          records:   safeRecs.map(r => ({ learner_id: r.learner_id, status: r.status })),
          lock:      doLock,
        }),
      })
      let data: any = {}
      try { data = await res.json() } catch {}
      if (!res.ok) { setError(data?.error ?? 'Error saving'); setSaving(false); return }
      if (doLock) {
        setLocked(true)
        setMsg('Attendance locked! You can now create an assignment.')
        setTimeout(() => router.push('/educator/lessons'), 2000)
      } else {
        setMsg('Attendance saved successfully.')
      }
    } catch (e: any) {
      setError('Network error: ' + e.message)
    }
    setSaving(false)
  }

  // Always safe — derived from guaranteed array
  const safe         = Array.isArray(records) ? records : []
  const presentCount = safe.filter(r => r.status === 'present').length
  const absentCount  = safe.length - presentCount

  return (
    <>
      <Topbar user={{ id:'', name:'Educator', email:'', role:'educator' }}
              title="Mark Attendance"
              subtitle={loading ? 'Loading…' : locked ? 'Attendance locked' : `${presentCount} of ${safe.length} present`} />
      <div className="p-5 max-w-2xl">
        <Link href="/educator/lessons"
              className="inline-flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 mb-5 transition">
          <ArrowLeft size={14} /> Back to Lessons
        </Link>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-600 font-medium">
            ⚠ {error}
          </div>
        )}
        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-[12.5px] font-medium ${
            msg.includes('locked')
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}>{msg}</div>
        )}

        {/* Stats bar */}
        {!loading && safe.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-[26px] font-black text-emerald-600 leading-none">{presentCount}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mt-1">Present</p>
              </div>
              <div className="text-center">
                <p className="text-[26px] font-black text-red-500 leading-none">{absentCount}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mt-1">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-[26px] font-black text-slate-700 leading-none">{safe.length}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mt-1">Total</p>
              </div>
            </div>
            {!locked && (
              <div className="flex gap-2">
                <button onClick={() => markAll('present')}
                  className="px-3 py-1.5 text-[11.5px] font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition">
                  All Present
                </button>
                <button onClick={() => markAll('absent')}
                  className="px-3 py-1.5 text-[11.5px] font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                  All Absent
                </button>
              </div>
            )}
          </div>
        )}

        {/* Learner list */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-5">
          {loading ? (
            <div className="py-14 text-center">
              <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[12.5px] text-slate-400">Loading learners…</p>
            </div>
          ) : safe.length === 0 ? (
            <div className="py-14 text-center px-6">
              <p className="text-[13px] font-semibold text-slate-500">No learners found for this lesson.</p>
              <p className="text-[11.5px] text-slate-400 mt-1">
                Make sure learners are assigned to this year level and class arm in admin.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {safe.map((r: any) => (
                <button key={r.learner_id} onClick={() => toggle(r.learner_id)}
                  disabled={locked}
                  className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors text-left ${
                    locked ? 'cursor-default' : 'hover:bg-slate-50 cursor-pointer'
                  } ${r.status === 'present' ? 'bg-emerald-50/40' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                      {initials(r.name)}
                    </div>
                    <div>
                      <p className="text-[12.5px] font-semibold text-slate-800">{r.name}</p>
                      <p className="text-[10.5px] text-slate-400">{r.admission_number || r.email || '—'}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold ${
                    r.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {r.status === 'present'
                      ? <><CheckCircle size={13} /> Present</>
                      : <><XCircle    size={13} /> Absent</>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!locked && safe.length > 0 && (
          <div className="flex gap-3">
            <Button onClick={() => save(false)} disabled={saving} variant="outline">
              {saving ? 'Saving…' : 'Save Draft'}
            </Button>
            <Button onClick={() => save(true)} disabled={saving}>
              <Lock size={13} />
              {saving ? 'Locking…' : 'Save & Lock Attendance'}
            </Button>
          </div>
        )}

        {locked && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-[13px] text-emerald-700 font-bold">Attendance locked.</p>
              <p className="text-[11.5px] text-emerald-600 mt-0.5">
                Go to{' '}
                <Link href="/educator/assignments/new" className="underline font-semibold">
                  Create Assignment
                </Link>{' '}
                to set work for learners who attended.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
