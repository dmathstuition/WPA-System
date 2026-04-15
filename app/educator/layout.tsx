import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'

export default async function EducatorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  // Allow admin and super_admin so impersonation (View Portal) works
  if (!['educator', 'admin', 'super_admin'].includes(session.role)) redirect('/login')
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar user={session} />
      <main className="flex-1 overflow-y-auto min-w-0 lg:pl-[218px]">
        {children}
      </main>
    </div>
  )
}
