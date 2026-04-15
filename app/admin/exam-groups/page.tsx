'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Award, Pencil, Trash2 } from 'lucide-react'
import { fetchArray, postJSON } from '@/lib/fetch'

export default function ExamGroupsPage() {
  const [rows, setRows]       = useState<any[]>([])
  const [yearLevels, setYLs]  = useState<any[]>([])
  const [form, setForm]       = useState({ id: '', name: '', code: '', description: '' })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  const load = () => fetchArray('/api/admin/exam-groups').then(setRows)
  useEffect(() => {
    load()
    fetchArray('/api/admin/year-levels').then(setYLs)
  }, [])

  function reset() { setForm({ id: '', name: '', code: '', description: '' }); setEditing(false); setMsg('') }

  async function save() {
    if (!form.name.trim()) { setMsg('Name is required'); return }
    setSaving(true)
    const { ok, data } = await postJSON('/api/admin/exam-groups',
      { id: form.id, name: form.name.trim(), code: form.code.trim(), description: form.description.trim() },
      editing ? 'PUT' : 'POST'
    )
    if (ok) { reset(); load(); setMsg(editing ? 'Updated!' : 'Created!') }
    else setMsg(data.error ?? 'Error')
    setSaving(false)
  }

  async function del(row: any) {
    if (!confirm('Delete ' + row.name + '? Year levels using this will lose their exam group.')) return
    const { ok, data } = await postJSON('/api/admin/exam-groups', { id: row.id }, 'DELETE')
    if (!ok) setMsg(data.error ?? 'Cannot delete')
    else { load(); setMsg('') }
  }

  // Which year levels use each exam group
  const usage = (egId: string) => yearLevels.filter((y: any) => y.exam_group_id === egId).map((y: any) => y.name)

  return (
    <>
      <Topbar user={{ id: '', name: 'Admin', email: '', role: 'admin' }} title="Exam Groups" subtitle="Define exam categories — assign to year levels on the Year Levels page" />
      <div className="p-5">
        <PageHeader title="Exam Groups" count={rows.length} />

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-[12px] text-blue-700">
          Create exam groups here (e.g. <strong>SATs</strong>, <strong>GCSE</strong>, <strong>A-Level</strong>), then assign them to year levels on the <a href="/admin/year-levels" className="underline font-semibold">Year Levels page</a>.
          Exam groups are completely optional — year levels without one are treated as standard lessons.
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-4">{editing ? 'Edit Exam Group' : 'Add Exam Group'}</p>
          {msg && <p className="text-[12px] mb-3 font-medium" style={{ color: msg.includes('!') ? '#16a34a' : '#dc2626' }}>{msg}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <Label>Name * <span className="text-slate-400 font-normal">(e.g. SATs, GCSE, A-Level)</span></Label>
              <Input className="mt-1" placeholder="e.g. SATs" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Short Code <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input className="mt-1" placeholder="e.g. SAT, GCSE" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
            </div>
            <div className="sm:col-span-3">
              <Label>Description <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input className="mt-1" placeholder="e.g. UK Key Stage 2 national exam for Year 6" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Exam Group'}</Button>
              {editing && <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {rows.length === 0 ? (
            <EmptyState message="No exam groups yet. Add SATs, GCSE, A-Level etc." icon={<Award size={20} />} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr>
                    {['Name', 'Code', 'Description', 'Used By', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => {
                    const used = usage(r.id)
                    return (
                      <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{r.name}</td>
                        <td className="px-4 py-2.5">{r.code ? <Badge variant="teal">{r.code}</Badge> : <span className="text-slate-400">—</span>}</td>
                        <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate">{r.description || '—'}</td>
                        <td className="px-4 py-2.5">
                          {used.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {used.map((name: string) => <Badge key={name} variant="info">{name}</Badge>)}
                            </div>
                          ) : <span className="text-slate-400 text-[11px]">Not assigned</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setForm({ id: r.id, name: r.name, code: r.code ?? '', description: r.description ?? '' }); setEditing(true) }}
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition"><Pencil size={13} /></button>
                            <button onClick={() => del(r)} className="p-1.5 rounded hover:bg-red-50 text-red-400 transition"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
