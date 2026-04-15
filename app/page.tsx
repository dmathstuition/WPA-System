import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function Home() {
  const session = await getSession()
  if (!session) redirect('/login')

  const dest: Record<string, string> = {
    super_admin: '/super-admin/dashboard',
    admin: '/admin/dashboard',
    educator: '/educator/dashboard',
    learner: '/learner/dashboard',
  }
  redirect(dest[session.role] ?? '/login')
}
