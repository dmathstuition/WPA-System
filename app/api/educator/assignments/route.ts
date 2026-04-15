import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['educator', 'admin', 'super_admin'])
    const id = new URL(req.url).searchParams.get('id')

    const { data: edu } = await supabaseAdmin
      .from('educators').select('id').eq('user_id', session.id).single()
    if (!edu) return NextResponse.json([])

    if (id) {
      const { data: assignment } = await supabaseAdmin
        .from('assignments').select('*').eq('id', id).single()
      if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const { data: questions } = await supabaseAdmin
        .from('assignment_questions')
        .select('*, assignment_options(*)')
        .eq('assignment_id', id)
        .order('sort_order')
      return NextResponse.json({ ...assignment, questions: questions ?? [] })
    }

    const { data: assignments } = await supabaseAdmin
      .from('assignments')
      .select('id, title, deadline, is_published, share_url, assignment_type, created_at, lesson_id')
      .eq('educator_id', edu.id)
      .order('created_at', { ascending: false })

    // Enrich with lesson/subject info
    const lessonIds = [...new Set((assignments ?? []).map((a: any) => a.lesson_id).filter(Boolean))]
    const { data: lessons } = lessonIds.length
      ? await supabaseAdmin.from('lessons').select('id, lesson_date, subject_id').in('id', lessonIds)
      : { data: [] }
    const subIds = [...new Set((lessons ?? []).map((l: any) => l.subject_id).filter(Boolean))]
    const { data: subjects } = subIds.length
      ? await supabaseAdmin.from('subjects').select('id, name').in('id', subIds)
      : { data: [] }
    const lMap = new Map((lessons  ?? []).map((l: any) => [l.id, l]))
    const sMap = new Map((subjects ?? []).map((s: any) => [s.id, s]))

    const enriched = (assignments ?? []).map((a: any) => {
      const lesson = lMap.get(a.lesson_id)
      return { ...a, lesson_date: lesson?.lesson_date ?? null, subject: sMap.get(lesson?.subject_id) ?? null }
    })
    return NextResponse.json(enriched)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['educator'])

    // Accept JSON body (not FormData)
    const body = await req.json()

    const { data: edu } = await supabaseAdmin
      .from('educators').select('id').eq('user_id', session.id).single()
    if (!edu) return NextResponse.json({ error: 'Educator not found' }, { status: 404 })

    if (!body.lesson_id) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })
    if (!body.title)     return NextResponse.json({ error: 'title required' }, { status: 400 })
    if (!body.deadline)  return NextResponse.json({ error: 'deadline required' }, { status: 400 })

    // Generate shareable link token
    const shareToken = crypto.randomBytes(20).toString('hex')
    const base       = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl   = base + '/assignment/' + shareToken

    // Create assignment
    const { data: assignment, error: aErr } = await supabaseAdmin
      .from('assignments')
      .insert({
        lesson_id:       body.lesson_id,
        educator_id:     edu.id,
        title:           body.title,
        instructions:    body.instructions    || null,
        time_limit_mins: body.time_limit_mins || null,
        deadline:        body.deadline,
        assignment_type: body.assignment_type || 'cbt',
        is_published:    true,
        share_token:     shareToken,
        share_url:       shareUrl,
      })
      .select('id')
      .single()

    if (aErr) {
      console.error('Assignment insert error:', aErr.message)
      return NextResponse.json({ error: aErr.message }, { status: 400 })
    }

    // Insert CBT questions + options
    if ((body.questions ?? []).length > 0) {
      for (let i = 0; i < body.questions.length; i++) {
        const q = body.questions[i]
        const { data: qRow } = await supabaseAdmin
          .from('assignment_questions')
          .insert({
            assignment_id: assignment.id,
            question_text: q.text,
            marks:         q.marks ?? 1,
            sort_order:    q.order ?? i,
          })
          .select('id')
          .single()

        if (!qRow) continue
        for (const o of q.options ?? []) {
          await supabaseAdmin.from('assignment_options').insert({
            question_id: qRow.id,
            option_text: o.text,
            option_key:  o.key,
            is_correct:  o.is_correct ?? false,
          })
        }
      }
    }

    // Auto-create pending submissions for learners who attended this lesson
    const { data: attendees } = await supabaseAdmin
      .from('attendances')
      .select('learner_id')
      .eq('lesson_id', body.lesson_id)
      .eq('status', 'present')

    for (const a of attendees ?? []) {
      await supabaseAdmin.from('assignment_submissions')
        .upsert({
          assignment_id: assignment.id,
          learner_id:    a.learner_id,
          status:        'pending',
        }, { onConflict: 'assignment_id,learner_id', ignoreDuplicates: true })
    }

    return NextResponse.json({
      ok:        true,
      id:        assignment.id,
      share_url: shareUrl,
    }, { status: 201 })
  } catch (e: any) {
    console.error('POST assignment error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(['educator', 'admin', 'super_admin'])
    const body = await req.json()

    if (body.action === 'publish') {
      const { error } = await supabaseAdmin
        .from('assignments')
        .update({ is_published: true })
        .eq('id', body.id)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
