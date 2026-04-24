import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC = ['/login', '/api/auth', '/api/public', '/assignment', '/api/cron']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
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

  if (pathname === '/') {
    return NextResponse.redirect(new URL(
      ['admin', 'super_admin'].includes(session.role) ? '/admin/dashboard' : '/educator/dashboard',
      req.url
    ))
  }

  // Dead portals
  if (pathname.startsWith('/super-admin')) return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  // EXACT match so /admin/learners is NOT caught
  if (pathname === '/learner' || pathname.startsWith('/learner/')) return NextResponse.redirect(new URL('/login', req.url))

  // Role checks
  if (pathname.startsWith('/admin') && !['admin', 'super_admin'].includes(session.role))
    return NextResponse.redirect(new URL('/login', req.url))
  if (pathname.startsWith('/educator') && !['educator', 'admin', 'super_admin'].includes(session.role))
    return NextResponse.redirect(new URL('/login', req.url))
  if (pathname.startsWith('/api/admin') && !['admin', 'super_admin'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (pathname.startsWith('/api/educator') && !['educator', 'admin', 'super_admin'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
