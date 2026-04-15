'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, ChevronLeft, ChevronRight, Plus, Lock, X, Clock } from 'lucide-react'
import { fetchArray, postJSON } from '@/lib/fetch'

function isoDate(d: Date) { return d.toISOString().split('T')[0] }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function fmt(d: string) { try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short' }) } catch { return d } }
function fmtHeader(d: Date) { return d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) }

const BLANK = { title:'', lesson_date: isoDate(new Date()), lesson_type:'general', year_level_id:'', class_group_id:'', subject_id:'', educator_id:'', one_to_one_learner_id:'', notes:'' }

export default function AdminLessonsPage() {
  const [viewMode, setViewMode]   = useState<'calendar'|'list'>('calendar')
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d
  })
  const [selectedDay, setSelectedDay]   = useState(isoDate(new Date()))
  const [lessons, setLessons]           = useState<any[]>([])
  const [yearLevels, setYears]          = useState<any[]>([])
  const [classGroups, setGroups]        = useState<any[]>([])
  const [subjects, setSubjects]         = useState<any[]>([])
  const [educators, setEducators]       = useState<any[]>([])
  const [learners, setLearners]         = useState<any[]>([])
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState({ ...BLANK })
  const [saving, setSaving]             = useState(false)
  const [msg, setMsg]                   = useState('')
  const [locking, setLocking]           = useState('')

  const load = useCallback(() => fetchArray('/api/admin/lessons').then(setLessons), [])

  useEffect(() => {
    load()
    fetchArray('/api/admin/year-levels').then(setYears)
    fetchArray('/api/admin/subjects').then(setSubjects)
    fetchArray('/api/admin/educators').then(setEducators)
    fetchArray('/api/admin/learners').then(setLearners)
  }, [load])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function onYearChange(yearId: string) {
    setForm(f => ({ ...f, year_level_id: yearId, class_group_id: '' }))
    setGroups([])
    if (!yearId) return
    fetchArray('/api/admin/class-groups?year_level_id=' + yearId).then(setGroups)
  }

  function openFormForDay(date: string) {
    setForm({ ...BLANK, lesson_date: date })
    setMsg('')
    setShowForm(true)
  }

  async function save() {
    if (!form.title)        { setMsg('Title is required'); return }
    if (!form.subject_id)   { setMsg('Subject is required'); return }
    if (!form.lesson_date)  { setMsg('Date is required'); return }
    if (!form.educator_id)  { setMsg('Educator is required'); return }
    if (form.lesson_type === 'general' && !form.year_level_id) { setMsg('Year level is required'); return }
    if (form.lesson_type === 'one_to_one' && !form.one_to_one_learner_id) { setMsg('Learner is required for 1:1'); return }
    setSaving(true); setMsg('')
    const { ok, data } = await postJSON('/api/admin/lessons', form)
    if (ok) { setShowForm(false); setForm({ ...BLANK, lesson_date: form.lesson_date }); load() }
    else setMsg(data.error ?? 'Error saving lesson')
    setSaving(false)
  }

  async function lock(id: string) {
    setLocking(id)
    await postJSON('/api/admin/lessons', { action: 'lock', id }, 'PUT')
    load(); setLocking('')
  }

  // Week days Mon-Sun
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Group lessons by date
  const byDate = lessons.reduce((acc: Record<string, any[]>, l) => {
    acc[l.lesson_date] = acc[l.lesson_date] ?? []
    acc[l.lesson_date].push(l)
    return acc
  }, {})

  const selectedLessons = byDate[selectedDay] ?? []
  const today = isoDate(new Date())

  const filteredLearners = form.year_level_id
    ? learners.filter((l: any) => l.year_level_id === form.year_level_id)
    : learners

  return (
    <>
      <Topbar user={{ id:'', name:'Admin', email:'', role:'admin' }} title="Lessons" subtitle="Schedule and manage class sessions" />
      <div className="p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-slate-900">Lessons</h2>
            <span className="bg-amber-100 text-amber-700 text-[10.5px] font-bold px-2 py-0.5 rounded-md">{lessons.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 text-[11.5px] font-semibold rounded-md transition ${viewMode==='calendar' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                Calendar
              </button>
              <button onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-[11.5px] font-semibold rounded-md transition ${viewMode==='list' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                List
              </button>
            </div>
            <Button size="sm" onClick={() => openFormForDay(selectedDay)}>
              <Plus size={13} /> Add Lesson
            </Button>
          </div>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-semibold text-slate-800">New Lesson</p>
              <button onClick={() => { setShowForm(false); setMsg('') }} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            {msg && <p className="text-[12px] mb-3 text-red-500 font-medium">{msg}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-3">
                <Label>Lesson Title *</Label>
                <Input className="mt-1" placeholder="e.g. Introduction to Algebra" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div>
                <Label>Date *</Label>
                <Input className="mt-1" type="date" value={form.lesson_date} onChange={e => set('lesson_date', e.target.value)} />
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
                <Label>Type *</Label>
                <select value={form.lesson_type} onChange={e => set('lesson_type', e.target.value)}
                  className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="general">General (class)</option>
                  <option value="one_to_one">One-to-one</option>
                </select>
              </div>

              {/* Educator — always required */}
              <div className="col-span-2 sm:col-span-3">
                <Label>Educator * <span className="text-slate-400 font-normal text-[10.5px]">— one educator per lesson session</span></Label>
                <select value={form.educator_id} onChange={e => set('educator_id', e.target.value)}
                  className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">— Select educator —</option>
                  {educators.map((ed: any) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.users?.name ?? 'Unknown'}{ed.specialization ? ' · ' + ed.specialization : ''}{ed.year_levels ? ' · ' + ed.year_levels.name : ''}
                    </option>
                  ))}
                </select>
              </div>

              {form.lesson_type === 'general' && (
                <>
                  <div>
                    <Label>Year Level *</Label>
                    <select value={form.year_level_id} onChange={e => onYearChange(e.target.value)}
                      className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">— Select year —</option>
                      {yearLevels.map((y: any) => (
                        <option key={y.id} value={y.id}>{y.name}{y.exam_groups ? ' [' + y.exam_groups.name + ']' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Class Group / Arm</Label>
                    <select value={form.class_group_id} onChange={e => set('class_group_id', e.target.value)}
                      className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">— All groups —</option>
                      {classGroups.map((g: any) => <option key={g.id} value={g.id}>Arm {g.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {form.lesson_type === 'one_to_one' && (
                <>
                  <div>
                    <Label>Filter by Year</Label>
                    <select value={form.year_level_id} onChange={e => onYearChange(e.target.value)}
                      className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">— All years —</option>
                      {yearLevels.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Learner *</Label>
                    <select value={form.one_to_one_learner_id} onChange={e => set('one_to_one_learner_id', e.target.value)}
                      className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">— Select learner —</option>
                      {filteredLearners.map((l: any) => (
                        <option key={l.id} value={l.id}>{l.users?.name ?? l.id}{l.year_levels ? ' · ' + l.year_levels.name : ''}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="col-span-2 sm:col-span-3">
                <Label>Notes</Label>
                <Input className="mt-1" placeholder="Optional notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
              <div className="col-span-2 sm:col-span-3 flex gap-2 pt-1">
                <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Create Lesson'}</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setMsg('') }}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">

            {/* ── Calendar column ── */}
            <div className="space-y-3">
              {/* Week nav */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <button onClick={() => setWeekStart(d => addDays(d, -7))} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition">
                    <ChevronLeft size={15} />
                  </button>
                  <p className="text-[12px] font-bold text-slate-800">
                    {weekStart.toLocaleDateString('en-GB', { day:'numeric', month:'short' })} –{' '}
                    {addDays(weekStart, 6).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                  <button onClick={() => setWeekStart(d => addDays(d, 7))} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition">
                    <ChevronRight size={15} />
                  </button>
                </div>

                {/* Day rows */}
                <div className="divide-y divide-slate-50">
                  {weekDays.map(day => {
                    const ds = isoDate(day)
                    const dayLessons = byDate[ds] ?? []
                    const isToday = ds === today
                    const isSelected = ds === selectedDay
                    return (
                      <button key={ds} onClick={() => setSelectedDay(ds)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${isSelected ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                        <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-amber-500 text-white' : isSelected ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          <span className="text-[10px] font-semibold leading-none uppercase">
                            {day.toLocaleDateString('en-GB', { weekday:'short' })}
                          </span>
                          <span className="text-[15px] font-black leading-none mt-0.5">
                            {day.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {dayLessons.length === 0 ? (
                            <p className="text-[11.5px] text-slate-400">No lessons</p>
                          ) : (
                            <div className="space-y-0.5">
                              {dayLessons.slice(0, 3).map((l: any) => (
                                <p key={l.id} className="text-[11px] text-slate-600 truncate font-medium">{l.title}</p>
                              ))}
                              {dayLessons.length > 3 && (
                                <p className="text-[10.5px] text-amber-600 font-semibold">+{dayLessons.length - 3} more</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {dayLessons.length > 0 && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                              {dayLessons.length}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Go to today */}
                <div className="px-4 py-2.5 border-t border-slate-100">
                  <button onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1)
                    setWeekStart(d); setSelectedDay(isoDate(new Date()))
                  }} className="text-[11.5px] text-amber-600 font-semibold hover:text-amber-700 transition">
                    Jump to today →
                  </button>
                </div>
              </div>

              {/* Quick add button for selected day */}
              <button onClick={() => openFormForDay(selectedDay)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-amber-200 rounded-xl text-[12px] font-semibold text-amber-600 hover:border-amber-400 hover:bg-amber-50 transition">
                <Plus size={14} /> Add lesson for {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}
              </button>
            </div>

            {/* ── Day detail column ── */}
            <div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">{fmtHeader(new Date(selectedDay + 'T00:00:00'))}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{selectedLessons.length} lesson{selectedLessons.length !== 1 ? 's' : ''} scheduled</p>
                  </div>
                  <button onClick={() => openFormForDay(selectedDay)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[11.5px] font-semibold rounded-lg hover:bg-amber-600 transition">
                    <Plus size={12} /> Add
                  </button>
                </div>

                {selectedLessons.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <Calendar size={22} className="text-slate-400" />
                    </div>
                    <p className="text-[13px] font-semibold text-slate-600">No lessons for this day</p>
                    <p className="text-[12px] text-slate-400 mt-1">Click "Add" to schedule a lesson</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {selectedLessons.map((l: any, idx: number) => {
                      const eduName = l.lesson_educators?.[0]?.educators?.users?.name ?? '—'
                      const examName = l.year_levels?.exam_groups?.name
                      return (
                        <div key={l.id} className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            {/* Lesson number pill */}
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                  <p className="text-[13px] font-bold text-slate-800">{l.title}</p>
                                  <p className="text-[11.5px] text-slate-500 mt-0.5">{l.subjects?.name ?? '—'} · {eduName}</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <Badge variant={l.attendance_locked ? 'success' : 'warning'}>
                                    {l.attendance_locked ? 'Locked' : 'Open'}
                                  </Badge>
                                  {!l.attendance_locked && (
                                    <button onClick={() => lock(l.id)} disabled={locking === l.id}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[10.5px] font-medium transition">
                                      <Lock size={10} /> {locking === l.id ? '…' : 'Lock'}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                {l.year_levels && <Badge variant="info">{l.year_levels.name}</Badge>}
                                {l.class_groups && <Badge variant="purple">Arm {l.class_groups.name}</Badge>}
                                {!l.class_groups && l.lesson_type === 'one_to_one' && <Badge variant="secondary">1:1</Badge>}
                                {examName && <Badge variant="warning">{examName}</Badge>}
                              </div>
                              {l.notes && <p className="text-[11px] text-slate-400 mt-1.5 italic">{l.notes}</p>}
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
        ) : (
          /* ── List view ── */
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {lessons.length === 0
              ? <EmptyState message="No lessons yet." icon={<Calendar size={20} />} />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr>
                        {['Date','Title','Educator','Year','Arm','Subject','Attendance',''].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lessons.map((l: any) => {
                        const eduName = l.lesson_educators?.[0]?.educators?.users?.name ?? '—'
                        return (
                          <tr key={l.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{fmt(l.lesson_date)}</td>
                            <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[150px] truncate">{l.title}</td>
                            <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{eduName}</td>
                            <td className="px-4 py-2.5">{l.year_levels ? <Badge variant="info">{l.year_levels.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                            <td className="px-4 py-2.5">{l.class_groups ? <Badge variant="purple">Arm {l.class_groups.name}</Badge> : <span className="text-slate-400 text-[11px]">{l.lesson_type === 'one_to_one' ? '1:1' : 'All'}</span>}</td>
                            <td className="px-4 py-2.5 text-slate-600">{l.subjects?.name ?? '—'}</td>
                            <td className="px-4 py-2.5"><Badge variant={l.attendance_locked ? 'success' : 'warning'}>{l.attendance_locked ? 'Locked' : 'Open'}</Badge></td>
                            <td className="px-4 py-2.5">
                              {!l.attendance_locked && (
                                <button onClick={() => lock(l.id)} disabled={locking === l.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-medium transition">
                                  <Lock size={10} /> {locking === l.id ? '…' : 'Lock'}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}
      </div>
    </>
  )
}
