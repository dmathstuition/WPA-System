import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  // Clear the auth cookie
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
  // Prevent caching of any protected pages
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.headers.set('Clear-Site-Data', '"cache"')
  return res
}
