export type UserRole = 'super_admin' | 'admin' | 'educator' | 'learner'
export type LessonType = 'general' | 'one_to_one'
export type LessonStatus = 'scheduled' | 'completed' | 'cancelled'
export type AttendanceStatus = 'present' | 'absent'
export type LearnerStatus = 'active' | 'inactive' | 'suspended'
export type SubmissionStatus = 'pending' | 'submitted' | 'missed' | 'scored'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  is_active: boolean
  created_at: string
}

export interface YearLevel {
  id: string
  name: string
  sort_order: number
  is_private: boolean
  is_active: boolean
}

export interface ClassGroup {
  id: string
  year_level_id: string
  name: string
  is_active: boolean
  year_levels?: YearLevel
}

export interface Subject {
  id: string
  name: string
  code?: string
  is_active: boolean
}

export interface Educator {
  id: string
  user_id: string
  staff_id?: string
  specialization?: string
  users?: User
}

export interface Learner {
  id: string
  user_id: string
  year_level_id?: string
  class_group_id?: string
  admission_number?: string
  date_of_birth?: string
  status: LearnerStatus
  users?: User
  year_levels?: YearLevel
  class_groups?: ClassGroup
}

export interface Lesson {
  id: string
  year_level_id?: string
  class_group_id?: string
  subject_id: string
  title: string
  lesson_date: string
  lesson_type: LessonType
  one_to_one_learner_id?: string
  attendance_locked: boolean
  status: LessonStatus
  notes?: string
  created_by: string
  subjects?: Subject
  year_levels?: YearLevel
  class_groups?: ClassGroup
}

export interface Assignment {
  id: string
  lesson_id: string
  educator_id: string
  title: string
  instructions?: string
  time_limit_mins?: number
  deadline: string
  is_published: boolean
  created_at: string
  lessons?: Lesson
}

export interface AssignmentQuestion {
  id: string
  assignment_id: string
  question_text: string
  marks: number
  sort_order: number
  assignment_options?: AssignmentOption[]
}

export interface AssignmentOption {
  id: string
  question_id: string
  option_text: string
  option_key: string
  is_correct: boolean
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  learner_id: string
  status: SubmissionStatus
  score?: number
  max_score?: number
  started_at?: string
  submitted_at?: string
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface ExamGroup {
  id: string
  name: string
  code?: string
  description?: string
  is_active: boolean
}
