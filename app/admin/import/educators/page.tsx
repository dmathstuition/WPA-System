'use client'
import { useState } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { Upload, Download, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ImportEducatorsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError('')
    setResults(null)

    const text = await file.text()
    const lines = text.trim().split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

    const required = ['name', 'email', 'password']
    const missing = required.filter(r => !headers.includes(r))
    if (missing.length) {
      setError(`CSV missing required columns: ${missing.join(', ')}`)
      setLoading(false)
      return
    }

    const imported: string[] = []
    const failed: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => { row[h] = vals[idx] ?? '' })

      if (!row.name || !row.email || !row.password) {
        failed.push(`Row ${i + 1}: missing name, email, or password`)
        continue
      }

      const r = await fetch('/api/admin/educators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: row.name,
          email: row.email,
          password: row.password,
          phone: row.phone ?? '',
          staff_id: row.staff_id ?? '',
          specialization: row.specialization ?? '',
        }),
      })

      if (r.ok) imported.push(row.name)
      else {
        const e = await r.json()
        failed.push(`Row ${i + 1} (${row.name}): ${e.error ?? 'Failed'}`)
      }
    }

    setResults({ imported, failed, total: lines.length - 1 })
    setLoading(false)
  }

  function downloadTemplate() {
    const csv = [
      'name,email,password,phone,staff_id,specialization',
      'Mrs. Amaka Obi,amaka.obi@school.com,Teach@123,08011111111,STAFF-001,Mathematics',
      'Mr. Chidi Nwachukwu,chidi.nw@school.com,Teach@123,08022222222,STAFF-002,English Language',
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'educators-template.csv'
    a.click()
  }

  return (
    <>
      <Topbar
        user={{ id: '', name: 'Admin', email: '', role: 'admin' }}
        title="Import Educators"
        subtitle="Bulk upload educator accounts via CSV"
      />
      <div className="p-5 max-w-2xl">
        <Link href="/admin/educators" className="inline-flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 mb-5 transition">
          <ArrowLeft size={14} /> Back to Educators
        </Link>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5">
          <p className="text-[13px] font-semibold text-amber-800 mb-2">Before you import</p>
          <ul className="text-[12px] text-amber-700 space-y-1.5 list-disc pl-4">
            <li>Download the CSV template and fill it in</li>
            <li>Required columns: <strong>name, email, password</strong></li>
            <li>Optional: phone, staff_id, specialization</li>
            <li>Duplicate emails will be rejected</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-3">Step 1 — Download template</p>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download size={13} /> Download CSV Template
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
          <p className="text-[13px] font-semibold text-slate-800 mb-3">Step 2 — Upload filled CSV</p>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-4 hover:border-amber-300 transition">
            <Upload size={24} className="mx-auto text-slate-400 mb-3" />
            <p className="text-[12.5px] text-slate-500 mb-3">
              {file ? file.name : 'Choose a CSV file'}
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-medium rounded-lg cursor-pointer transition">
              <Upload size={13} /> Browse file
              <input
                type="file" accept=".csv" className="hidden"
                onChange={e => { setFile(e.target.files?.[0] ?? null); setResults(null); setError('') }}
              />
            </label>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-600">
              {error}
            </div>
          )}

          <Button onClick={handleUpload} disabled={!file || loading}>
            <Upload size={13} />
            {loading ? 'Importing…' : 'Import Educators'}
          </Button>
        </div>

        {results && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-[13px] font-semibold text-slate-800 mb-4">
              Import Results — {results.imported.length}/{results.total} imported
            </p>
            {results.imported.length > 0 && (
              <div className="mb-4">
                <p className="text-[11.5px] font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle size={13} /> Imported ({results.imported.length})
                </p>
                <div className="bg-emerald-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {results.imported.map((name: string, i: number) => (
                    <p key={i} className="text-[11.5px] text-emerald-700">{name}</p>
                  ))}
                </div>
              </div>
            )}
            {results.failed.length > 0 && (
              <div>
                <p className="text-[11.5px] font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                  <XCircle size={13} /> Failed ({results.failed.length})
                </p>
                <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {results.failed.map((msg: string, i: number) => (
                    <p key={i} className="text-[11.5px] text-red-600">{msg}</p>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link href="/admin/educators">
                <Button size="sm">View Educators</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
