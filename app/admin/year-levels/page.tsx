'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Layers, Pencil, Trash2 } from 'lucide-react'
import { fetchArray, postJSON } from '@/lib/fetch'

export default function YearLevelsPage() {
  const [rows, setRows]         = useState<any[]>([])
  const [examGroups, setExams]  = useState<any[]>([])
  const [form, setForm]         = useState({ id: '', name: '', sort_order: '0', is_private: false, exam_group_id: '' })
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')

  const load = () => fetchArray('/api/admin/year-levels').then(setRows)
  useEffect(() => {
    load()
    fetchArray('/api/admin/exam-groups').then(setExams)
  }, [])

  function reset() { setForm({ id: '', name: '', sort_order: '0', is_private: false, exam_group_id: '' }); setEditing(false); setMsg('') }

  async function save() {
    if (!form.name.trim()) { setMsg('Name is required'); return }
    setSaving(true)
    const body = { id: form.id, name: form.name.trim(), sort_order: parseInt(form.sort_order) || 0, is_private: form.is_private, exam_group_id: form.exam_group_id || null }
    const { ok, data } = await postJSON('/api/admin/year-levels', body, editing ? 'PUT' : 'POST')
    if (ok) { reset(); load(); setMsg(editing ? 'Updated!' : 'Created!') }
    else setMsg(data.error ?? 'Error')
    setSaving(false)
  }

  async function toggle(row: any) {
    await postJSON('/api/admin/year-levels', { id: row.id, is_active: !row.is_active }, 'PUT')
    load()
  }

  async function del(row: any) {
    if (!confirm('Delete ' + row.name + '?')) return
    const { ok, data } = await postJSON('/api/admin/year-levels', { id: row.id }, 'DELETE')
    if (!ok) setMsg(data.error ?? 'Cannot delete')
    else { load(); setMsg('') }
  }

  return (
    <>
      <Topbar user={{ id: '', name: 'Admin', email: '', role: 'admin' }} title="Year Levels" subtitle="Manage academic year levels and exam group assignments" />
      <div className="p-5">
        <PageHeader title="Year Levels" count={rows.length} />

        {/* Exam group info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-[12px] text-blue-700">
          <strong>Exam Groups:</strong> Assign an exam group to each year level (e.g. Year 6 Private → SATs, Year 11 → GCSE). This is optional — leave blank for standard year levels with no public exam.
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-4">{editing ? 'Edit Year Level' : 'Add Year Level'}</p>
          {msg && <p className="text-[12px] mb-3 font-medium" style={{ color: msg.includes('!') ? '#16a34a' : '#dc2626' }}>{msg}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <Label>Name *</Label>
              <Input className="mt-1" placeholder="e.g. Year 6, Year 11, Private" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input className="mt-1" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-[12.5px] text-slate-600 font-medium">
                <input type="checkbox" checked={form.is_private} onChange={e => setForm(f => ({ ...f, is_private: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
                Private / Online
              </label>
            </div>
            <div className="sm:col-span-2">
              <Label>Exam Group <span className="text-slate-400 font-normal">(optional)</span></Label>
              <select value={form.exam_group_id} onChange={e => setForm(f => ({ ...f, exam_group_id: e.target.value }))}
                className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">— No exam group —</option>
                {examGroups.map((eg: any) => (
                  <option key={eg.id} value={eg.id}>{eg.name}{eg.code ? ' (' + eg.code + ')' : ''}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2 items-end">
              <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}</Button>
              {editing && <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>}
            </div>
          </div>
          {examGroups.length === 0 && (
            <p className="text-[11px] text-slate-400 mt-3">
              No exam groups yet. <a href="/admin/exam-groups" className="text-amber-600 underline">Create exam groups first →</a>
            </p>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {rows.length === 0 ? <EmptyState message="No year levels yet." icon={<Layers size={20} />} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr>
                    {['Name', 'Type', 'Exam Group', 'Order', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{r.name}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={r.is_private ? 'purple' : 'info'}>{r.is_private ? 'Private / Online' : 'Standard'}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        {r.exam_groups ? (
                          <Badge variant="warning">{r.exam_groups.name}{r.exam_groups.code ? ' · ' + r.exam_groups.code : ''}</Badge>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{r.sort_order}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setForm({ id: r.id, name: r.name, sort_order: String(r.sort_order), is_private: r.is_private, exam_group_id: r.exam_group_id ?? '' }); setEditing(true) }}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition"><Pencil size={13} /></button>
                          <button onClick={() => toggle(r)}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition ${r.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                            {r.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => del(r)} className="p-1.5 rounded hover:bg-red-50 text-red-400 transition"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
