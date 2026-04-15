'use client'
import { useState } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { Upload, Download, CheckCircle, XCircle, ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'

export default function ImportLearnersPage() {
  const [file, setFile]       = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError]     = useState('')

  async function handleUpload() {
    if (!file) return
    setLoading(true); setError(''); setResults(null)

    const text    = await file.text()
    const lines   = text.trim().split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))

    if (!headers.includes('name') || !headers.includes('email')) {
      setError('CSV must have at least: name, email columns')
      setLoading(false); return
    }

    const imported: string[] = []
    const failed: string[]   = []

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => { row[h] = vals[idx] ?? '' })

      if (!row.name || !row.email) { failed.push('Row ' + (i+1) + ': missing name or email'); continue }

      const isOTO = (row.lesson_type ?? '').toLowerCase() === 'one_to_one'

      if (!isOTO && !row.year_level_id) { failed.push('Row ' + (i+1) + ' (' + row.name + '): general learner needs year_level_id'); continue }
      if (!isOTO && !row.class_group_id) { failed.push('Row ' + (i+1) + ' (' + row.name + '): general learner needs class_group_id'); continue }

      const body: Record<string, string> = {
        name:             row.name,
        email:            row.email,
        phone:            row.phone            ?? '',
        admission_number: row.admission_number ?? '',
        date_of_birth:    row.date_of_birth    ?? '',
        lesson_type:      isOTO ? 'one_to_one' : 'general',
        year_level_id:    row.year_level_id    ?? '',
        class_group_id:   row.class_group_id   ?? '',
        exam_group_id:    row.exam_group_id    ?? '',
        password:         row.password         || 'Password@123',
      }

      const r = await fetch('/api/admin/learners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (r.ok) imported.push(row.name)
      else {
        const e = await r.json()
        failed.push('Row ' + (i+1) + ' (' + row.name + '): ' + (e.error ?? 'Failed'))
      }
    }

    setResults({ imported, failed, total: lines.length - 1 })
    setLoading(false)
  }

  function downloadTemplate() {
    const rows = [
      'name,email,phone,admission_number,date_of_birth,lesson_type,year_level_id,class_group_id,exam_group_id,password',
      '# General class learner — needs year_level_id and class_group_id (get UUIDs from Supabase or admin pages)',
      'John Doe,john@example.com,08012345678,ADM-001,2015-04-12,general,PASTE_YEAR_UUID,PASTE_GROUP_UUID,,Password@123',
      '# One-to-one learner — year_level_id and class_group_id can be blank, exam_group_id optional',
      'Jane Smith,jane@example.com,08087654321,ADM-002,2012-06-20,one_to_one,,,PASTE_EXAM_GROUP_UUID,Password@123',
    ].join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'learners-import-template.csv'
    a.click()
  }

  return (
    <>
      <Topbar user={{ id: '', name: 'Admin', email: '', role: 'admin' }}
              title="Import Learners" subtitle="Bulk upload learner accounts via CSV" />
      <div className="p-5 max-w-2xl">
        <Link href="/admin/learners"
              className="inline-flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 mb-5 transition">
          <ArrowLeft size={14} /> Back to Learners
        </Link>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5 space-y-3">
          <p className="text-[13px] font-bold text-blue-800">CSV Format Guide</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-[11.5px] font-bold text-amber-700 mb-1.5 flex items-center gap-1"><span>🏫</span> General Class Learner</p>
              <p className="text-[11px] text-slate-600">Set <code className="bg-slate-100 px-1 rounded">lesson_type=general</code></p>
              <p className="text-[11px] text-slate-600 mt-0.5">Requires <code className="bg-slate-100 px-1 rounded">year_level_id</code> and <code className="bg-slate-100 px-1 rounded">class_group_id</code></p>
              <p className="text-[11px] text-slate-400 mt-0.5">exam_group_id is optional</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-[11.5px] font-bold text-purple-700 mb-1.5 flex items-center gap-1"><span>👤</span> One-to-One Learner</p>
              <p className="text-[11px] text-slate-600">Set <code className="bg-slate-100 px-1 rounded">lesson_type=one_to_one</code></p>
              <p className="text-[11px] text-slate-600 mt-0.5">year_level_id and class_group_id can be blank</p>
              <p className="text-[11px] text-slate-400 mt-0.5">exam_group_id optional (SATs, GCSE etc)</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <Info size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">
              Get the UUID values for year_level_id, class_group_id, and exam_group_id from
              the Year Levels, Class Groups, and Exam Groups admin pages, or from Supabase → Table Editor.
            </p>
          </div>
        </div>

        {/* Step 1 */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
          <p className="text-[13px] font-semibold text-slate-800 mb-3">Step 1 — Download template</p>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download size={13} /> Download CSV Template
          </Button>
          <p className="text-[11px] text-slate-400 mt-2">
            The template includes examples for both general and one-to-one learners with instructions in comments.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
          <p className="text-[13px] font-semibold text-slate-800 mb-3">Step 2 — Upload your filled CSV</p>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-4 hover:border-amber-300 transition cursor-pointer"
               onClick={() => document.getElementById('csv-input')?.click()}>
            <Upload size={24} className="mx-auto text-slate-400 mb-2" />
            <p className="text-[12.5px] text-slate-500 font-medium">{file ? file.name : 'Click to choose a CSV file'}</p>
            <p className="text-[11px] text-slate-400 mt-1">or drag and drop</p>
            <input id="csv-input" type="file" accept=".csv" className="hidden"
                   onChange={e => { setFile(e.target.files?.[0] ?? null); setResults(null); setError('') }} />
          </div>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-600">{error}</div>}
          <Button onClick={handleUpload} disabled={!file || loading}>
            <Upload size={13} /> {loading ? 'Importing…' : 'Import Learners'}
          </Button>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-[13px] font-bold text-slate-800 mb-4">
              Results — {results.imported.length} of {results.total} imported successfully
            </p>
            {results.imported.length > 0 && (
              <div className="mb-4">
                <p className="text-[11.5px] font-bold text-emerald-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle size={13} /> Imported ({results.imported.length})
                </p>
                <div className="bg-emerald-50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-0.5">
                  {results.imported.map((name: string, i: number) => (
                    <p key={i} className="text-[11.5px] text-emerald-700">{name}</p>
                  ))}
                </div>
              </div>
            )}
            {results.failed.length > 0 && (
              <div>
                <p className="text-[11.5px] font-bold text-red-600 mb-2 flex items-center gap-1.5">
                  <XCircle size={13} /> Failed ({results.failed.length})
                </p>
                <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-0.5">
                  {results.failed.map((msg: string, i: number) => (
                    <p key={i} className="text-[11.5px] text-red-600">{msg}</p>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link href="/admin/learners"><Button size="sm">View All Learners →</Button></Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
