'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Users, Search, Pencil, Lock, Unlock, X, User } from 'lucide-react'
import Link from 'next/link'
import { fetchArray, postJSON } from '@/lib/fetch'

function initials(name: string) {
  return (name ?? '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function LearnersPage() {
  const [rows, setRows]       = useState<any[]>([])
  const [years, setYears]     = useState<any[]>([])
  const [search, setSearch]   = useState('')
  const [filterYear, setFY]   = useState('')
  const [filterType, setFT]   = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')

  const load = useCallback(async () => {
    setLoading(true); setMsg('')
    const p = new URLSearchParams()
    if (search)     p.set('search', search)
    if (filterYear) p.set('year_level_id', filterYear)
    if (filterType) p.set('lesson_type', filterType)
    const data = await fetchArray('/api/admin/learners?' + p.toString())
    setRows(data)
    setLoading(false)
  }, [search, filterYear, filterType])

  useEffect(() => { fetchArray('/api/admin/year-levels').then(setYears) }, [])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  async function toggleActive(row: any) {
    await postJSON('/api/admin/learners', { id: row.id, is_active: !row.users?.is_active }, 'PUT')
    load()
  }

  const statusVar: Record<string, any> = {
    active: 'success', inactive: 'secondary', suspended: 'destructive'
  }
  const total   = rows.length
  const general = rows.filter(r => (r.lesson_type ?? 'general') !== 'one_to_one').length
  const oto     = rows.filter(r => r.lesson_type === 'one_to_one').length

  return (
    <>
      <Topbar user={{ id:'', name:'Admin', email:'', role:'admin' }}
              title="Learners" subtitle="Manage all learner accounts" />
      <div className="p-5">
        <PageHeader title="Learners" count={total}
          secondaryAction={{ label:'Import CSV', href:'/admin/import/learners' }}
          action={{ label:'Add Learner', href:'/admin/learners/new' }} />

        {/* Type pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { val:'',           label:'All ('     + total   + ')', active: filterType === '' },
            { val:'general',    label:'General (' + general + ')', active: filterType === 'general' },
            { val:'one_to_one', label:'1:1 ('     + oto     + ')', active: filterType === 'one_to_one' },
          ].map(({ val, label, active }) => (
            <button key={val} onClick={() => setFT(val)}
              className={`px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold border transition ${
                active
                  ? val === 'one_to_one' ? 'bg-purple-500 text-white border-purple-500'
                    : val === 'general'  ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Name, email, admission no…" className="pl-8"
                   value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filterYear} onChange={e => setFY(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[150px]">
            <option value="">All Years</option>
            {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          {(search || filterYear || filterType) && (
            <button onClick={() => { setSearch(''); setFY(''); setFT('') }}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition">
              <X size={14} />
            </button>
          )}
        </div>

        {msg && <p className="text-[12px] text-red-500 mb-3">{msg}</p>}

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[12px] text-slate-400">Loading learners…</p>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState message="No learners found." icon={<Users size={20} />} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr>
                    {['Name','Type','Year / Tutor','Arm','Exam Group','Admission No.','Status',''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => {
                    const isOTO = r.lesson_type === 'one_to_one'
                    const name  = r.users?.name ?? '—'
                    return (
                      <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">

                        {/* Name + email */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
                              isOTO ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                                    : 'bg-gradient-to-br from-amber-400 to-orange-500'
                            }`}>{initials(name)}</div>
                            <div>
                              <p className="font-semibold text-slate-800 leading-tight">{name}</p>
                              <p className="text-[10.5px] text-slate-400">{r.users?.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Type badge */}
                        <td className="px-4 py-2.5">
                          {isOTO
                            ? <Badge variant="purple" className="gap-1"><User size={9} />1:1</Badge>
                            : <Badge variant="info" className="gap-1"><Users size={9} />General</Badge>}
                        </td>

                        {/* Year level OR tutor */}
                        <td className="px-4 py-2.5">
                          {isOTO
                            ? r.tutor_name
                              ? <span className="text-[11.5px] font-semibold text-purple-700">{r.tutor_name}</span>
                              : <span className="text-[11px] text-amber-500 font-medium">No tutor</span>
                            : r.year_levels?.name
                              ? <Badge variant="info">{r.year_levels.name}</Badge>
                              : <span className="text-slate-400">—</span>}
                        </td>

                        {/* Arm */}
                        <td className="px-4 py-2.5">
                          {r.class_groups?.name
                            ? <Badge variant="purple">Arm {r.class_groups.name}</Badge>
                            : <span className="text-slate-400">—</span>}
                        </td>

                        {/* Exam group */}
                        <td className="px-4 py-2.5">
                          {r.exam_groups?.name
                            ? <Badge variant="warning">{r.exam_groups.name}</Badge>
                            : <span className="text-slate-400">—</span>}
                        </td>

                        {/* Admission */}
                        <td className="px-4 py-2.5 font-mono text-slate-500 text-[11px]">
                          {r.admission_number ?? '—'}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-2.5">
                          <Badge variant={statusVar[r.status] ?? 'secondary'}>{r.status}</Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <Link href={'/admin/learners/' + r.id}
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition"
                              title="Edit">
                              <Pencil size={13} />
                            </Link>
                            <button onClick={() => toggleActive(r)} title={r.users?.is_active ? 'Lock account' : 'Unlock account'}
                              className={`p-1.5 rounded transition ${r.users?.is_active ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-emerald-50 text-emerald-500'}`}>
                              {r.users?.is_active ? <Lock size={13} /> : <Unlock size={13} />}
                            </button>
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
