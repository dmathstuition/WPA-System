'use client'
import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Topbar } from '@/components/layout/topbar'
import { EmptyState } from '@/components/shared/empty-state'
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Lock, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { fetchArray, postJSON } from '@/lib/fetch'

function isoDate(d: Date) { return d.toISOString().split('T')[0] }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function fmtFull(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}

const BLANK = { title:'', lesson_date: isoDate(new Date()), subject_id:'', notes:'' }

export default function EducatorLessonsPage() {
  const [user, setUser]               = useState<any>(null)
  const [lessons, setLessons]         = useState<any[]>([])
  const [myClasses, setMyClasses]     = useState<any[]>([])
  const [subjects, setSubjects]       = useState<any[]>([])
  const [weekStart, setWeekStart]     = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d
  })
  const [selectedDay, setSelectedDay] = useState(isoDate(new Date()))
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState({ ...BLANK, class_id: '' })
  const [saving, setSaving]           = useState(false)
  const [msg, setMsg]                 = useState('')
  const [locking, setLocking]         = useState('')

  const today    = isoDate(new Date())
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const loadLessons = useCallback(() => {
    fetchArray('/api/educator/lessons').then(setLessons)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(setUser)
    loadLessons()
    // Load educator's assigned classes
    fetchArray('/api/educator/my-classes').then(setMyClasses)
    fetchArray('/api/admin/subjects').then(setSubjects)
  }, [loadLessons])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  // When class is selected, auto-load subjects for that year level
  function onClassChange(classId: string) {
    set('class_id', classId)
    const cls = myClasses.find((c: any) => c.id === classId)
    // If class has a subject pre-assigned, pre-fill it
    if (cls?.subject_id) set('subject_id', cls.subject_id)
  }

  async function createLesson() {
    if (!form.title.trim())  { setMsg('Title is required'); return }
    if (!form.class_id)      { setMsg('Select a class'); return }
    if (!form.subject_id)    { setMsg('Select a subject'); return }
    if (!form.lesson_date)   { setMsg('Date is required'); return }
    setSaving(true); setMsg('')

    const cls = myClasses.find((c: any) => c.id === form.class_id)
    const body = {
      title:               form.title,
      lesson_date:         form.lesson_date,
      subject_id:          form.subject_id,
      notes:               form.notes,
      lesson_type:         cls?.lesson_type ?? 'general',
      year_level_id:       cls?.year_level_id ?? null,
      class_group_id:      cls?.class_group_id ?? null,
      one_to_one_learner_id: cls?.lesson_type === 'one_to_one' ? cls?.learner_id ?? null : null,
    }

    const { ok, data } = await postJSON('/api/educator/lessons', body)
    if (ok) {
      setShowForm(false)
      setForm({ ...BLANK, class_id: '' })
      loadLessons()
    } else {
      setMsg(data.error ?? 'Error creating lesson')
    }
    setSaving(false)
  }

  async function lockAttendance(id: string) {
    setLocking(id)
    await postJSON('/api/admin/lessons', { action: 'lock', id }, 'PUT')
    loadLessons()
    setLocking('')
  }

  const byDate = lessons.reduce((acc: Record<string, any[]>, l) => {
    acc[l.lesson_date] = acc[l.lesson_date] ?? []
    acc[l.lesson_date].push(l)
    return acc
  }, {})
  const dayLessons = byDate[selectedDay] ?? []
  const pendingCount = lessons.filter(l => !l.attendance_locked && l.lesson_date <= today).length

  return (
    <>
      <Topbar user={user ?? { id:'', name:'Educator', email:'', role:'educator' }}
              title="My Lessons" subtitle="Create and manage your class sessions" />
      <div className="p-5">

        {/* Pending attendance alert */}
        {pendingCount > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <p className="text-[12.5px] text-amber-800 font-medium flex-1">
              You have <strong>{pendingCount}</strong> lesson{pendingCount > 1 ? 's' : ''} with attendance not yet marked.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">

          {/* ── Calendar column ── */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Week nav */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <button onClick={() => setWeekStart(d => addDays(d, -7))}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition">
                  <ChevronLeft size={14} className="text-slate-600" />
                </button>
                <p className="text-[12px] font-bold text-slate-800">
                  {weekStart.toLocaleDateString('en-GB', { day:'numeric', month:'short' })} –{' '}
                  {addDays(weekStart, 6).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                </p>
                <button onClick={() => setWeekStart(d => addDays(d, 7))}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition">
                  <ChevronRight size={14} className="text-slate-600" />
                </button>
              </div>

              {/* Day rows */}
              <div className="divide-y divide-slate-50">
                {weekDays.map(day => {
                  const ds       = isoDate(day)
                  const dl       = byDate[ds] ?? []
                  const isToday  = ds === today
                  const isSel    = ds === selectedDay
                  const hasPend  = dl.some(l => !l.attendance_locked && ds <= today)
                  return (
                    <button key={ds} onClick={() => setSelectedDay(ds)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${isSel ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                      <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                        isToday ? 'bg-amber-500 text-white'
                        : isSel  ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                        <span className="text-[9.5px] font-bold uppercase leading-none">
                          {day.toLocaleDateString('en-GB', { weekday:'short' })}
                        </span>
                        <span className="text-[15px] font-black leading-none mt-0.5">{day.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {dl.length === 0
                          ? <p className="text-[11.5px] text-slate-400">No lessons</p>
                          : <div className="space-y-0.5">
                              {dl.slice(0, 2).map((l: any) => (
                                <p key={l.id} className="text-[11px] font-medium text-slate-700 truncate">{l.title}</p>
                              ))}
                              {dl.length > 2 && <p className="text-[10.5px] text-amber-600 font-semibold">+{dl.length - 2} more</p>}
                            </div>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {dl.length > 0 && (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {dl.length}
                          </span>
                        )}
                        {hasPend && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="px-4 py-2.5 border-t border-slate-100">
                <button onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1)
                  setWeekStart(d); setSelectedDay(isoDate(new Date()))
                }} className="text-[11.5px] text-amber-600 font-semibold hover:text-amber-700">
                  Jump to today →
                </button>
              </div>
            </div>

            {/* My assigned classes — quick reference */}
            {myClasses.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2.5">My Classes</p>
                <div className="space-y-1.5">
                  {myClasses.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2 text-[11.5px]">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.lesson_type === 'one_to_one' ? 'bg-purple-500' : 'bg-amber-500'}`} />
                      <span className="font-medium text-slate-700">{c.year_name}{c.group_name ? ' · Arm ' + c.group_name : ''}</span>
                      {c.subject_name && <span className="text-slate-400">{c.subject_name}</span>}
                      <Badge variant={c.lesson_type === 'one_to_one' ? 'purple' : 'info'} style={{ fontSize:'9px', padding:'1px 5px' }}>
                        {c.lesson_type === 'one_to_one' ? '1:1' : 'General'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Day detail column ── */}
          <div className="space-y-4">
            {/* Day header + create button */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-slate-800">{fmtFull(new Date(selectedDay + 'T00:00:00'))}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {dayLessons.length} lesson{dayLessons.length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
                <Button size="sm" onClick={() => {
                  setForm({ ...BLANK, lesson_date: selectedDay, class_id: '', subject_id: '' })
                  setMsg('')
                  setShowForm(true)
                }}>
                  <Plus size={13} /> Create Lesson
                </Button>
              </div>

              {/* Create lesson form */}
              {showForm && (
                <div className="px-5 py-4 border-b border-slate-100 bg-amber-50/40">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[12.5px] font-bold text-slate-800">New Lesson for {new Date(form.lesson_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}</p>
                    <button onClick={() => { setShowForm(false); setMsg('') }} className="text-slate-400 hover:text-slate-600">
                      <X size={15} />
                    </button>
                  </div>
                  {msg && <p className="text-[11.5px] text-red-500 mb-2 font-medium">{msg}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Lesson Title *</Label>
                      <Input className="mt-1" placeholder="e.g. Introduction to Algebra"
                             value={form.title} onChange={e => set('title', e.target.value)} />
                    </div>
                    <div>
                      <Label>Class * <span className="text-slate-400 font-normal">(your assigned classes only)</span></Label>
                      <select value={form.class_id} onChange={e => onClassChange(e.target.value)}
                        className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">— Select class —</option>
                        {myClasses.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.year_name}{c.group_name ? ' · Arm ' + c.group_name : ''}{c.subject_name ? ' · ' + c.subject_name : ''} ({c.lesson_type === 'one_to_one' ? '1:1' : 'General'})
                          </option>
                        ))}
                      </select>
                      {myClasses.length === 0 && (
                        <p className="text-[10.5px] text-amber-600 mt-1">No classes assigned. Ask admin to assign you classes first.</p>
                      )}
                    </div>
                    <div>
                      <Label>Subject *</Label>
                      <select value={form.subject_id} onChange={e => set('subject_id', e.target.value)}
                        className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">— Select subject —</option>
                        {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Date *</Label>
                      <Input className="mt-1" type="date" value={form.lesson_date}
                             onChange={e => set('lesson_date', e.target.value)} />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input className="mt-1" placeholder="Optional" value={form.notes}
                             onChange={e => set('notes', e.target.value)} />
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <Button size="sm" onClick={createLesson} disabled={saving || myClasses.length === 0}>
                        {saving ? 'Creating…' : 'Create Lesson'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setMsg('') }}>Cancel</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lessons for the day */}
              {dayLessons.length === 0 && !showForm ? (
                <div className="flex flex-col items-center py-14 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <Calendar size={22} className="text-slate-300" />
                  </div>
                  <p className="text-[13px] font-semibold text-slate-500">No lessons this day</p>
                  <p className="text-[11.5px] text-slate-400 mt-1">Click "Create Lesson" to add one</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {dayLessons.map((l: any, idx: number) => {
                    const isPast   = l.lesson_date <= today
                    const needsAtt = isPast && !l.attendance_locked
                    return (
                      <div key={l.id} className={`px-5 py-4 ${needsAtt ? 'bg-amber-50/30' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5 ${
                            needsAtt ? 'bg-amber-500 text-white'
                            : l.attendance_locked ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                          }`}>{idx + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <p className="text-[13px] font-bold text-slate-800">{l.title}</p>
                                <p className="text-[11.5px] text-slate-500 mt-0.5">{l.subjects?.name ?? '—'}</p>
                              </div>
                              <Badge variant={l.attendance_locked ? 'success' : needsAtt ? 'destructive' : 'info'}>
                                {l.attendance_locked ? '✓ Done' : needsAtt ? 'Mark Attendance' : 'Upcoming'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {l.year_levels && <Badge variant="info">{l.year_levels.name}</Badge>}
                              {l.class_groups && <Badge variant="purple">Arm {l.class_groups.name}</Badge>}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <Link href={'/educator/lessons/' + l.id + '/attendance'}>
                                <Button size="sm" variant={l.attendance_locked ? 'outline' : 'default'}>
                                  {l.attendance_locked ? 'View Attendance' : 'Mark Attendance'}
                                </Button>
                              </Link>
                              {l.attendance_locked && (
                                <Link href={'/educator/assignments/new?lesson_id=' + l.id}>
                                  <Button size="sm" variant="outline">
                                    <ClipboardList size={12} /> Create Assignment
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
