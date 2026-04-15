'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Pencil, Trash2 } from 'lucide-react'

export default function ClassGroupsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [yearLevels, setYearLevels] = useState<any[]>([])
  const [filterYear, setFilterYear] = useState('')
  const [form, setForm] = useState({ id: '', year_level_id: '', name: '' })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    const url = `/api/admin/class-groups${filterYear ? `?year_level_id=${filterYear}` : ''}`
    const r = await fetch(url)
    const data = await r.json()
    // Always ensure it's an array
    setRows(Array.isArray(data) ? data : [])
  }

  async function loadYears() {
    const r = await fetch('/api/admin/year-levels')
    const data = await r.json()
    setYearLevels(Array.isArray(data) ? data : [])
  }

  useEffect(() => { loadYears() }, [])
  useEffect(() => { load() }, [filterYear])

  function reset() {
    setForm({ id: '', year_level_id: '', name: '' })
    setEditing(false)
    setMsg('')
  }

  async function save() {
    if (!form.name.trim() || !form.year_level_id) {
      setMsg('Year level and arm name are required')
      return
    }
    setSaving(true)
    const r = await fetch('/api/admin/class-groups', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (r.ok) { reset(); load() }
    else { const e = await r.json(); setMsg(e.error ?? 'Error') }
    setSaving(false)
  }

  async function del(id: string) {
    if (!confirm('Delete this group?')) return
    const r = await fetch(`/api/admin/class-groups?id=${id}`, { method: 'DELETE' })
    if (r.ok) load()
    else { const e = await r.json(); setMsg(e.error ?? 'Cannot delete — it may have learners assigned') }
  }

  return (
    <>
      <Topbar
        user={{ id: '', name: 'Admin', email: '', role: 'admin' }}
        title="Class Groups"
        subtitle="Manage class arms within each year level"
      />
      <div className="p-5">
        <PageHeader title="Class Groups" count={rows.length} />

        {/* Year filter tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[{ id: '', name: 'All Years' }, ...yearLevels].map(y => (
            <button
              key={y.id}
              onClick={() => setFilterYear(y.id)}
              className={`px-3 py-1 rounded-full text-[11.5px] font-semibold transition border ${
                filterYear === y.id
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
              }`}
            >
              {y.name}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-4">
            {editing ? 'Edit Class Group' : 'Add Class Group'}
          </p>
          {msg && <p className="text-[12px] mb-3 text-red-500 font-medium">{msg}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <Label>Year Level *</Label>
              <select
                value={form.year_level_id}
                onChange={e => setForm(f => ({ ...f, year_level_id: e.target.value }))}
                className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Select year —</option>
                {yearLevels.map(y => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Arm Name *</Label>
              <Input
                className="mt-1"
                placeholder="e.g. A, B, C"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save' : 'Create'}
              </Button>
              {editing && (
                <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {rows.length === 0 ? (
            <EmptyState message="No class groups yet. Add your first arm above." icon={<BookOpen size={20} />} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr>
                    {['Arm', 'Year Level', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-slate-800 text-[13px]">{r.name}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="info">{r.year_levels?.name ?? '—'}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={r.is_active ? 'success' : 'secondary'}>
                          {r.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setForm({ id: r.id, year_level_id: r.year_level_id, name: r.name })
                              setEditing(true)
                            }}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => del(r.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-400 transition"
                          >
                            <Trash2 size={13} />
                          </button>
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
