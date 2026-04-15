import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { token, name, answers, type } = await req.json()
    if (!token || !name) return NextResponse.json({ error: 'Token and name required' }, { status: 400 })

    // Get assignment
    const { data: assignment } = await supabaseAdmin
      .from('assignments')
      .select('id, deadline, is_published, assignment_type')
      .eq('share_token', token)
      .single()

    if (!assignment || !assignment.is_published)
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    if (new Date(assignment.deadline) < new Date())
      return NextResponse.json({ error: 'Deadline has passed' }, { status: 400 })

    // Find learner by name (best-effort match)
    const { data: users } = await supabaseAdmin.from('users').select('id,name').ilike('name', '%' + name.trim() + '%').eq('role', 'learner')
    const user = users?.[0]
    let learnerId: string | null = null
    if (user) {
      const { data: l } = await supabaseAdmin.from('learners').select('id').eq('user_id', user.id).single()
      learnerId = l?.id ?? null
    }

    // Create or update submission
    let submissionId: string
    if (learnerId) {
      const { data: existing } = await supabaseAdmin.from('assignment_submissions')
        .select('id').eq('assignment_id', assignment.id).eq('learner_id', learnerId).single()
      if (existing) {
        await supabaseAdmin.from('assignment_submissions').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', existing.id)
        submissionId = existing.id
      } else {
        const { data: ns } = await supabaseAdmin.from('assignment_submissions').insert({
          assignment_id: assignment.id, learner_id: learnerId, status: 'submitted', submitted_at: new Date().toISOString(),
        }).select('id').single()
        submissionId = ns!.id
      }

      // Auto-score CBT answers
      if (type === 'cbt' && answers && learnerId) {
        let score = 0; let maxScore = 0
        const { data: questions } = await supabaseAdmin.from('assignment_questions')
          .select('id, marks, assignment_options(id, is_correct)').eq('assignment_id', assignment.id)
        for (const q of questions ?? []) {
          maxScore += q.marks
          const selected = answers[q.id]
          const correct  = (q.assignment_options ?? []).find((o: any) => o.is_correct)
          const isRight  = selected && correct && selected === correct.id
          if (isRight) score += q.marks
          await supabaseAdmin.from('submission_answers').upsert({
            submission_id: submissionId, question_id: q.id,
            selected_option_id: selected || null, is_correct: !!isRight,
          }, { onConflict: 'submission_id,question_id' })
        }
        await supabaseAdmin.from('assignment_submissions').update({ score, max_score: maxScore, status: 'scored' }).eq('id', submissionId)
      }
    }

    // Notify educator
    const { data: asgn } = await supabaseAdmin.from('assignments').select('educator_id, title').eq('id', assignment.id).single()
    if (asgn) {
      const { data: eduUser } = await supabaseAdmin.from('educators').select('user_id').eq('id', asgn.educator_id).single()
      if (eduUser) {
        await supabaseAdmin.from('notifications').insert({
          user_id: eduUser.user_id,
          type: 'submission',
          title: 'New Submission',
          message: name + ' submitted "' + asgn.title + '"',
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Public submit error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
