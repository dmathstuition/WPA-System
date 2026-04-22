const fs = require('fs')
const path = require('path')
function w(p,c){const d=path.dirname(p);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});fs.writeFileSync(p,c,'utf8');console.log('  ✓',p)}

console.log('━━━ LIVE NOTIFICATION BELL ━━━\n')

// ═══ 1. NOTIFICATION API — GET (list) + PUT (mark read) ═════
console.log('[1/2] API…')
w('app/api/notifications/route.ts', `import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['admin', 'super_admin', 'educator'])

    let userId = session.id

    // For admin, show all submission notifications across all tutors
    if (['admin', 'super_admin'].includes(session.role)) {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('id, type, title, message, link, is_read, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error

      // Enrich with tutor names
      const uids = [...new Set((data ?? []).map((n: any) => n.user_id).filter(Boolean))]
      const { data: users } = uids.length
        ? await supabaseAdmin.from('users').select('id, name').in('id', uids)
        : { data: [] }
      const uMap = new Map((users ?? []).map((u: any) => [u.id, u.name]))

      const enriched = (data ?? []).map((n: any) => ({
        ...n,
        tutor_name: uMap.get(n.user_id) ?? null,
      }))

      const unread = enriched.filter((n: any) => !n.is_read).length
      return NextResponse.json({ notifications: enriched, unread })
    }

    // For educator, show only their notifications
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, type, title, message, link, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw error

    const unread = (data ?? []).filter((n: any) => !n.is_read).length
    return NextResponse.json({ notifications: data ?? [], unread })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireRole(['admin', 'super_admin', 'educator'])
    const { action, id } = await req.json()

    if (action === 'read' && id) {
      await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', id)
      return NextResponse.json({ ok: true })
    }

    if (action === 'read_all') {
      if (['admin', 'super_admin'].includes(session.role)) {
        await supabaseAdmin.from('notifications').update({ is_read: true }).eq('is_read', false)
      } else {
        await supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', session.id).eq('is_read', false)
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
`)

// ═══ 2. TOPBAR WITH LIVE BELL ════════════════════════════════
console.log('[2/2] Topbar…')
w('components/layout/topbar.tsx', `'use client'
import { SessionUser } from '@/types'
import { Bell, Calendar, Check, CheckCheck, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

interface TopbarProps { user: SessionUser; title: string; subtitle?: string }

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function Topbar({ user, title, subtitle }: TopbarProps) {
  const [bellOpen, setBellOpen] = useState(false)
  const [notifs, setNotifs]     = useState<any[]>([])
  const [unread, setUnread]     = useState(0)
  const [loading, setLoading]   = useState(false)
  const [time, setTime]         = useState('')

  // Live clock
  useEffect(() => {
    function tick() { setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })) }
    tick()
    const iv = setInterval(tick, 30000)
    return () => clearInterval(iv)
  }, [])

  // Fetch notifications
  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifs(data.notifications ?? [])
      setUnread(data.unread ?? 0)
    } catch {}
  }, [])

  // Poll every 30s
  useEffect(() => {
    fetchNotifs()
    const iv = setInterval(fetchNotifs, 30000)
    return () => clearInterval(iv)
  }, [fetchNotifs])

  // Mark single as read
  async function markRead(id: string) {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(u => Math.max(0, u - 1))
    await fetch('/api/notifications', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read', id })
    })
  }

  // Mark all as read
  async function markAllRead() {
    setNotifs(ns => ns.map(n => ({ ...n, is_read: true })))
    setUnread(0)
    await fetch('/api/notifications', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read_all' })
    })
  }

  const typeIcon: Record<string, string> = {
    submission: '📝',
    attendance: '✅',
    assignment: '📋',
    system:     '⚙️',
  }

  return (
    <header className="h-[56px] bg-white/80 backdrop-blur-xl border-b border-slate-100/80 flex items-center gap-3 px-5 sticky top-0 z-30 flex-shrink-0">
      <div className="w-8 lg:hidden flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h1 className="text-[14px] font-bold text-slate-900 truncate leading-none">{title}</h1>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Date + clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
          <Calendar size={12} className="text-slate-400" />
          <span className="text-[11px] text-slate-500 font-medium tabular-nums">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-[11px] text-amber-600 font-bold tabular-nums">{time}</span>
        </div>

        {/* Notification bell */}
        <div className="relative">
          <button onClick={() => { setBellOpen(!bellOpen); if (!bellOpen) fetchNotifs() }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition relative">
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-white px-1">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {bellOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                   style={{ maxHeight: 'calc(100vh - 100px)' }}>

                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold text-slate-800">Notifications</p>
                    {unread > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unread > 0 && (
                      <button onClick={markAllRead}
                        className="flex items-center gap-1 px-2 py-1 text-[10.5px] font-semibold text-amber-600 hover:bg-amber-50 rounded-lg transition">
                        <CheckCheck size={12} /> Mark all read
                      </button>
                    )}
                    <button onClick={() => setBellOpen(false)}
                      className="w-6 h-6 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 transition">
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {notifs.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2.5">
                        <Bell size={18} className="text-slate-300" />
                      </div>
                      <p className="text-[12.5px] text-slate-400 font-medium">No notifications yet</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">You'll see alerts here when learners submit work</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {notifs.map((n: any) => (
                        <button key={n.id}
                          onClick={() => { if (!n.is_read) markRead(n.id) }}
                          className={\`w-full text-left px-4 py-3 flex items-start gap-3 transition \${
                            n.is_read ? 'bg-white hover:bg-slate-50' : 'bg-amber-50/40 hover:bg-amber-50/70'
                          }\`}>

                          {/* Icon */}
                          <div className={\`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-sm \${
                            n.is_read ? 'bg-slate-100' : 'bg-amber-100'
                          }\`}>
                            {typeIcon[n.type] ?? '🔔'}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={\`text-[12px] leading-snug \${n.is_read ? 'text-slate-500' : 'text-slate-800 font-semibold'}\`}>
                                {n.message ?? n.title}
                              </p>
                              {!n.is_read && (
                                <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                              {n.tutor_name && (
                                <span className="text-[10px] text-slate-400">· {n.tutor_name}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifs.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-[10.5px] text-slate-400 text-center">
                      Showing latest {notifs.length} notification{notifs.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm shadow-amber-500/20 cursor-default"
          title={user.name + ' (' + user.role + ')'}>
          {(user.name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
      </div>
    </header>
  )
}
`)

console.log('\n━━━ DONE ━━━')
console.log('Run: npm run dev\n')
console.log('Notification bell now:')
console.log('  ✓ Shows real unread count badge (red circle with number)')
console.log('  ✓ Polls /api/notifications every 30 seconds for new alerts')
console.log('  ✓ Dropdown shows all notifications with type icons')
console.log('  ✓ Unread items highlighted in amber background')
console.log('  ✓ Click to mark individual as read (amber dot disappears)')
console.log('  ✓ "Mark all read" button clears everything at once')
console.log('  ✓ Shows relative time (just now, 5m ago, 2h ago, 3d ago)')
console.log('  ✓ Admin sees all notifications + tutor name')
console.log('  ✓ Educator sees only their own notifications')
console.log('  ✓ Empty state when no notifications')