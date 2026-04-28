'use client'
import { SessionUser } from '@/types'
import { Bell, X, CheckCheck } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

function timeAgo(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return Math.floor(s/60) + 'm'
  if (s < 86400) return Math.floor(s/3600) + 'h'
  return Math.floor(s/86400) + 'd'
}

export function Topbar({ user, title, subtitle }: { user: SessionUser; title: string; subtitle?: string }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const [unread, setUnread] = useState(0)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/notifications'); if (!r.ok) return
      const d = await r.json(); setNotifs(d.notifications ?? []); setUnread(d.unread ?? 0)
    } catch {}
  }, [])

  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv) }, [load])

  async function markRead(id: string) {
    setNotifs(n => n.map(x => x.id === id ? {...x, is_read:true} : x)); setUnread(u => Math.max(0, u-1))
    fetch('/api/notifications', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'read',id}) })
  }
  async function markAll() {
    setNotifs(n => n.map(x => ({...x, is_read:true}))); setUnread(0)
    fetch('/api/notifications', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'read_all'}) })
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200/60 flex items-center gap-4 px-6 sticky top-0 z-30">
      <div className="w-8 lg:hidden" />
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-semibold text-slate-900 tracking-[-0.01em]">{title}</h1>
        {subtitle && <p className="text-[12px] text-slate-500 leading-none mt-0.5 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-400 tabular-nums hidden sm:block">
          {new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
        </span>

        {/* Bell */}
        <div className="relative">
          <button onClick={() => { setOpen(!open); if (!open) load() }}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <Bell size={16} strokeWidth={1.8} />
            {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-800">Notifications {unread > 0 && <span className="text-orange-500">({unread})</span>}</span>
                  <div className="flex gap-1">
                    {unread > 0 && <button onClick={markAll} className="text-[10.5px] text-orange-600 hover:text-orange-700 font-medium px-1.5 py-0.5 rounded hover:bg-orange-50 transition">Mark all read</button>}
                    <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 p-0.5"><X size={13} /></button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto scrollbar-thin">
                  {notifs.length === 0 ? (
                    <div className="py-8 text-center"><p className="text-[12px] text-slate-400">No notifications</p></div>
                  ) : notifs.map(n => (
                    <button key={n.id} onClick={() => !n.is_read && markRead(n.id)}
                      className={`w-full text-left px-4 py-2.5 border-b border-slate-50 flex items-start gap-2.5 transition ${n.is_read ? 'opacity-50' : 'hover:bg-slate-50'}`}>
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-orange-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] text-slate-700 leading-snug">{n.message ?? n.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.created_at)}{n.tutor_name ? ' · '+n.tutor_name : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-semibold text-white tracking-wide" title={user.name}>
          {(user.name??'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
        </div>
      </div>
    </header>
  )
}
