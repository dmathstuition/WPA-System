'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Users, User } from 'lucide-react'
import Link from 'next/link'
import { fetchArray, postJSON } from '@/lib/fetch'

export default function LearnerFormPage() {
  const params = useParams<{ id: string }>()
  const id    = params?.id ?? 'new'
  const isNew = id === 'new'
  const router = useRouter()

  const [yearLevels, setYears]   = useState<any[]>([])
  const [classGroups, setGroups] = useState<any[]>([])
  const [examGroups, setExams]   = useState<any[]>([])
  const [educators, setEds]      = useState<any[]>([])
  const [subjects, setSubjects]  = useState<any[]>([])
  const [examHint, setExamHint]  = useState('')
  const [saving, setSaving]      = useState(false)
  const [error, setError]        = useState('')

  const [form, setForm] = useState({
    lesson_type: 'general', name: '', email: '', phone: '',
    admission_number: '', date_of_birth: '',
    year_level_id: '', class_group_id: '',
    exam_group_id: '', tutor_id: '', subject_id: '',
    status: 'active', password: ''
  })

  useEffect(() => {
    fetchArray('/api/admin/year-levels').then(setYears)
    fetchArray('/api/admin/exam-groups').then(setExams)
    fetchArray('/api/admin/educators').then(setEds)
    fetchArray('/api/admin/subjects').then(setSubjects)
    if (!isNew) {
      fetchArray('/api/admin/learners').then(all => {
        const found = all.find((l: any) => l.id === id)
        if (!found) return
        setForm({
          lesson_type:      found.lesson_type      ?? 'general',
          name:             found.users?.name      ?? '',
          email:            found.users?.email     ?? '',
          phone:            found.users?.phone     ?? '',
          admission_number: found.admission_number ?? '',
          date_of_birth:    found.date_of_birth    ?? '',
          year_level_id:    found.year_level_id    ?? '',
          class_group_id:   found.class_group_id   ?? '',
          exam_group_id:    found.exam_group_id    ?? '',
          tutor_id:         found.tutor_id         ?? '',
          subject_id:       found.subject_id       ?? '',
          status:           found.status           ?? 'active',
          password:         ''
        })
        if (found.year_level_id)
          fetchArray('/api/admin/class-groups?year_level_id=' + found.year_level_id).then(setGroups)
      })
    }
  }, [id, isNew])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function onYearChange(yearId: string) {
    setForm(f => ({ ...f, year_level_id: yearId, class_group_id: '' }))
    setGroups([]); setExamHint('')
    if (!yearId) return
    fetchArray('/api/admin/class-groups?year_level_id=' + yearId).then(setGroups)
    const yl = yearLevels.find((y: any) => y.id === yearId)
    if (yl?.exam_groups?.name)
      setExamHint(yl.exam_groups.name + (yl.exam_groups.code ? ' (' + yl.exam_groups.code + ')' : ''))
  }

  const isOTO         = form.lesson_type === 'one_to_one'
  const selectedTutor = educators.find((e: any) => e.id === form.tutor_id)

  // For 1:1, get the tutor's specialization to suggest a subject
  const tutorSpecialization = selectedTutor?.specialization ?? ''

  async function save() {
    setError('')
    if (!form.name.trim())              { setError('Name is required'); return }
    if (!form.email.trim())             { setError('Email is required'); return }
    if (!isOTO && !form.year_level_id)  { setError('Year level required for general learners'); return }
    if (!isOTO && !form.class_group_id) { setError('Class arm required for general learners'); return }
    if (isOTO  && !form.tutor_id)       { setError('Tutor required for 1:1 learners'); return }
    setSaving(true)
    const body = isNew ? { ...form } : { id, ...form }
    const { ok, data } = await postJSON('/api/admin/learners', body, isNew ? 'POST' : 'PUT')
    if (ok) router.push('/admin/learners')
    else { setError(data?.error ?? 'Something went wrong'); setSaving(false) }
  }

  return (
    <>
      <Topbar user={{ id:'', name:'Admin', email:'', role:'admin' }}
              title={isNew ? 'Add Learner' : 'Edit Learner'} />
      <div className="p-5 max-w-2xl">
        <Link href="/admin/learners"
              className="inline-flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 mb-5 transition">
          <ArrowLeft size={14} /> Back to Learners
        </Link>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-600 font-medium">{error}</div>
        )}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
          <p className="text-[14px] font-bold text-slate-900">{isNew ? 'New Learner Account' : 'Edit Learner'}</p>

          {/* Lesson type toggle */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-widest mb-3">Lesson Type *</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { val:'general',    Icon:Users, label:'General Class',  sub:'Group lessons by year & arm', color:'amber' },
                { val:'one_to_one', Icon:User,  label:'One-to-One',     sub:'Private individual tuition',  color:'purple' },
              ] as const).map(({ val, Icon, label, sub, color }) => {
                const active = form.lesson_type === val
                return (
                  <button key={val} type="button"
                    onClick={() => setForm(f => ({
                      ...f, lesson_type: val,
                      class_group_id: val === 'one_to_one' ? '' : f.class_group_id,
                      tutor_id: val === 'general' ? '' : f.tutor_id,
                    }))}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition text-left ${
                      active ? (color === 'amber' ? 'border-amber-500 bg-amber-50' : 'border-purple-500 bg-purple-50')
                             : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      active ? (color === 'amber' ? 'bg-amber-500 text-white' : 'bg-purple-500 text-white')
                             : 'bg-slate-100 text-slate-500'
                    }`}><Icon size={16} /></div>
                    <div>
                      <p className={`text-[12.5px] font-bold ${active ? (color === 'amber' ? 'text-amber-800' : 'text-purple-800') : 'text-slate-700'}`}>{label}</p>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">{sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Personal details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Full Name *</Label>
              <Input className="mt-1" placeholder="e.g. Chukwuemeka Bright"
                     value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input className="mt-1" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <Label>Admission Number</Label>
              <Input className="mt-1" placeholder="ADM-2024-001" value={form.admission_number} onChange={e => set('admission_number', e.target.value)} />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input className="mt-1" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
            </div>
          </div>

          {/* General class fields */}
          {!isOTO && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
              <p className="col-span-2 text-[10.5px] font-bold text-amber-700 uppercase tracking-widest">Class Assignment</p>
              <div>
                <Label>Year Level *</Label>
                <select value={form.year_level_id} onChange={e => onYearChange(e.target.value)}
                  className="mt-1 w-full h-9 rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">— Select year —</option>
                  {yearLevels.map((y: any) => (
                    <option key={y.id} value={y.id}>
                      {y.name}{y.is_private ? ' (Private)' : ''}{y.exam_groups ? ' · ' + y.exam_groups.name : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Class Arm *</Label>
                <select value={form.class_group_id} onChange={e => set('class_group_id', e.target.value)}
                  disabled={!form.year_level_id}
                  className="mt-1 w-full h-9 rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                  <option value="">— Select arm —</option>
                  {classGroups.map((g: any) => <option key={g.id} value={g.id}>Arm {g.name}</option>)}
                </select>
              </div>
              {examHint && (
                <div className="col-span-2 flex items-center gap-2 px-3 py-2 bg-amber-100 border border-amber-200 rounded-lg">
                  <span className="text-[11px] font-bold text-amber-700">Exam Group:</span>
                  <span className="text-[12px] font-bold text-amber-800">{examHint}</span>
                </div>
              )}
            </div>
          )}

          {/* One-to-one fields */}
          {isOTO && (
            <div className="space-y-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
              <p className="text-[10.5px] font-bold text-purple-700 uppercase tracking-widest">1:1 Assignment</p>

              {/* Tutor */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Label>Assigned Tutor *</Label>
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">Required</span>
                </div>
                <select value={form.tutor_id} onChange={e => set('tutor_id', e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">— Select a tutor —</option>
                  {educators.map((ed: any) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.users?.name ?? 'Unknown'}{ed.specialization ? ' · ' + ed.specialization : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tutor info card */}
              {selectedTutor && (
                <div className="bg-white border border-purple-200 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                    {(selectedTutor.users?.name ?? '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-slate-800">{selectedTutor.users?.name}</p>
                    {tutorSpecialization && (
                      <p className="text-[11px] text-purple-600 mt-0.5">Specialization: {tutorSpecialization}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Subject for this 1:1 learner */}
              <div>
                <Label>
                  Subject for this Learner
                  <span className="text-slate-400 font-normal ml-1">
                    — 1:1 tutors can teach multiple subjects to different learners
                  </span>
                </Label>
                <select value={form.subject_id} onChange={e => set('subject_id', e.target.value)}
                  className="mt-1 w-full h-9 rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">— Select subject —</option>
                  {subjects.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.name === tutorSpecialization ? ' ⭐ (tutor specialization)' : ''}
                    </option>
                  ))}
                </select>
                {tutorSpecialization && (
                  <p className="text-[10.5px] text-purple-600 mt-1">
                    Tutor specializes in <strong>{tutorSpecialization}</strong> — but can also teach other subjects in 1:1 sessions.
                  </p>
                )}
              </div>

              {/* Year level for reporting */}
              <div>
                <Label>Year Level <span className="text-slate-400 font-normal">(for reporting & exam group detection)</span></Label>
                <select value={form.year_level_id} onChange={e => onYearChange(e.target.value)}
                  className="mt-1 w-full h-9 rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">— Select year level —</option>
                  {yearLevels.map((y: any) => (
                    <option key={y.id} value={y.id}>
                      {y.name}{y.is_private ? ' (Private)' : ''}{y.exam_groups ? ' · ' + y.exam_groups.name : ''}
                    </option>
                  ))}
                </select>
                {examHint && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg mt-2">
                    <span className="text-[11px] font-bold text-amber-700">Exam Group:</span>
                    <span className="text-[12px] font-bold text-amber-800">{examHint}</span>
                  </div>
                )}
              </div>

              {/* Exam group override */}
              <div>
                <Label>Exam Group Override <span className="text-slate-400 font-normal">(optional)</span></Label>
                <select value={form.exam_group_id} onChange={e => set('exam_group_id', e.target.value)}
                  className="mt-1 w-full h-9 rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">— Use from year level —</option>
                  {examGroups.map((eg: any) => (
                    <option key={eg.id} value={eg.id}>{eg.name}{eg.code ? ' (' + eg.code + ')' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Status + Password */}
          <div className="grid grid-cols-2 gap-4">
            {!isNew && (
              <div>
                <Label>Status</Label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {['active','inactive','suspended'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className={!isNew ? '' : 'col-span-2'}>
              <Label>Password <span className="text-slate-400 font-normal text-[10.5px]">
                {isNew ? '(default: Password@123)' : '(blank = keep)'}
              </span></Label>
              <Input className="mt-1" type="password" minLength={8}
                     placeholder={isNew ? 'Optional' : 'Leave blank to keep'}
                     value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving...' : isNew ? 'Create Learner' : 'Save Changes'}
            </Button>
            <Button variant="ghost" asChild><Link href="/admin/learners">Cancel</Link></Button>
          </div>
        </div>
      </div>
    </>
  )
}
