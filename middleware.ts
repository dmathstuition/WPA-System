import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC = ['/login', '/api/auth', '/api/public', '/assignment']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow public paths
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') return NextResponse.next()

  const token = req.cookies.get('wpa_token')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  const session = await verifyToken(token)
  if (!session) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.set('wpa_token', '', { maxAge: 0, path: '/' })
    return res
  }

  // Root → role-based dashboard
  if (pathname === '/') {
    const dest: Record<string, string> = {
      super_admin: '/admin/dashboard',
      admin:       '/admin/dashboard',
      educator:    '/educator/dashboard',
    }
    return NextResponse.redirect(new URL(dest[session.role] ?? '/login', req.url))
  }

  // Old super-admin portal no longer exists
  if (pathname.startsWith('/super-admin'))
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))

  // Learner portal removed — CRITICAL: use exact + /learner/ prefix
  // NOT startsWith('/learner') which would catch /admin/learners, /admin/year-levels etc
  if (pathname === '/learner' || pathname.startsWith('/learner/'))
    return NextResponse.redirect(new URL('/login', req.url))

  // Admin routes — both admin and super_admin allowed
  if (pathname.startsWith('/admin') && !['admin', 'super_admin'].includes(session.role))
    return NextResponse.redirect(new URL('/login', req.url))

  // Educator routes — educator + admin/super_admin (for impersonation)
  if (pathname.startsWith('/educator') && !['educator', 'admin', 'super_admin'].includes(session.role))
    return NextResponse.redirect(new URL('/login', req.url))

  // API protection
  if (pathname.startsWith('/api/admin') && !['admin', 'super_admin'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (pathname.startsWith('/api/educator') && !['educator', 'admin', 'super_admin'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const res = NextResponse.next()
  res.headers.set('x-user-id',   session.id)
  res.headers.set('x-user-role', session.role)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
