import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { ImpersonationBanner } from '@/components/shared/impersonation-banner'
export default async function EducatorLayout({children}:{children:React.ReactNode}) {
  const s = await getSession(); if (!s||!['educator','admin','super_admin'].includes(s.role)) redirect('/login')
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      <Sidebar user={s} />
      <main className="flex-1 overflow-y-auto min-w-0 lg:pl-[210px]"><ImpersonationBanner />{children}</main>
    </div>
  )
}
