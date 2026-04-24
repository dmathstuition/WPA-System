import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return res
}

// GET-based logout — works as a simple redirect, no fetch needed
export async function GET(req: NextRequest) {
  const base = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = NextResponse.redirect(base + '/login')
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return res
}
