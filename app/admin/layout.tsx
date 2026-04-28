import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
export default async function AdminLayout({children}:{children:React.ReactNode}) {
  const s = await getSession(); if (!s||!['admin','super_admin'].includes(s.role)) redirect('/login')
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      <Sidebar user={s} />
      <main className="flex-1 overflow-y-auto min-w-0 lg:pl-[210px]">{children}</main>
    </div>
  )
}
