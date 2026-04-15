'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Pencil } from 'lucide-react'
import { fetchArray, postJSON } from '@/lib/fetch'

export default function SubjectsPage() {
  const [rows, setRows]   = useState<any[]>([])
  const [form, setForm]   = useState({ id:'', name:'', code:'' })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  const load = () => fetchArray('/api/admin/subjects').then(setRows)
  useEffect(() => { load() }, [])
  function reset() { setForm({ id:'', name:'', code:'' }); setEditing(false); setMsg('') }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const { ok, data } = await postJSON('/api/admin/subjects', { id: form.id, name: form.name.trim(), code: form.code.trim()||undefined }, editing ? 'PUT' : 'POST')
    if (ok) { reset(); load() } else setMsg(data.error ?? 'Error')
    setSaving(false)
  }

  async function toggle(row: any) {
    await postJSON('/api/admin/subjects', { id: row.id, is_active: !row.is_active }, 'PUT')
    load()
  }

  return (
    <>
      <Topbar user={{ id:'', name:'Admin', email:'', role:'admin' }} title="Subjects" subtitle="Manage subjects taught across all year levels" />
      <div className="p-5">
        <PageHeader title="Subjects" count={rows.length} />
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-4">{editing ? 'Edit Subject' : 'Add Subject'}</p>
          {msg && <p className="text-[12px] mb-3 text-red-500">{msg}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2"><Label>Subject Name *</Label><Input className="mt-1" placeholder="e.g. Mathematics" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Code</Label><Input className="mt-1" placeholder="e.g. MTH" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
            <div className="sm:col-span-3 flex gap-2">
              <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save' : 'Create'}</Button>
              {editing && <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {rows.length === 0 ? <EmptyState message="No subjects yet." icon={<FileText size={20} />} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead><tr>{['Subject','Code','Status','Actions'].map(h => <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50">{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{r.name}</td>
                      <td className="px-4 py-2.5">{r.code ? <Badge variant="teal">{r.code}</Badge> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-4 py-2.5"><Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          <button onClick={() => { setForm({ id: r.id, name: r.name, code: r.code??'' }); setEditing(true) }} className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><Pencil size={13} /></button>
                          <button onClick={() => toggle(r)} className={`px-2 py-1 rounded text-[11px] font-medium ${r.is_active ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{r.is_active ? 'Deactivate' : 'Activate'}</button>
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
