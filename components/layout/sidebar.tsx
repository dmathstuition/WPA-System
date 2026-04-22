'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { SessionUser } from '@/types'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  ClipboardList, Settings, LogOut, ChevronLeft, ChevronRight,
  Award, Upload, FileText, Menu, Layers, X
} from 'lucide-react'

function initials(n: string) { return (n ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }

function getNav(role: string) {
  if (role === 'admin' || role === 'super_admin') return [
    { section: 'Overview', items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }] },
    { section: 'People', items: [{ label: 'Learners', href: '/admin/learners', icon: Users }, { label: 'Tutors', href: '/admin/educators', icon: GraduationCap }] },
    { section: 'Import', items: [{ label: 'Import Learners', href: '/admin/import/learners', icon: Upload }, { label: 'Import Tutors', href: '/admin/import/educators', icon: Upload }] },
    { section: 'Academic', items: [{ label: 'Year Levels', href: '/admin/year-levels', icon: Layers }, { label: 'Class Groups', href: '/admin/class-groups', icon: BookOpen }, { label: 'Exam Groups', href: '/admin/exam-groups', icon: Award }, { label: 'Subjects', href: '/admin/subjects', icon: FileText }] },
    { section: 'System', items: [{ label: 'Settings', href: '/admin/settings', icon: Settings }] },
  ]
  if (role === 'educator') return [
    { section: 'Overview', items: [{ label: 'Dashboard', href: '/educator/dashboard', icon: LayoutDashboard }] },
    { section: 'Teaching', items: [{ label: 'My Lessons', href: '/educator/lessons', icon: Calendar }, { label: 'Assignments', href: '/educator/assignments', icon: ClipboardList }] },
  ]
  return []
}

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const nav = getNav(user.role)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wpa_sb') === '1') setCollapsed(true)
  }, [])

  function toggle() {
    const n = !collapsed; setCollapsed(n)
    localStorage.setItem('wpa_sb', n ? '1' : '0')
  }

  async function doLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    // Replace history so back button can't return to protected pages
    window.location.replace('/login')
  }

  const Inner = () => (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.07] flex-shrink-0 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/25">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12.5px] font-black text-white leading-none truncate">Whyte Pyramid</p>
              <p className="text-[9.5px] text-amber-400 mt-0.5">Academy Portal</p>
            </div>
            <button onClick={toggle} className="text-slate-600 hover:text-slate-400 flex-shrink-0"><ChevronLeft size={14} /></button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2" style={{ scrollbarWidth: 'none' }}>
        {nav.map(g => (
          <div key={g.section}>
            {!collapsed && <p className="px-4 pt-4 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">{g.section}</p>}
            {collapsed && <div className="my-2 mx-3 border-t border-white/[0.06]" />}
            {g.items.map(item => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className={`relative flex items-center gap-2.5 text-[12px] font-medium mx-2 rounded-lg transition-all
                    ${collapsed ? 'justify-center py-2.5' : 'px-3 py-2'}
                    ${active ? 'bg-amber-500/15 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'}`}>
                  {active && !collapsed && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-amber-500" />}
                  <Icon size={15} className={`flex-shrink-0 ${active ? 'text-amber-400' : ''}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {collapsed && (
        <button onClick={toggle} className="flex-shrink-0 flex items-center justify-center py-2 border-t border-white/[0.06] text-slate-600 hover:text-slate-400">
          <ChevronRight size={13} />
        </button>
      )}

      {/* User footer */}
      <div className={`flex-shrink-0 border-t border-white/[0.07] ${collapsed ? 'p-2' : 'p-3'}`}>
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {initials(user.name)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold text-white truncate">{user.name}</p>
                <p className="text-[9.5px] text-slate-500">{user.role === 'super_admin' ? 'Admin' : user.role === 'admin' ? 'Admin' : 'Educator'}</p>
              </div>
              <button onClick={() => setShowLogout(true)} title="Sign out" className="text-slate-600 hover:text-red-400 transition">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
        {collapsed && (
          <button onClick={() => setShowLogout(true)} title="Sign out"
            className="mt-2 w-full flex items-center justify-center py-1.5 text-slate-600 hover:text-red-400 rounded-lg hover:bg-white/5 transition">
            <LogOut size={13} />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-8 h-8 rounded-lg bg-slate-900 shadow-lg flex items-center justify-center text-slate-300">
        <Menu size={15} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      {mobileOpen && <div className="fixed inset-y-0 left-0 z-50 w-[218px] lg:hidden"><Inner /></div>}

      {/* Desktop sidebar */}
      <div className={`hidden lg:block fixed inset-y-0 left-0 z-40 transition-[width] duration-200 ${collapsed ? 'w-14' : 'w-[218px]'}`}>
        <Inner />
      </div>

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
      {showLogout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loggingOut && setShowLogout(false)} />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[360px] overflow-hidden">
            {/* Close button */}
            {!loggingOut && (
              <button onClick={() => setShowLogout(false)}
                className="absolute right-3 top-3 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition z-10">
                <X size={14} />
              </button>
            )}

            <div className="p-7 text-center">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} className="text-red-500" />
              </div>

              <h3 className="text-[17px] font-black text-slate-900">Sign Out?</h3>
              <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to sign out of<br />
                <span className="font-semibold text-slate-700">Whyte Pyramid Academy</span>?
              </p>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowLogout(false)} disabled={loggingOut}
                  className="flex-1 h-10 border border-slate-200 text-slate-700 font-semibold text-[13px] rounded-xl hover:bg-slate-50 transition disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={doLogout} disabled={loggingOut}
                  className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-bold text-[13px] rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {loggingOut ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing out…
                    </>
                  ) : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
