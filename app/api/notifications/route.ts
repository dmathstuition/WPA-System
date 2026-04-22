import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['admin', 'super_admin', 'educator'])

    let userId = session.id

    // For admin, show all submission notifications across all tutors
    if (['admin', 'super_admin'].includes(session.role)) {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('id, type, title, message, link, is_read, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error

      // Enrich with tutor names
      const uids = [...new Set((data ?? []).map((n: any) => n.user_id).filter(Boolean))]
      const { data: users } = uids.length
        ? await supabaseAdmin.from('users').select('id, name').in('id', uids)
        : { data: [] }
      const uMap = new Map((users ?? []).map((u: any) => [u.id, u.name]))

      const enriched = (data ?? []).map((n: any) => ({
        ...n,
        tutor_name: uMap.get(n.user_id) ?? null,
      }))

      const unread = enriched.filter((n: any) => !n.is_read).length
      return NextResponse.json({ notifications: enriched, unread })
    }

    // For educator, show only their notifications
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, type, title, message, link, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw error

    const unread = (data ?? []).filter((n: any) => !n.is_read).length
    return NextResponse.json({ notifications: data ?? [], unread })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireRole(['admin', 'super_admin', 'educator'])
    const { action, id } = await req.json()

    if (action === 'read' && id) {
      await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', id)
      return NextResponse.json({ ok: true })
    }

    if (action === 'read_all') {
      if (['admin', 'super_admin'].includes(session.role)) {
        await supabaseAdmin.from('notifications').update({ is_read: true }).eq('is_read', false)
      } else {
        await supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', session.id).eq('is_read', false)
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
