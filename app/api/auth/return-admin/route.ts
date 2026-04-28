import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signToken, COOKIE_NAME } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    // Read the stored admin user ID from the impersonation cookie
    const adminId = req.cookies.get('wpa_admin_id')?.value

    if (!adminId) {
      // No admin ID stored — just redirect to login
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Look up the admin user from DB
    const { data: admin } = await supabaseAdmin.from('users')
      .select('id, name, email, role').eq('id', adminId).single()

    if (!admin || !['admin', 'super_admin'].includes(admin.role)) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Sign a fresh JWT as the admin
    const jwt = await signToken({ id: admin.id, name: admin.name, email: admin.email, role: admin.role })
    const res = NextResponse.redirect(new URL('/admin/dashboard', req.url))
    res.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 8, path: '/',
    })
    // Clear the impersonation cookie
    res.cookies.set('wpa_admin_id', '', { maxAge: 0, path: '/' })
    return res
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}
