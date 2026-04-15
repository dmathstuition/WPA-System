'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Search, Pencil, X, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { fetchArray, postJSON } from '@/lib/fetch'

function initials(name: string) {
  return (name ?? '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)
}

const BLANK = { name:'', email:'', phone:'', staff_id:'', specialization:'', password:'' }

export default function EducatorsPage() {
  const [rows, setRows]         = useState<any[]>([])
  const [years, setYears]       = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState('')
  const [form, setForm]         = useState({ ...BLANK })
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  // Class assignment panel
  const [classPanel, setClassPanel]   = useState<string|null>(null) // educator id
  const [classGroups, setClassGroups] = useState<any[]>([])
  const [classes, setClasses]         = useState<any[]>([]) // assigned classes
  const [newClass, setNewClass]       = useState({ year_level_id:'', class_group_id:'', lesson_type:'general', subject_id:'' })
  const [addingClass, setAddingClass] = useState(false)
  const [impersonating, setImpersonating] = useState<string|null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    fetchArray('/api/admin/educators' + (search ? '?search=' + encodeURIComponent(search) : ''))
      .then(d => { setRows(d); setLoading(false) })
  }, [search])

  useEffect(() => {
    fetchArray('/api/admin/year-levels').then(setYears)
    fetchArray('/api/admin/subjects').then(setSubjects)
  }, [])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  function reset() { setForm({ ...BLANK }); setEditId(''); setShowForm(false); setMsg('') }
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.name || !form.email) { setMsg('Name and email required'); return }
    if (!editId && !form.password) { setMsg('Password required'); return }
    setSaving(true); setMsg('')
    const body = editId ? { id: editId, ...form } : form
    const { ok, data } = await postJSON('/api/admin/educators', body, editId ? 'PUT' : 'POST')
    if (ok) { reset(); load() } else setMsg(data.error ?? 'Error')
    setSaving(false)
  }

  async function openClassPanel(edu: any) {
    setClassPanel(edu.id)
    setClasses([])
    setNewClass({ year_level_id:'', class_group_id:'', lesson_type:'general', subject_id:'' })
    const data = await fetchArray('/api/admin/educator-classes?educator_id=' + edu.id)
    setClasses(data)
  }

  async function onYearForClass(yearId: string) {
    setNewClass(c => ({ ...c, year_level_id: yearId, class_group_id: '' }))
    if (yearId) fetchArray('/api/admin/class-groups?year_level_id=' + yearId).then(setClassGroups)
    else setClassGroups([])
  }

  async function addClass() {
    if (!newClass.year_level_id) return
    setAddingClass(true)
    const { ok, data } = await postJSON('/api/admin/educator-classes', { educator_id: classPanel, ...newClass })
    if (ok) {
      setClasses(await fetchArray('/api/admin/educator-classes?educator_id=' + classPanel))
      setNewClass({ year_level_id:'', class_group_id:'', lesson_type:'general', subject_id:'' })
    } else setMsg(data.error ?? 'Error adding class')
    setAddingClass(false)
  }

  async function removeClass(id: string) {
    await postJSON('/api/admin/educator-classes', { id }, 'DELETE')
    setClasses(await fetchArray('/api/admin/educator-classes?educator_id=' + classPanel))
  }

  async function impersonate(educatorId: string) {
    setImpersonating(educatorId)
    const { ok, data } = await postJSON('/api/admin/impersonate', { educator_id: educatorId })
    if (ok) window.open('/educator/dashboard?token=' + data.token, '_blank')
    else setMsg(data.error ?? 'Cannot impersonate')
    setImpersonating(null)
  }

  return (
    <>
      <Topbar user={{ id:'', name:'Admin', email:'', role:'admin' }}
              title="Educators" subtitle="Manage tutors and their class assignments" />
      <div className="p-5">
        <PageHeader title="Educators" count={rows.length}
          secondaryAction={{ label:'Import CSV', href:'/admin/import/educators' }}
          action={{ label:'Add Educator', onClick: () => { reset(); setShowForm(true) } }} />

        {/* Add/Edit form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-semibold text-slate-800">{editId ? 'Edit Educator' : 'New Educator'}</p>
              <button onClick={reset} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            {msg && <p className="text-[12px] mb-3 text-red-500 font-medium">{msg}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1"><Label>Full Name *</Label><Input className="mt-1" placeholder="Mrs. Adaeze Okonkwo" value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div className="col-span-2 sm:col-span-1"><Label>Email *</Label><Input className="mt-1" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div><Label>Staff ID</Label><Input className="mt-1" value={form.staff_id} onChange={e => set('staff_id', e.target.value)} /></div>
              <div className="col-span-2"><Label>Specialization</Label><Input className="mt-1" placeholder="e.g. Mathematics, Sciences" value={form.specialization} onChange={e => set('specialization', e.target.value)} /></div>
              <div className="col-span-2">
                <Label>Password {editId ? <span className="text-slate-400 font-normal">(blank = keep)</span> : <span className="text-red-500">*</span>}</Label>
                <Input className="mt-1" type="password" value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div className="col-span-2 flex gap-2">
                <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : editId ? 'Save' : 'Create'}</Button>
                <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 relative max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search educators…" className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? <p className="text-[12px] text-slate-400 py-8 text-center">Loading…</p>
            : rows.length === 0 ? <EmptyState message="No educators yet." icon={<GraduationCap size={20} />} />
            : rows.map((r: any) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Educator header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {initials(r.users?.name ?? '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-800">{r.users?.name}</p>
                  <p className="text-[11px] text-slate-400">{r.users?.email}{r.specialization ? ' · ' + r.specialization : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Admin impersonates tutor — opens tutor portal in new tab */}
                  <button onClick={() => impersonate(r.id)} disabled={impersonating === r.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-[11.5px] font-medium rounded-lg transition">
                    <ExternalLink size={12} />
                    {impersonating === r.id ? 'Opening…' : 'View Portal'}
                  </button>
                  <button onClick={() => { setEditId(r.id); setForm({ name: r.users?.name ?? '', email: r.users?.email ?? '', phone: r.users?.phone ?? '', staff_id: r.staff_id ?? '', specialization: r.specialization ?? '', password: '' }); setShowForm(true) }}
                    className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition">
                    <Pencil size={13} />
                  </button>
                </div>
              </div>

              {/* Classes section */}
              <div className="px-5 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Assigned Classes</p>
                  <button onClick={() => classPanel === r.id ? setClassPanel(null) : openClassPanel(r)}
                    className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1">
                    <Plus size={11} /> Manage
                  </button>
                </div>

                {/* Assigned classes chips */}
                {(r.educator_classes ?? []).length === 0
                  ? <p className="text-[11.5px] text-slate-400 italic">No classes assigned yet</p>
                  : (
                    <div className="flex flex-wrap gap-1.5">
                      {(r.educator_classes ?? []).map((c: any) => (
                        <div key={c.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                          <span className="text-[11px] font-semibold text-slate-700">
                            {c.year_levels?.name ?? '?'}{c.class_groups?.name ? ' · Arm ' + c.class_groups.name : ''}
                          </span>
                          <Badge variant={c.lesson_type === 'one_to_one' ? 'purple' : 'info'} style={{ fontSize:'9px', padding:'1px 5px' }}>
                            {c.lesson_type === 'one_to_one' ? '1:1' : 'General'}
                          </Badge>
                          {c.subjects?.name && <span className="text-[10px] text-slate-400">{c.subjects.name}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                {/* Class assignment panel */}
                {classPanel === r.id && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <p className="text-[12px] font-bold text-slate-700">Add a class assignment</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <Label>Year *</Label>
                        <select value={newClass.year_level_id} onChange={e => onYearForClass(e.target.value)}
                          className="mt-1 w-full h-8 rounded-lg border border-input bg-white px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-ring">
                          <option value="">— Year —</option>
                          {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Arm</Label>
                        <select value={newClass.class_group_id} onChange={e => setNewClass(c => ({ ...c, class_group_id: e.target.value }))}
                          disabled={!newClass.year_level_id}
                          className="mt-1 w-full h-8 rounded-lg border border-input bg-white px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50">
                          <option value="">— All arms —</option>
                          {classGroups.map((g: any) => <option key={g.id} value={g.id}>Arm {g.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Type</Label>
                        <select value={newClass.lesson_type} onChange={e => setNewClass(c => ({ ...c, lesson_type: e.target.value }))}
                          className="mt-1 w-full h-8 rounded-lg border border-input bg-white px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-ring">
                          <option value="general">General</option>
                          <option value="one_to_one">1:1</option>
                        </select>
                      </div>
                      <div>
                        <Label>Subject</Label>
                        <select value={newClass.subject_id} onChange={e => setNewClass(c => ({ ...c, subject_id: e.target.value }))}
                          className="mt-1 w-full h-8 rounded-lg border border-input bg-white px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-ring">
                          <option value="">— Any —</option>
                          {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <Button size="sm" onClick={addClass} disabled={addingClass || !newClass.year_level_id}>
                      {addingClass ? 'Adding…' : 'Add Class'}
                    </Button>

                    {/* Existing classes list */}
                    {classes.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-200">
                        {classes.map((c: any) => (
                          <div key={c.id} className="flex items-center gap-2 text-[11.5px]">
                            <span className="font-semibold text-slate-700">{c.year_levels?.name}{c.class_groups?.name ? ' · Arm ' + c.class_groups.name : ''}</span>
                            <Badge variant={c.lesson_type === 'one_to_one' ? 'purple' : 'info'} style={{ fontSize:'9px' }}>{c.lesson_type === 'one_to_one' ? '1:1' : 'General'}</Badge>
                            {c.subjects?.name && <span className="text-slate-400">{c.subjects.name}</span>}
                            <button onClick={() => removeClass(c.id)} className="ml-auto text-red-400 hover:text-red-600">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
