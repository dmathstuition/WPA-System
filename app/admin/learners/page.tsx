'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Search, Pencil, Trash2, CheckSquare, Square, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { fetchArray, postJSON } from '@/lib/fetch'

function initials(n: string) { return (n??'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) }

export default function LearnersPage() {
  const [rows, setRows]               = useState<any[]>([])
  const [yearLevels, setYears]         = useState<any[]>([])
  const [classGroups, setGroups]       = useState<any[]>([])
  const [search, setSearch]            = useState('')
  const [filterYear, setFilterYear]    = useState('')
  const [filterGroup, setFilterGroup]  = useState('')
  const [filterType, setFilterType]    = useState('')
  const [loading, setLoading]          = useState(true)
  const [selected, setSelected]        = useState<Set<string>>(new Set())
  const [showBulk, setShowBulk]        = useState(false)
  const [bulkYear, setBulkYear]        = useState('')
  const [bulkGroup, setBulkGroup]      = useState('')
  const [bulkSaving, setBulkSaving]    = useState(false)
  const [bulkMsg, setBulkMsg]          = useState('')
  const [deleting, setDeleting]        = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (filterYear) p.set('year_level_id', filterYear)
    if (filterGroup) p.set('class_group_id', filterGroup)
    fetchArray('/api/admin/learners?' + p).then(d => {
      let filtered = d
      if (filterType) filtered = d.filter((r: any) => r.lesson_type === filterType)
      setRows(filtered)
      setLoading(false)
    })
  }, [search, filterYear, filterGroup, filterType])

  useEffect(() => {
    fetchArray('/api/admin/year-levels').then(setYears)
    fetchArray('/api/admin/class-groups').then(setGroups)
  }, [])
  useEffect(() => { load() }, [load])

  function toggleSelect(id: string) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    if (selected.size === rows.length) setSelected(new Set())
    else setSelected(new Set(rows.map(r => r.id)))
  }

  async function bulkMove() {
    if (!bulkYear) { setBulkMsg('Select a year level'); return }
    setBulkSaving(true); setBulkMsg('')
    let ok = 0, fail = 0
    for (const id of selected) {
      const { ok: success } = await postJSON('/api/admin/learners', {
        id, year_level_id: bulkYear, class_group_id: bulkGroup || undefined, action: 'update_class'
      }, 'PUT')
      success ? ok++ : fail++
    }
    setBulkMsg(ok + ' moved' + (fail ? ', ' + fail + ' failed' : ''))
    setBulkSaving(false)
    setSelected(new Set())
    setTimeout(() => { setBulkMsg(''); setShowBulk(false) }, 2000)
    load()
  }

  async function deleteLearner(id: string) {
    if (!confirm('Delete this learner permanently?')) return
    setDeleting(id)
    await postJSON('/api/admin/learners', { id }, 'DELETE')
    setDeleting('')
    load()
  }

  const filtered = rows

  return (
    <>
      <Topbar user={{id:'',name:'Admin',email:'',role:'admin'}} title="Learners" subtitle={loading ? 'Loading…' : filtered.length + ' learner' + (filtered.length!==1?'s':'')} />
      <div className="p-5">
        <PageHeader title="Learners" count={filtered.length}
          secondaryAction={{ label: 'Import CSV', href: '/admin/import/learners' }}
          action={{ label: 'Add Learner', href: '/admin/learners/new' }} />

        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-9 pr-3 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100" />
          </div>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
            className="h-8 px-2 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:border-orange-400">
            <option value="">All Years</option>
            {yearLevels.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
            className="h-8 px-2 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:border-orange-400">
            <option value="">All Arms</option>
            {classGroups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="h-8 px-2 rounded-lg border border-slate-200 text-[12px] bg-white focus:outline-none focus:border-orange-400">
            <option value="">All Types</option>
            <option value="general">General</option>
            <option value="one_to_one">1:1 Private</option>
          </select>
          {(search || filterYear || filterGroup || filterType) && (
            <button onClick={() => { setSearch(''); setFilterYear(''); setFilterGroup(''); setFilterType('') }}
              className="text-[11px] text-slate-500 hover:text-red-500 font-medium px-2">Clear filters</button>
          )}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
            <span className="text-[12px] font-semibold text-orange-800">{selected.size} learner{selected.size > 1 ? 's' : ''} selected</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowBulk(!showBulk)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-[11.5px] font-medium rounded-lg hover:bg-orange-700 transition">
                <ArrowRight size={12} /> Move to class
              </button>
              <button onClick={() => setSelected(new Set())} className="text-[11px] text-orange-600 hover:text-orange-800 font-medium">Deselect all</button>
            </div>
          </div>
        )}

        {/* Bulk move panel */}
        {showBulk && selected.size > 0 && (
          <div className="mb-4 bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-[12.5px] font-semibold text-slate-800 mb-3">Move {selected.size} learner{selected.size > 1 ? 's' : ''} to:</p>
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="text-[10.5px] text-slate-500 font-medium">Year Level *</label>
                <select value={bulkYear} onChange={e => setBulkYear(e.target.value)}
                  className="block mt-1 h-8 px-2 rounded-lg border border-slate-200 text-[12px] bg-white">
                  <option value="">— Select —</option>
                  {yearLevels.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10.5px] text-slate-500 font-medium">Class Arm</label>
                <select value={bulkGroup} onChange={e => setBulkGroup(e.target.value)}
                  className="block mt-1 h-8 px-2 rounded-lg border border-slate-200 text-[12px] bg-white">
                  <option value="">— None —</option>
                  {classGroups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <Button size="sm" onClick={bulkMove} disabled={bulkSaving}>{bulkSaving ? 'Moving…' : 'Apply'}</Button>
              <button onClick={() => setShowBulk(false)} className="text-[11px] text-slate-500 hover:text-slate-700">Cancel</button>
            </div>
            {bulkMsg && <p className="mt-2 text-[11.5px] text-emerald-600 font-medium">{bulkMsg}</p>}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-14 text-center">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[12px] text-slate-400">Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No learners found." icon={<Users size={20} />} />
        ) : (
          <div className="bg-white rounded-lg border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="pl-4 pr-1 py-2.5 text-left w-8">
                      <button onClick={toggleAll} className="text-slate-400 hover:text-slate-600">
                        {selected.size === rows.length && rows.length > 0 ? <CheckSquare size={15} /> : <Square size={15} />}
                      </button>
                    </th>
                    {['Name','Year','Arm','Type','Status',''].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((r: any) => (
                    <tr key={r.id} className={`hover:bg-slate-50/60 ${selected.has(r.id) ? 'bg-orange-50/30' : ''}`}>
                      <td className="pl-4 pr-1 py-2.5">
                        <button onClick={() => toggleSelect(r.id)} className="text-slate-400 hover:text-orange-600">
                          {selected.has(r.id) ? <CheckSquare size={15} className="text-orange-600" /> : <Square size={15} />}
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0">
                            {initials(r.name ?? r.user?.name ?? '?')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">{r.name ?? r.user?.name ?? '—'}</p>
                            <p className="text-[10px] text-slate-400 truncate">{r.email ?? r.user?.email ?? r.admission_number ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{r.year_name ?? r.year_level?.name ?? '—'}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.group_name ?? r.class_group?.name ?? '—'}</td>
                      <td className="px-3 py-2.5"><Badge variant={r.lesson_type === 'one_to_one' ? 'purple' : 'info'}>{r.lesson_type === 'one_to_one' ? '1:1' : 'General'}</Badge></td>
                      <td className="px-3 py-2.5"><Badge variant={r.status === 'active' ? 'success' : 'secondary'}>{r.status}</Badge></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <Link href={'/admin/learners/' + r.id} className="p-1.5 text-slate-400 hover:text-orange-600 rounded hover:bg-orange-50 transition"><Pencil size={13} /></Link>
                          <button onClick={() => deleteLearner(r.id)} disabled={deleting === r.id}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition disabled:opacity-50"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
