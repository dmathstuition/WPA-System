import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['learner'])

    // Get this learner's year_level_id and class_group_id
    const { data: learner, error: lErr } = await supabaseAdmin
      .from('learners')
      .select('id, year_level_id, class_group_id')
      .eq('user_id', session.id)
      .single()

    if (lErr || !learner) {
      console.error('Learner not found:', session.id, lErr?.message)
      return NextResponse.json([])
    }

    // Fetch lessons matching the learner's year level
    // Includes: general lessons for their year/group AND 1:1 lessons for them specifically
    let q = supabaseAdmin
      .from('lessons')
      .select(`
        id, title, lesson_date, lesson_type, attendance_locked, status, notes,
        subjects(name),
        year_levels(name, exam_groups(name)),
        class_groups(name),
        lesson_educators(educators(users(name)))
      `)
      .order('lesson_date', { ascending: false })

    const { data: allLessons, error: llErr } = await q
    if (llErr) throw llErr

    // Filter: general lessons matching year (and group if set), or 1:1 for this learner
    const filtered = (allLessons ?? []).filter((l: any) => {
      if (l.lesson_type === 'one_to_one') {
        return l.one_to_one_learner_id === learner.id
      }
      // General lesson: must match year level
      if (l.year_level_id !== learner.year_level_id) return false
      // If lesson has a class group set, learner must be in that group
      if (l.class_group_id && l.class_group_id !== learner.class_group_id) return false
      return true
    })

    return NextResponse.json(filtered)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
