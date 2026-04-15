'use client'
import { SessionUser } from '@/types'
import { Bell, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

interface TopbarProps {
  user: SessionUser
  title: string
  subtitle?: string
}

export function Topbar({ user, title, subtitle }: TopbarProps) {
  const [bellOpen, setBellOpen] = useState(false)

  return (
    <header className="h-[52px] bg-white border-b border-slate-100 flex items-center gap-3 px-5 sticky top-0 z-30 flex-shrink-0">
      {/* Mobile spacer for hamburger */}
      <div className="w-8 lg:hidden flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <h1 className="text-[13.5px] font-bold text-slate-900 truncate leading-none">{title}</h1>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
          <Calendar size={12} />
          {format(new Date(), 'EEE, d MMM yyyy')}
        </span>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition relative"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          {bellOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-slate-800">Notifications</p>
                </div>
                <div className="py-6 text-center">
                  <Bell size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-[12px] text-slate-400">All clear — no alerts</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
