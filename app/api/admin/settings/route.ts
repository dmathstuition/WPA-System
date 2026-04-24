import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    await requireRole(['admin', 'super_admin'])
    const { data } = await supabaseAdmin.from('settings').select('key, value')
    const map: Record<string, string> = {}
    for (const r of data ?? []) map[r.key] = r.value
    return NextResponse.json(map)
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireRole(['admin', 'super_admin'])
    const body = await req.json()

    // Change password
    if (body.action === 'change_password') {
      if (!body.current || !body.next) return NextResponse.json({ error: 'Current and new password required' }, { status: 400 })
      if (body.next.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      const { data: user } = await supabaseAdmin.from('users').select('id, password_hash').eq('id', session.id).single()
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      const valid = await bcrypt.compare(body.current, user.password_hash)
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
      const hash = await bcrypt.hash(body.next, 12)
      await supabaseAdmin.from('users').update({ password_hash: hash }).eq('id', session.id)
      return NextResponse.json({ ok: true })
    }

    // Save settings
    if (body.settings && typeof body.settings === 'object') {
      for (const [key, value] of Object.entries(body.settings)) {
        await supabaseAdmin.from('settings').upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
