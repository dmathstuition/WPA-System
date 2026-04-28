'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'

export function ExportButtons() {
  const [loading, setLoading] = useState('')

  async function download(type: string) {
    setLoading(type)
    try {
      const res = await fetch('/api/admin/export?type=' + type)
      if (!res.ok) { alert('Export failed'); setLoading(''); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = type + '.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Export failed') }
    setLoading('')
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200/60 p-4">
      <p className="text-[12px] font-semibold text-slate-700 mb-3">Export Data</p>
      <div className="space-y-2">
        {[
          { type: 'learners', label: 'Learners' },
          { type: 'attendance', label: 'Attendance' },
          { type: 'scores', label: 'Scores' },
        ].map(({ type, label }) => (
          <button key={type} onClick={() => download(type)} disabled={loading === type}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11.5px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition disabled:opacity-50">
            <Download size={12} />
            {loading === type ? 'Downloading…' : label + ' CSV'}
          </button>
        ))}
      </div>
    </div>
  )
}
