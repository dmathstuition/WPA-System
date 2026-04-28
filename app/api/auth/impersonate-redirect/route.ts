import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('wpa_token')?.value
    if (!token) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const { data: u } = await supabaseAdmin.from('users').select('id, role').eq('id', session.id).single()
    let isAdmin = ['admin', 'super_admin'].includes(session.role)
    if (!isAdmin && u) isAdmin = ['admin', 'super_admin'].includes(u.role)
    if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const eid = new URL(req.url).searchParams.get('educator_id')
    if (!eid) return NextResponse.json({ error: 'educator_id required' }, { status: 400 })

    const { data: edu } = await supabaseAdmin.from('educators').select('id').eq('id', eid).maybeSingle()
    if (!edu) return NextResponse.json({ error: 'Educator not found' }, { status: 404 })

    const t = crypto.randomBytes(32).toString('hex')
    await supabaseAdmin.from('impersonation_tokens').insert({
      admin_user_id: session.id, target_educator_id: eid, token: t,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    })

    // Redirect to a client page that sets localStorage then redirects to impersonate
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(base + '/api/auth/impersonate?token=' + t + '&from_admin=1')
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
