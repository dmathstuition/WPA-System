'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

export function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    // Check if the logged-in user's actual DB role is admin but JWT says educator
    fetch('/api/auth/me').then(r => r.json()).then(async (session) => {
      if (session.role === 'educator') {
        // Check if they're actually an admin in the DB
        // We can't query DB from client, but we can check if a return-admin cookie hint exists
        // Simpler: always show the banner on educator pages — if clicking it does nothing for real educators, that's fine
        // Actually: the return-admin API checks the DB. If they're a real educator it redirects to /educator/dashboard (no-op)
        // So we show the banner only if there's a hint. Let's use a simpler approach:
        // Check localStorage for an impersonation flag
        if (localStorage.getItem('wpa_impersonating') === '1') {
          setIsImpersonating(true)
        }
      }
    }).catch(() => {})
  }, [])

  if (!isImpersonating) return null

  return (
    <div className="bg-amber-500 text-white px-4 py-1.5 flex items-center justify-between text-[11.5px] font-medium">
      <span>You are viewing this portal as a tutor (impersonation mode)</span>
      <a href="/api/auth/return-admin" onClick={() => localStorage.removeItem('wpa_impersonating')}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition font-semibold">
        <ArrowLeft size={12} /> Return to Admin
      </a>
    </div>
  )
}
