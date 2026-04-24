import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: expired } = await supabaseAdmin
      .from('assignments')
      .select('id')
      .eq('is_published', true)
      .lt('deadline', new Date().toISOString())

    if (!expired?.length) return NextResponse.json({ updated: 0 })

    const ids = expired.map((a: any) => a.id)

    const { data, error } = await supabaseAdmin
      .from('assignment_submissions')
      .update({ status: 'missed' })
      .in('assignment_id', ids)
      .eq('status', 'pending')
      .select('id')

    return NextResponse.json({ updated: data?.length ?? 0, checked: ids.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
