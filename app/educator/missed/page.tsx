'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { EmptyState } from '@/components/shared/empty-state'
import { AlertTriangle } from 'lucide-react'

export default function MissedPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Topbar user={{ id:'', name:'Educator', email:'', role:'educator' }}
              title="Missed Submissions" subtitle="Learners who missed assignment deadlines" />
      <div className="p-5">
        {loading ? (
          <div className="py-14 text-center">
            <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          </div>
        ) : (
          <EmptyState message="No missed submissions to display." icon={<AlertTriangle size={20} />} />
        )}
      </div>
    </>
  )
}
