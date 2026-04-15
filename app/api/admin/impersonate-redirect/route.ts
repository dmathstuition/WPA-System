import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const session    = await requireRole(['admin', 'super_admin'])
    const educatorId = new URL(req.url).searchParams.get('educator_id')
    if (!educatorId) return NextResponse.json({ error: 'educator_id required' }, { status: 400 })

    const { data: edu } = await supabaseAdmin.from('educators')
      .select('id').eq('id', educatorId).single()
    if (!edu) return NextResponse.json({ error: 'Educator not found' }, { status: 404 })

    const token = crypto.randomBytes(32).toString('hex')
    const { error } = await supabaseAdmin.from('impersonation_tokens').insert({
      admin_user_id:      session.id,
      target_educator_id: educatorId,
      token,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    })
    if (error) throw new Error(error.message)

    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${base}/api/auth/impersonate?token=${token}`)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
