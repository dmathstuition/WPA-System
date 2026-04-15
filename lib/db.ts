// Central data access layer — all DB queries go through here
import { supabaseAdmin } from './supabase'
import bcrypt from 'bcryptjs'

// ── Users ─────────────────────────────────────────────────────
export async function getUserByEmail(email: string) {
  const { data } = await supabaseAdmin.from('users').select('*').eq('email', email.toLowerCase()).single()
  return data
}

// ── Year Levels ───────────────────────────────────────────────
export async function getYearLevels(activeOnly = true) {
  let q = supabaseAdmin.from('year_levels').select('*').order('sort_order')
  if (activeOnly) q = q.eq('is_active', true)
  const { data } = await q
  return data ?? []
}

export async function createYearLevel(data: { name: string; sort_order?: number; is_private?: boolean }) {
  const { data: row, error } = await supabaseAdmin.from('year_levels').insert(data).select().single()
  if (error) throw new Error(error.message)
  return row
}

export async function updateYearLevel(id: string, data: Partial<{ name: string; sort_order: number; is_private: boolean; is_active: boolean }>) {
  const { error } = await supabaseAdmin.from('year_levels').update(data).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteYearLevel(id: string) {
  const { error } = await supabaseAdmin.from('year_levels').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Class Groups ──────────────────────────────────────────────
export async function getClassGroups(yearLevelId?: string) {
  let q = supabaseAdmin.from('class_groups').select('*, year_levels(name)').order('name')
  if (yearLevelId) q = q.eq('year_level_id', yearLevelId)
  const { data } = await q
  return data ?? []
}

export async function createClassGroup(data: { year_level_id: string; name: string }) {
  const { data: row, error } = await supabaseAdmin.from('class_groups').insert(data).select().single()
  if (error) throw new Error(error.message)
  return row
}

export async function updateClassGroup(id: string, data: Partial<{ name: string; is_active: boolean }>) {
  const { error } = await supabaseAdmin.from('class_groups').update(data).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteClassGroup(id: string) {
  const { error } = await supabaseAdmin.from('class_groups').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Subjects ──────────────────────────────────────────────────
export async function getSubjects(activeOnly = true) {
  let q = supabaseAdmin.from('subjects').select('*').order('name')
  if (activeOnly) q = q.eq('is_active', true)
  const { data } = await q
  return data ?? []
}

export async function createSubject(data: { name: string; code?: string }) {
  const { data: row, error } = await supabaseAdmin.from('subjects').insert(data).select().single()
  if (error) throw new Error(error.message)
  return row
}

export async function updateSubject(id: string, data: Partial<{ name: string; code: string; is_active: boolean }>) {
  const { error } = await supabaseAdmin.from('subjects').update(data).eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Educators ─────────────────────────────────────────────────
export async function getEducators(search?: string) {
  let q = supabaseAdmin.from('educators').select('*, users(id, name, email, phone, is_active)').order('created_at', { ascending: false })
  const { data } = await q
  if (!data) return []
  if (search) {
    const s = search.toLowerCase()
    return data.filter((e: any) =>
      e.users?.name?.toLowerCase().includes(s) ||
      e.users?.email?.toLowerCase().includes(s) ||
      e.staff_id?.toLowerCase().includes(s)
    )
  }
  return data
}

export async function createEducator(data: { name: string; email: string; password: string; phone?: string; staff_id?: string; specialization?: string }) {
  const hash = await bcrypt.hash(data.password, 12)
  const { data: user, error: uErr } = await supabaseAdmin.from('users').insert({ name: data.name, email: data.email.toLowerCase(), password_hash: hash, role: 'educator', phone: data.phone }).select('id').single()
  if (uErr) throw new Error(uErr.message)
  const { error: eErr } = await supabaseAdmin.from('educators').insert({ user_id: user.id, staff_id: data.staff_id, specialization: data.specialization })
  if (eErr) throw new Error(eErr.message)
}

export async function updateEducator(educatorId: string, data: { name?: string; phone?: string; staff_id?: string; specialization?: string; is_active?: boolean; password?: string }) {
  const { data: edu } = await supabaseAdmin.from('educators').select('user_id').eq('id', educatorId).single()
  if (!edu) throw new Error('Educator not found')
  const userUpdate: Record<string, any> = {}
  if (data.name) userUpdate.name = data.name
  if (data.phone !== undefined) userUpdate.phone = data.phone
  if (data.is_active !== undefined) userUpdate.is_active = data.is_active
  if (data.password) userUpdate.password_hash = await bcrypt.hash(data.password, 12)
  if (Object.keys(userUpdate).length) await supabaseAdmin.from('users').update(userUpdate).eq('id', edu.user_id)
  const eduUpdate: Record<string, any> = {}
  if (data.staff_id !== undefined) eduUpdate.staff_id = data.staff_id
  if (data.specialization !== undefined) eduUpdate.specialization = data.specialization
  if (Object.keys(eduUpdate).length) await supabaseAdmin.from('educators').update(eduUpdate).eq('id', educatorId)
}

// ── Learners ──────────────────────────────────────────────────
export async function getLearners(opts?: { search?: string; yearLevelId?: string; classGroupId?: string; lessonType?: string }) {
  let q = supabaseAdmin.from('learners')
    .select('*, users(id, name, email, phone, is_active), year_levels(name), class_groups(name), exam_groups(name, code), educators!learners_tutor_id_fkey(id, users(name))')
    .order('created_at', { ascending: false })
  if (opts?.yearLevelId)   q = q.eq('year_level_id', opts.yearLevelId)
  if (opts?.classGroupId)  q = q.eq('class_group_id', opts.classGroupId)
  if (opts?.lessonType)    q = q.eq('lesson_type', opts.lessonType)
  const { data } = await q
  if (!data) return []
  if (opts?.search) {
    const s = opts.search.toLowerCase()
    return data.filter((l: any) =>
      l.users?.name?.toLowerCase().includes(s) ||
      l.users?.email?.toLowerCase().includes(s) ||
      l.admission_number?.toLowerCase().includes(s)
    )
  }
  return data
}

export async function getLearnerById(id: string) {
  const { data } = await supabaseAdmin.from('learners').select('*, users(*), year_levels(name), class_groups(name)').eq('id', id).single()
  return data
}

export async function createLearner(data: {
  name: string; email: string; password?: string; phone?: string
  admission_number?: string; date_of_birth?: string
  lesson_type?: string
  year_level_id?: string; class_group_id?: string
  exam_group_id?: string
}) {
  const hash = await bcrypt.hash(data.password || 'Password@123', 12)
  const { data: user, error: uErr } = await supabaseAdmin.from('users').insert({
    name: data.name, email: data.email.toLowerCase().trim(),
    password_hash: hash, role: 'learner', phone: data.phone || null,
  }).select('id').single()
  if (uErr) throw new Error(uErr.message)

  const lessonType = data.lesson_type === 'one_to_one' ? 'one_to_one' : 'general'
  const { error: lErr } = await supabaseAdmin.from('learners').insert({
    user_id:          user.id,
    lesson_type:      lessonType,
    year_level_id:    data.year_level_id   || null,
    class_group_id:   data.class_group_id  || null,
    exam_group_id:    data.exam_group_id   || null,
    tutor_id:         data.tutor_id        || null,
    admission_number: data.admission_number || null,
    date_of_birth:    data.date_of_birth   || null,
  })
  if (lErr) throw new Error(lErr.message)
}

export async function updateLearner(learnerId: string, data: {
  name?: string; phone?: string; year_level_id?: string; class_group_id?: string
  admission_number?: string; status?: string; is_active?: boolean; password?: string
  lesson_type?: string; exam_group_id?: string
}) {
  const { data: learner } = await supabaseAdmin.from('learners').select('user_id').eq('id', learnerId).single()
  if (!learner) throw new Error('Learner not found')

  const userUpdate: Record<string, any> = {}
  if (data.name)                         userUpdate.name          = data.name
  if (data.phone !== undefined)          userUpdate.phone         = data.phone || null
  if (data.is_active !== undefined)      userUpdate.is_active     = data.is_active
  if (data.password)                     userUpdate.password_hash = await bcrypt.hash(data.password, 12)
  if (Object.keys(userUpdate).length)
    await supabaseAdmin.from('users').update(userUpdate).eq('id', learner.user_id)

  const learnerUpdate: Record<string, any> = {}
  if (data.lesson_type)                  learnerUpdate.lesson_type      = data.lesson_type
  if (data.year_level_id !== undefined)  learnerUpdate.year_level_id    = data.year_level_id  || null
  if (data.class_group_id !== undefined) learnerUpdate.class_group_id   = data.class_group_id || null
  if (data.exam_group_id  !== undefined) learnerUpdate.exam_group_id    = data.exam_group_id  || null
  if (data.tutor_id       !== undefined) learnerUpdate.tutor_id          = data.tutor_id       || null
  if (data.admission_number !== undefined) learnerUpdate.admission_number = data.admission_number
  if (data.status)                       learnerUpdate.status           = data.status
  if (Object.keys(learnerUpdate).length)
    await supabaseAdmin.from('learners').update(learnerUpdate).eq('id', learnerId)
}

// ── Lessons ───────────────────────────────────────────────────
export async function getLessons(opts?: { educatorId?: string; date?: string; yearLevelId?: string }) {
  let q = supabaseAdmin.from('lessons')
    .select('*, subjects(name), year_levels(name, exam_groups(name)), class_groups(name), lesson_educators(educator_id, educators(id, user_id, users(name)))')
    .order('lesson_date', { ascending: false })
  if (opts?.date) q = q.eq('lesson_date', opts.date)
  if (opts?.yearLevelId) q = q.eq('year_level_id', opts.yearLevelId)
  const { data, error } = await q
  if (error) console.error('getLessons error:', error.message)
  if (!data) return []
  if (opts?.educatorId) {
    // educatorId here is the user_id — match against educators.user_id inside the join
    return data.filter((l: any) =>
      l.lesson_educators?.some((le: any) => le.educators?.user_id === opts.educatorId)
    )
  }
  return data
}

export async function createLesson(data: {
  year_level_id?: string; class_group_id?: string; subject_id: string;
  title: string; lesson_date: string; lesson_type: string;
  one_to_one_learner_id?: string; notes?: string;
  educator_id?: string; created_by: string
}) {
  const { data: lesson, error } = await supabaseAdmin.from('lessons').insert({
    year_level_id:         data.year_level_id || null,
    class_group_id:        data.class_group_id || null,
    subject_id:            data.subject_id,
    title:                 data.title,
    lesson_date:           data.lesson_date,
    lesson_type:           data.lesson_type,
    one_to_one_learner_id: data.one_to_one_learner_id || null,
    notes:                 data.notes || null,
    created_by:            data.created_by,
  }).select('id').single()
  if (error) throw new Error(error.message)

  // educator_id from the form is the educators.id (primary key) directly
  if (data.educator_id) {
    const { error: leErr } = await supabaseAdmin
      .from('lesson_educators')
      .insert({ lesson_id: lesson.id, educator_id: data.educator_id })
    if (leErr) console.error('lesson_educators insert error:', leErr.message)
  }
  return lesson
}

export async function lockAttendance(lessonId: string) {
  await supabaseAdmin.from('lessons').update({ attendance_locked: true, status: 'completed' }).eq('id', lessonId)
}

// ── Attendance ────────────────────────────────────────────────
export async function getAttendanceForLesson(lessonId: string) {
  const { data: lesson } = await supabaseAdmin.from('lessons')
    .select('year_level_id, class_group_id, lesson_type, one_to_one_learner_id')
    .eq('id', lessonId).single()
  if (!lesson) return []

  let learnerQuery = supabaseAdmin.from('learners').select('id, admission_number, users(name), year_levels(name), class_groups(name)').eq('status', 'active')
  if (lesson.lesson_type === 'one_to_one' && lesson.one_to_one_learner_id) {
    learnerQuery = learnerQuery.eq('id', lesson.one_to_one_learner_id)
  } else {
    if (lesson.year_level_id) learnerQuery = learnerQuery.eq('year_level_id', lesson.year_level_id)
    if (lesson.class_group_id) learnerQuery = learnerQuery.eq('class_group_id', lesson.class_group_id)
  }
  const { data: learners } = await learnerQuery

  const { data: attendances } = await supabaseAdmin.from('attendances').select('learner_id, status').eq('lesson_id', lessonId)
  const attMap = new Map((attendances ?? []).map((a: any) => [a.learner_id, a.status]))

  return (learners ?? []).map((l: any) => ({
    learner: l,
    status: attMap.get(l.id) ?? 'absent',
  }))
}

export async function saveAttendance(lessonId: string, records: { learner_id: string; status: string }[], markedBy: string) {
  const upserts = records.map(r => ({
    lesson_id: lessonId,
    learner_id: r.learner_id,
    status: r.status,
    marked_at: new Date().toISOString(),
    marked_by: markedBy,
  }))
  const { error } = await supabaseAdmin.from('attendances').upsert(upserts, { onConflict: 'lesson_id,learner_id' })
  if (error) throw new Error(error.message)
}

// ── Assignments ───────────────────────────────────────────────
export async function getAssignmentsForEducator(educatorId: string) {
  const { data: edu } = await supabaseAdmin.from('educators').select('id').eq('user_id', educatorId).single()
  if (!edu) return []
  const { data } = await supabaseAdmin.from('assignments')
    .select('*, lessons(title, lesson_date, subjects(name), year_levels(name), class_groups(name))')
    .eq('educator_id', edu.id)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getAssignmentWithQuestions(assignmentId: string) {
  const { data } = await supabaseAdmin.from('assignments')
    .select('*, lessons(*, subjects(name), year_levels(name), class_groups(name)), assignment_questions(*, assignment_options(*))')
    .eq('id', assignmentId).single()
  return data
}

export async function publishAssignment(assignmentId: string, educatorUserId: string) {
  const { data: assignment } = await supabaseAdmin.from('assignments')
    .select('lesson_id, educator_id, educators(user_id)')
    .eq('id', assignmentId).single()
  if (!assignment) throw new Error('Assignment not found')
  if ((assignment.educators as any)?.user_id !== educatorUserId) throw new Error('Forbidden')

  await supabaseAdmin.from('assignments').update({ is_published: true }).eq('id', assignmentId)

  // Auto-create pending submissions for present learners
  const { data: present } = await supabaseAdmin.from('attendances')
    .select('learner_id').eq('lesson_id', assignment.lesson_id).eq('status', 'present')
  if (!present?.length) return

  const { data: assignment2 } = await supabaseAdmin.from('assignments')
    .select('assignment_questions(marks)').eq('id', assignmentId).single()
  const maxScore = (assignment2?.assignment_questions as any[])?.reduce((s: number, q: any) => s + q.marks, 0) ?? 0

  const subs = present.map((p: any) => ({
    assignment_id: assignmentId,
    learner_id: p.learner_id,
    status: 'pending',
    max_score: maxScore,
  }))
  await supabaseAdmin.from('assignment_submissions').upsert(subs, { onConflict: 'assignment_id,learner_id', ignoreDuplicates: true })
}

// ── Submissions ───────────────────────────────────────────────
export async function getLearnerSubmissions(learnerUserId: string) {
  const { data: learner } = await supabaseAdmin.from('learners').select('id').eq('user_id', learnerUserId).single()
  if (!learner) return []
  const { data } = await supabaseAdmin.from('assignment_submissions')
    .select('*, assignments(title, deadline, time_limit_mins, is_published, lessons(subjects(name), year_levels(name)))')
    .eq('learner_id', learner.id)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function startSubmission(assignmentId: string, learnerUserId: string) {
  const { data: learner } = await supabaseAdmin.from('learners').select('id').eq('user_id', learnerUserId).single()
  if (!learner) throw new Error('Learner not found')
  const { data: sub } = await supabaseAdmin.from('assignment_submissions')
    .select('id, status, started_at').eq('assignment_id', assignmentId).eq('learner_id', learner.id).single()
  if (!sub) throw new Error('Submission record not found — you may not be enrolled in this assignment')
  if (sub.status === 'submitted') throw new Error('Already submitted')
  if (sub.status === 'missed') throw new Error('Deadline has passed')
  if (!sub.started_at) {
    await supabaseAdmin.from('assignment_submissions').update({ started_at: new Date().toISOString() }).eq('id', sub.id)
  }
  return sub.id
}

export async function submitAnswers(submissionId: string, answers: { question_id: string; option_id: string }[], learnerUserId: string) {
  // Verify ownership
  const { data: sub } = await supabaseAdmin.from('assignment_submissions')
    .select('id, assignment_id, learner_id, max_score, learners(user_id)')
    .eq('id', submissionId).single()
  if (!sub || (sub.learners as any)?.user_id !== learnerUserId) throw new Error('Forbidden')
  if (sub.status === 'submitted') throw new Error('Already submitted')

  // Score answers
  let score = 0
  const answerRows = []
  for (const a of answers) {
    const { data: opt } = await supabaseAdmin.from('assignment_options').select('is_correct, question_id, assignment_questions(marks)').eq('id', a.option_id).single()
    const isCorrect = opt?.is_correct ?? false
    if (isCorrect) score += (opt?.assignment_questions as any)?.marks ?? 1
    answerRows.push({ submission_id: submissionId, question_id: a.question_id, selected_option_id: a.option_id, is_correct: isCorrect })
  }
  await supabaseAdmin.from('submission_answers').upsert(answerRows, { onConflict: 'submission_id,question_id' })
  await supabaseAdmin.from('assignment_submissions').update({ status: 'submitted', score, submitted_at: new Date().toISOString() }).eq('id', submissionId)
  return { score, max_score: sub.max_score }
}

export async function markMissedSubmissions() {
  const now = new Date().toISOString()
  const { data: expired } = await supabaseAdmin.from('assignment_submissions')
    .select('id, assignment_id, assignments(deadline)')
    .eq('status', 'pending')
  if (!expired) return 0
  const missedIds = expired.filter((s: any) => (s.assignments as any)?.deadline < now).map((s: any) => s.id)
  if (!missedIds.length) return 0
  await supabaseAdmin.from('assignment_submissions').update({ status: 'missed' }).in('id', missedIds)
  return missedIds.length
}
