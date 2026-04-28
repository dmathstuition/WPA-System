'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ImpersonateLanding() {
  const params = useSearchParams()
  useEffect(() => {
    if (params?.get('from_admin') === '1') {
      localStorage.setItem('wpa_impersonating', '1')
    }
    window.location.replace('/educator/dashboard')
  }, [params])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-[13px] text-slate-400">Redirecting to tutor portal…</p>
    </div>
  )
}
