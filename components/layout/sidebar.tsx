'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { SessionUser } from '@/types'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  ClipboardList, Settings, LogOut, ChevronLeft, ChevronRight,
  Award, Upload, FileText, Menu, Layers
} from 'lucide-react'

function initials(n: string) { return (n??'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) }

function getNav(role: string) {
  if (role === 'admin' || role === 'super_admin') return [
    { section:'Overview', items:[{label:'Dashboard',href:'/admin/dashboard',icon:LayoutDashboard}]},
    { section:'People', items:[{label:'Learners',href:'/admin/learners',icon:Users},{label:'Tutors',href:'/admin/educators',icon:GraduationCap}]},
    { section:'Import', items:[{label:'Import Learners',href:'/admin/import/learners',icon:Upload},{label:'Import Tutors',href:'/admin/import/educators',icon:Upload}]},
    { section:'Academic', items:[{label:'Year Levels',href:'/admin/year-levels',icon:Layers},{label:'Class Groups',href:'/admin/class-groups',icon:BookOpen},{label:'Exam Groups',href:'/admin/exam-groups',icon:Award},{label:'Subjects',href:'/admin/subjects',icon:FileText}]},
    { section:'System', items:[{label:'Settings',href:'/admin/settings',icon:Settings}]},
  ]
  if (role === 'educator') return [
    { section:'Overview', items:[{label:'Dashboard',href:'/educator/dashboard',icon:LayoutDashboard}]},
    { section:'Teaching', items:[{label:'My Lessons',href:'/educator/lessons',icon:Calendar},{label:'Assignments',href:'/educator/assignments',icon:ClipboardList}]},
  ]
  return []
}

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const nav = getNav(user.role)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wpa_sb') === '1') setCollapsed(true)
  }, [])

  function toggle() { const n = !collapsed; setCollapsed(n); localStorage.setItem('wpa_sb', n?'1':'0') }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }

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
            <button onClick={toggle} className="text-slate-600 hover:text-slate-400 flex-shrink-0"><ChevronLeft size={14}/></button>
          </div>
        )}
      </div>
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2" style={{scrollbarWidth:'none'}}>
        {nav.map(g => (
          <div key={g.section}>
            {!collapsed && <p className="px-4 pt-4 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">{g.section}</p>}
            {collapsed && <div className="my-2 mx-3 border-t border-white/[0.06]"/>}
            {g.items.map(item => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className={`relative flex items-center gap-2.5 text-[12px] font-medium mx-2 rounded-lg transition-all
                    ${collapsed ? 'justify-center py-2.5' : 'px-3 py-2'}
                    ${active ? 'bg-amber-500/15 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'}`}>
                  {active && !collapsed && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-amber-500"/>}
                  <Icon size={15} className={`flex-shrink-0 ${active ? 'text-amber-400' : ''}`}/>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      {collapsed && (
        <button onClick={toggle} className="flex-shrink-0 flex items-center justify-center py-2 border-t border-white/[0.06] text-slate-600 hover:text-slate-400">
          <ChevronRight size={13}/>
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
              <button onClick={logout} title="Sign out" className="text-slate-600 hover:text-red-400"><LogOut size={14}/></button>
            </div>
          )}
        </div>
        {collapsed && <button onClick={logout} title="Sign out" className="mt-2 w-full flex items-center justify-center py-1.5 text-slate-600 hover:text-red-400 rounded-lg hover:bg-white/5"><LogOut size={13}/></button>}
      </div>
    </div>
  )

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-3 left-3 z-50 w-8 h-8 rounded-lg bg-slate-900 shadow-lg flex items-center justify-center text-slate-300"><Menu size={15}/></button>
      {mobileOpen && <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setMobileOpen(false)}/>}
      {mobileOpen && <div className="fixed inset-y-0 left-0 z-50 w-[218px] lg:hidden"><Inner/></div>}
      <div className={`hidden lg:block fixed inset-y-0 left-0 z-40 transition-[width] duration-200 ${collapsed ? 'w-14' : 'w-[218px]'}`}><Inner/></div>
    </>
  )
}
