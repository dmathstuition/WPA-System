'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SessionUser } from '@/types'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  ClipboardList, Settings, LogOut, ChevronLeft, ChevronRight,
  Award, Upload, FileText, Menu, Layers, X
} from 'lucide-react'

function initials(n: string) { return (n??'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) }

function getNav(role: string) {
  if (role === 'admin' || role === 'super_admin') return [
    { section:'Overview', items:[{label:'Dashboard',href:'/admin/dashboard',icon:LayoutDashboard}] },
    { section:'People', items:[{label:'Learners',href:'/admin/learners',icon:Users},{label:'Tutors',href:'/admin/educators',icon:GraduationCap}] },
    { section:'Import', items:[{label:'Import Learners',href:'/admin/import/learners',icon:Upload},{label:'Import Tutors',href:'/admin/import/educators',icon:Upload}] },
    { section:'Academic', items:[{label:'Year Levels',href:'/admin/year-levels',icon:Layers},{label:'Class Groups',href:'/admin/class-groups',icon:BookOpen},{label:'Exam Groups',href:'/admin/exam-groups',icon:Award},{label:'Subjects',href:'/admin/subjects',icon:FileText}] },
    { section:'System', items:[{label:'Settings',href:'/admin/settings',icon:Settings}] },
  ]
  if (role === 'educator') return [
    { section:'Overview', items:[{label:'Dashboard',href:'/educator/dashboard',icon:LayoutDashboard}] },
    { section:'Teaching', items:[{label:'My Lessons',href:'/educator/lessons',icon:Calendar},{label:'Assignments',href:'/educator/assignments',icon:ClipboardList}] },
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

  function toggle() { const n = !collapsed; setCollapsed(n); localStorage.setItem('wpa_sb', n?'1':'0') }
  function doLogout() { setLoggingOut(true); window.location.href = '/api/auth/logout' }

  const Inner = () => (
    <div className="h-full flex flex-col bg-slate-900">
      <div className={`flex items-center gap-2.5 px-4 h-14 border-b border-white/[0.06] flex-shrink-0 ${collapsed?'justify-center px-2':''}`}>
        <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white leading-none truncate">Whyte Pyramid</p>
              <p className="text-[9.5px] text-slate-500 mt-0.5">Academy</p>
            </div>
            <button onClick={toggle} className="text-slate-600 hover:text-slate-400"><ChevronLeft size={13} /></button>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {nav.map(g => (
          <div key={g.section}>
            {!collapsed && <p className="px-4 pt-3 pb-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-600">{g.section}</p>}
            {collapsed && <div className="my-1.5 mx-3 border-t border-white/[0.04]" />}
            {g.items.map(item => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className={`relative flex items-center gap-2 text-[11.5px] font-medium mx-1.5 rounded-md transition
                    ${collapsed ? 'justify-center py-2' : 'px-3 py-[7px]'}
                    ${active ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'}`}>
                  {active && !collapsed && <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r bg-orange-500" />}
                  <Icon size={14} strokeWidth={active ? 2 : 1.5} className={active ? 'text-orange-400' : ''} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {collapsed && <button onClick={toggle} className="flex-shrink-0 flex items-center justify-center py-2 border-t border-white/[0.06] text-slate-600 hover:text-slate-400"><ChevronRight size={12} /></button>}

      <div className={`flex-shrink-0 border-t border-white/[0.06] ${collapsed?'p-2':'p-3'}`}>
        <div className={`flex items-center gap-2 ${collapsed?'justify-center':''}`}>
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-semibold text-slate-300 flex-shrink-0">{initials(user.name)}</div>
          {!collapsed && (
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-300 truncate">{user.name}</p>
                <p className="text-[9px] text-slate-600">{['admin','super_admin'].includes(user.role)?'Admin':'Educator'}</p>
              </div>
              <button onClick={() => setShowLogout(true)} className="text-slate-600 hover:text-red-400 transition"><LogOut size={13} strokeWidth={1.5} /></button>
            </div>
          )}
        </div>
        {collapsed && <button onClick={() => setShowLogout(true)} className="mt-1.5 w-full flex items-center justify-center py-1 text-slate-600 hover:text-red-400 rounded hover:bg-white/5 transition"><LogOut size={12} strokeWidth={1.5} /></button>}
      </div>
    </div>
  )

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-3.5 left-3 z-50 w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-slate-300"><Menu size={14} /></button>
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      {mobileOpen && <div className="fixed inset-y-0 left-0 z-50 w-[210px] lg:hidden"><Inner /></div>}
      <div className={`hidden lg:block fixed inset-y-0 left-0 z-40 transition-[width] duration-150 ${collapsed?'w-12':'w-[210px]'}`}><Inner /></div>

      {showLogout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !loggingOut && setShowLogout(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xs p-6 text-center">
            {!loggingOut && <button onClick={() => setShowLogout(false)} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-3"><LogOut size={18} className="text-red-500" /></div>
            <p className="text-[14px] font-semibold text-slate-900">Sign out?</p>
            <p className="text-[12px] text-slate-500 mt-1">You'll need to sign in again.</p>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowLogout(false)} disabled={loggingOut} className="flex-1 h-8 text-[12px] font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">Cancel</button>
              <button onClick={doLogout} disabled={loggingOut} className="flex-1 h-8 text-[12px] font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50">{loggingOut ? 'Signing out…' : 'Sign out'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
