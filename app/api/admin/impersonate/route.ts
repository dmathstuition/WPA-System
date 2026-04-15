import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['admin','super_admin'])
    const { educator_id } = await req.json()
    if (!educator_id) return NextResponse.json({ error: 'educator_id required' }, { status: 400 })

    const token = crypto.randomBytes(32).toString('hex')
    const { error } = await supabaseAdmin.from('impersonation_tokens').insert({
      admin_user_id:      session.id,
      target_educator_id: educator_id,
      token,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    })
    if (error) throw error
    return NextResponse.json({ ok: true, token })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
