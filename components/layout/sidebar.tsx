'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { SessionUser } from '@/types'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  ClipboardList, Settings, LogOut, ChevronLeft, ChevronRight,
  Award, Upload, Layers, Menu, FileText, Calendar
} from 'lucide-react'

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getNav(role: string) {
  if (role === 'admin' || role === 'super_admin') return [
    { section: 'Overview', items: [
      { label: 'Dashboard',       href: '/admin/dashboard',         icon: LayoutDashboard },
    ]},
    { section: 'People', items: [
      { label: 'Learners',        href: '/admin/learners',          icon: Users },
      { label: 'Tutors',          href: '/admin/educators',         icon: GraduationCap },
    ]},
    { section: 'Import', items: [
      { label: 'Import Learners', href: '/admin/import/learners',   icon: Upload },
      { label: 'Import Tutors',   href: '/admin/import/educators',  icon: Upload },
    ]},
    { section: 'Academic', items: [
      { label: 'Year Levels',     href: '/admin/year-levels',       icon: Layers },
      { label: 'Class Groups',    href: '/admin/class-groups',      icon: BookOpen },
      { label: 'Exam Groups',     href: '/admin/exam-groups',       icon: Award },
      { label: 'Subjects',        href: '/admin/subjects',          icon: FileText },
    ]},
    { section: 'System', items: [
      { label: 'Settings',        href: '/admin/settings',          icon: Settings },
    ]},
  ]

  if (role === 'educator') return [
    { section: 'Overview', items: [
      { label: 'Dashboard',       href: '/educator/dashboard',      icon: LayoutDashboard },
    ]},
    { section: 'Teaching', items: [
      { label: 'My Lessons',      href: '/educator/lessons',        icon: Calendar },
      { label: 'Assignments',     href: '/educator/assignments',    icon: ClipboardList },
    ]},
  ]

  return []
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Admin', admin: 'Admin', educator: 'Educator'
}

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname    = usePathname()
  const router      = useRouter()
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navGroups = getNav(user.role)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wpa_sb') === '1')
      setCollapsed(true)
  }, [])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('wpa_sb', next ? '1' : '0')
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const SidebarInner = () => (
    /* Full height column — top-to-bottom with no gaps */
    <div className="h-full flex flex-col bg-slate-900">

      {/* ── Logo ── */}
      <div className={`flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.07] flex-shrink-0 ${collapsed ? 'justify-center px-0' : ''}`}>
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
            <button onClick={toggle} className="text-slate-600 hover:text-slate-400 transition flex-shrink-0">
              <ChevronLeft size={14} />
            </button>
          </div>
        )}
        {collapsed && (
          <button onClick={toggle} className="absolute right-0 top-[52px] w-5 h-5 bg-slate-700 rounded-r-md flex items-center justify-center text-slate-400 hover:text-white transition -mr-5 z-10">
            <ChevronRight size={11} />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2" style={{ scrollbarWidth:'none' }}>
        {navGroups.map(group => (
          <div key={group.section}>
            {!collapsed && (
              <p className="px-4 pt-4 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                {group.section}
              </p>
            )}
            {collapsed && <div className="my-2 mx-3 border-t border-white/[0.06]" />}
            {group.items.map(item => {
              const Icon   = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`relative flex items-center gap-2.5 text-[12px] font-medium transition-all group mx-2 rounded-lg ${
                    collapsed ? 'justify-center py-2.5' : 'px-3 py-2'
                  } ${active
                    ? 'bg-amber-500/15 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}>
                  {active && !collapsed && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-amber-500" />
                  )}
                  <Icon size={15} className={`flex-shrink-0 ${active ? 'text-amber-400' : ''}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {collapsed && (
                    <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-[11px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none shadow-xl z-50 border border-white/10 transition-opacity">
                      {item.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── User footer — pinned to bottom ── */}
      <div className={`flex-shrink-0 border-t border-white/[0.07] ${collapsed ? 'p-2' : 'p-3'}`}>
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {initials(user.name)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold text-white truncate leading-tight">{user.name}</p>
                <p className="text-[9.5px] text-slate-500">{ROLE_LABEL[user.role] ?? user.role}</p>
              </div>
              <button onClick={logout} title="Sign out"
                className="text-slate-600 hover:text-red-400 transition flex-shrink-0">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
        {collapsed && (
          <button onClick={logout} title="Sign out"
            className="mt-2 w-full flex items-center justify-center py-1.5 text-slate-600 hover:text-red-400 transition rounded-lg hover:bg-white/5">
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
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden"
             onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-[218px] lg:hidden">
          <SidebarInner />
        </div>
      )}

      {/* Desktop sidebar — fixed, full height, zero gap */}
      <div className={`hidden lg:block fixed inset-y-0 left-0 z-40 ${collapsed ? 'w-14' : 'w-[218px]'} transition-[width] duration-200`}>
        <SidebarInner />
      </div>
    </>
  )
}
