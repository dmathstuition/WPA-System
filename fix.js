const fs = require('fs')
const path = require('path')
function w(p,c){const d=path.dirname(p);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});fs.writeFileSync(p,c,'utf8');console.log('  ✓',p)}

// The impersonate JWT uses the tutor's user_id, so return-admin can't find the admin.
// Fix: store admin_user_id in a separate cookie during impersonation, use it to restore.

w('app/api/auth/impersonate/route.ts', `import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signToken, COOKIE_NAME } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const fromAdmin = url.searchParams.get('from_admin')
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const { data: imp } = await supabaseAdmin.from('impersonation_tokens')
      .select('id, target_educator_id, admin_user_id, expires_at, used_at')
      .eq('token', token).maybeSingle()
    if (!imp) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    if (imp.used_at) return NextResponse.json({ error: 'Token used' }, { status: 401 })
    if (new Date(imp.expires_at) < new Date()) return NextResponse.json({ error: 'Expired' }, { status: 401 })

    const { data: edu } = await supabaseAdmin.from('educators').select('user_id').eq('id', imp.target_educator_id).single()
    if (!edu) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { data: user } = await supabaseAdmin.from('users').select('id, name, email, role').eq('id', edu.user_id).single()
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await supabaseAdmin.from('impersonation_tokens').update({ used_at: new Date().toISOString() }).eq('id', imp.id)

    // Sign JWT as the educator
    const jwt = await signToken({ id: user.id, name: user.name, email: user.email, role: 'educator' })

    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = NextResponse.redirect(base + '/impersonate-landing?from_admin=' + (fromAdmin ?? '0'))
    res.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 2, path: '/',
    })
    // Store admin's user ID in a separate cookie so we can restore later
    if (imp.admin_user_id) {
      res.cookies.set('wpa_admin_id', imp.admin_user_id, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: 60 * 60 * 2, path: '/',
      })
    }
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
`)

w('app/api/auth/return-admin/route.ts', `import { NextRequest, NextResponse } from 'next/server'
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
`)

console.log('\nDone. The flow now:')
console.log('  1. Admin clicks View Portal → impersonate sets wpa_admin_id cookie with admin user ID')
console.log('  2. Admin clicks Return to Admin → reads wpa_admin_id, looks up admin in DB, signs fresh admin JWT')
console.log('  3. wpa_admin_id cookie is cleared, admin lands on /admin/dashboard')