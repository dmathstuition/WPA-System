import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'learner') redirect('/login')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={session} />
      <main className="flex-1 lg:ml-[218px] transition-[margin] duration-200 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  )
}
