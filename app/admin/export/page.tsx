'use client'
import { Topbar } from '@/components/layout/topbar'
import { ExportButtons } from '@/components/shared/export-buttons'

export default function ExportPage() {
  return (
    <>
      <Topbar user={{ id:'', name:'Admin', email:'', role:'admin' }} title="Export Data" subtitle="Download CSV reports" />
      <div className="p-5 max-w-lg">
        <ExportButtons />
      </div>
    </>
  )
}
