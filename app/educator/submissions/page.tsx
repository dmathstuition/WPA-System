'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ClipboardList } from 'lucide-react'
import { fetchArray } from '@/lib/fetch'

export default function SubmissionsPage() {
  const [subs, setSubs]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/educator/assignments').then(r => r.json()).then(async (assignments) => {
      const arr = Array.isArray(assignments) ? assignments : []
      setSubs(arr)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <>
      <Topbar user={{ id:'', name:'Educator', email:'', role:'educator' }}
              title="Submissions" subtitle="Track learner submissions across your assignments" />
      <div className="p-5">
        {loading ? (
          <div className="py-14 text-center">
            <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          </div>
        ) : subs.length === 0 ? (
          <EmptyState message="No assignments yet." icon={<ClipboardList size={20} />} />
        ) : (
          <p className="text-[12.5px] text-slate-500">View detailed submission info on each assignment page.</p>
        )}
      </div>
    </>
  )
}
