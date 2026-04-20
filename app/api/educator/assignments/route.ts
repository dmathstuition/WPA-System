import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['educator', 'admin', 'super_admin'])
    const { data: edu } = await supabaseAdmin.from('educators').select('id').eq('user_id', session.id).single()
    if (!edu) return NextResponse.json([])

    const viewId = new URL(req.url).searchParams.get('id')

    // Single assignment detail with questions
    if (viewId) {
      const { data: a } = await supabaseAdmin.from('assignments').select('*').eq('id', viewId).single()
      if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const { data: qs } = await supabaseAdmin.from('assignment_questions')
        .select('*, assignment_options(*)').eq('assignment_id', viewId).order('sort_order')
      return NextResponse.json({ ...a, questions: qs ?? [] })
    }

    // All assignments for this educator
    const { data: assignments } = await supabaseAdmin.from('assignments')
      .select('id,title,deadline,is_published,share_url,assignment_type,created_at,lesson_id')
      .eq('educator_id', edu.id).order('created_at', { ascending: false })

    if (!assignments?.length) return NextResponse.json([])

    // Enrich with lesson + subject names
    const lessonIds = [...new Set(assignments.map((a: any) => a.lesson_id).filter(Boolean))]
    const { data: lessons } = lessonIds.length
      ? await supabaseAdmin.from('lessons').select('id,lesson_date,subject_id').in('id', lessonIds)
      : { data: [] }
    const subIds = [...new Set((lessons ?? []).map((l: any) => l.subject_id).filter(Boolean))]
    const { data: subjects } = subIds.length
      ? await supabaseAdmin.from('subjects').select('id,name').in('id', subIds)
      : { data: [] }
    const lMap = new Map((lessons ?? []).map((l: any) => [l.id, l]))
    const sMap = new Map((subjects ?? []).map((s: any) => [s.id, s]))

    // Get ALL submissions across these assignments with learner names
    const aIds = assignments.map((a: any) => a.id)
    const { data: allSubs } = await supabaseAdmin.from('assignment_submissions')
      .select('id, assignment_id, learner_id, status, score, max_score, submitted_at')
      .in('assignment_id', aIds)

    // Get learner names for all submissions
    const learnerIds = [...new Set((allSubs ?? []).map((s: any) => s.learner_id).filter(Boolean))]
    let learnerNameMap = new Map<string, string>()
    if (learnerIds.length) {
      const { data: learners } = await supabaseAdmin.from('learners')
        .select('id, user_id').in('id', learnerIds)
      const userIds = (learners ?? []).map((l: any) => l.user_id).filter(Boolean)
      const { data: users } = userIds.length
        ? await supabaseAdmin.from('users').select('id, name').in('id', userIds)
        : { data: [] }
      const uMap = new Map((users ?? []).map((u: any) => [u.id, u.name]))
      for (const l of learners ?? []) {
        learnerNameMap.set(l.id, uMap.get(l.user_id) ?? '—')
      }
    }

    // Group submissions by assignment
    const subsByAssignment = new Map<string, any[]>()
    for (const s of allSubs ?? []) {
      if (!subsByAssignment.has(s.assignment_id)) subsByAssignment.set(s.assignment_id, [])
      subsByAssignment.get(s.assignment_id)!.push({
        ...s,
        learner_name: learnerNameMap.get(s.learner_id) ?? '—',
      })
    }

    const enriched = assignments.map((a: any) => {
      const lesson = lMap.get(a.lesson_id)
      const subs   = subsByAssignment.get(a.id) ?? []
      return {
        ...a,
        lesson_date: lesson?.lesson_date ?? null,
        subject:     sMap.get(lesson?.subject_id) ?? null,
        submissions: subs,
        stats: {
          total:     subs.length,
          submitted: subs.filter((s: any) => s.status === 'submitted' || s.status === 'scored').length,
          scored:    subs.filter((s: any) => s.status === 'scored').length,
          pending:   subs.filter((s: any) => s.status === 'pending').length,
          missed:    subs.filter((s: any) => s.status === 'missed').length,
        },
      }
    })

    return NextResponse.json(enriched)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['educator'])
    const body = await req.json()
    if (!body.lesson_id) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })
    if (!body.title)     return NextResponse.json({ error: 'title required' },     { status: 400 })
    if (!body.deadline)  return NextResponse.json({ error: 'deadline required' },  { status: 400 })

    const { data: edu } = await supabaseAdmin.from('educators').select('id').eq('user_id', session.id).single()
    if (!edu) return NextResponse.json({ error: 'Educator not found' }, { status: 404 })

    const shareToken = crypto.randomBytes(20).toString('hex')
    const base       = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl   = base + '/assignment/' + shareToken

    const { data: assignment, error: aErr } = await supabaseAdmin.from('assignments').insert({
      lesson_id: body.lesson_id, educator_id: edu.id, title: body.title,
      instructions: body.instructions || null, time_limit_mins: body.time_limit_mins || null,
      deadline: body.deadline, assignment_type: body.assignment_type || 'cbt',
      is_published: true, share_token: shareToken, share_url: shareUrl,
    }).select('id').single()
    if (aErr) throw new Error(aErr.message)

    for (let i = 0; i < (body.questions ?? []).length; i++) {
      const q = body.questions[i]
      const { data: qRow } = await supabaseAdmin.from('assignment_questions').insert({
        assignment_id: assignment.id, question_text: q.text, marks: q.marks ?? 1, sort_order: q.order ?? i,
      }).select('id').single()
      if (!qRow) continue
      for (const o of q.options ?? []) {
        await supabaseAdmin.from('assignment_options').insert({
          question_id: qRow.id, option_text: o.text, option_key: o.key, is_correct: o.is_correct ?? false,
        })
      }
    }

    const { data: attendees } = await supabaseAdmin.from('attendances')
      .select('learner_id').eq('lesson_id', body.lesson_id).eq('status', 'present')
    for (const a of attendees ?? []) {
      await supabaseAdmin.from('assignment_submissions').upsert({
        assignment_id: assignment.id, learner_id: a.learner_id, status: 'pending',
      }, { onConflict: 'assignment_id,learner_id', ignoreDuplicates: true })
    }

    return NextResponse.json({ ok: true, id: assignment.id, share_url: shareUrl }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(['educator', 'admin', 'super_admin'])
    const body = await req.json()
    if (body.action === 'publish') {
      await supabaseAdmin.from('assignments').update({ is_published: true }).eq('id', body.id)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole(['educator', 'admin', 'super_admin'])
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const { data: a } = await supabaseAdmin.from('assignments').select('id, deadline').eq('id', id).single()
    if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (new Date(a.deadline) > new Date()) return NextResponse.json({ error: 'Cannot delete before deadline' }, { status: 400 })
    const { count: total } = await supabaseAdmin.from('assignment_submissions').select('*', { count: 'exact', head: true }).eq('assignment_id', id)
    const { count: done } = await supabaseAdmin.from('assignment_submissions').select('*', { count: 'exact', head: true }).eq('assignment_id', id).in('status', ['submitted', 'scored'])
    const sids = (await supabaseAdmin.from('assignment_submissions').select('id').eq('assignment_id', id)).data?.map((s: any) => s.id) ?? []
    if (sids.length) await supabaseAdmin.from('submission_answers').delete().in('submission_id', sids)
    await supabaseAdmin.from('assignment_submissions').delete().eq('assignment_id', id)
    const qids = (await supabaseAdmin.from('assignment_questions').select('id').eq('assignment_id', id)).data?.map((q: any) => q.id) ?? []
    if (qids.length) await supabaseAdmin.from('assignment_options').delete().in('question_id', qids)
    await supabaseAdmin.from('assignment_questions').delete().eq('assignment_id', id)
    await supabaseAdmin.from('assignments').delete().eq('id', id)
    return NextResponse.json({ ok: true, stats: { total: total ?? 0, completed: done ?? 0 } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
