-- ============================================================
-- Whyte Pyramid Academy — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Roles enum ───────────────────────────────────────────────
create type user_role as enum ('super_admin', 'admin', 'educator', 'learner');
create type lesson_type as enum ('general', 'one_to_one');
create type lesson_status as enum ('scheduled', 'completed', 'cancelled');
create type attendance_status as enum ('present', 'absent');
create type learner_status as enum ('active', 'inactive', 'suspended');
create type submission_status as enum ('pending', 'submitted', 'missed', 'scored');

-- ── Users ────────────────────────────────────────────────────
create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role user_role not null default 'learner',
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Year levels ───────────────────────────────────────────────
create table year_levels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sort_order int not null default 0,
  is_private boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Class groups ──────────────────────────────────────────────
create table class_groups (
  id uuid primary key default uuid_generate_v4(),
  year_level_id uuid not null references year_levels(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Subjects ──────────────────────────────────────────────────
create table subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Exam groups ───────────────────────────────────────────────
create table exam_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Educators ─────────────────────────────────────────────────
create table educators (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references users(id) on delete cascade,
  staff_id text,
  specialization text,
  created_at timestamptz not null default now()
);

-- ── Learners ──────────────────────────────────────────────────
create table learners (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references users(id) on delete cascade,
  year_level_id uuid references year_levels(id) on delete set null,
  class_group_id uuid references class_groups(id) on delete set null,
  admission_number text,
  date_of_birth date,
  status learner_status not null default 'active',
  created_at timestamptz not null default now()
);

-- ── Learner exam groups ───────────────────────────────────────
create table learner_exam_groups (
  learner_id uuid not null references learners(id) on delete cascade,
  exam_group_id uuid not null references exam_groups(id) on delete cascade,
  primary key (learner_id, exam_group_id)
);

-- ── Lessons ───────────────────────────────────────────────────
create table lessons (
  id uuid primary key default uuid_generate_v4(),
  year_level_id uuid references year_levels(id) on delete set null,
  class_group_id uuid references class_groups(id) on delete set null,
  subject_id uuid not null references subjects(id) on delete restrict,
  title text not null,
  lesson_date date not null,
  lesson_type lesson_type not null default 'general',
  one_to_one_learner_id uuid references learners(id) on delete set null,
  attendance_locked boolean not null default false,
  status lesson_status not null default 'scheduled',
  notes text,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

-- ── Lesson educators ──────────────────────────────────────────
create table lesson_educators (
  lesson_id uuid not null references lessons(id) on delete cascade,
  educator_id uuid not null references educators(id) on delete cascade,
  primary key (lesson_id, educator_id)
);

-- ── Attendances ───────────────────────────────────────────────
create table attendances (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  learner_id uuid not null references learners(id) on delete cascade,
  status attendance_status not null default 'absent',
  marked_at timestamptz,
  marked_by uuid references users(id),
  unique (lesson_id, learner_id)
);

-- ── Assignments ───────────────────────────────────────────────
create table assignments (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null unique references lessons(id) on delete cascade,
  educator_id uuid not null references educators(id) on delete restrict,
  title text not null,
  instructions text,
  time_limit_mins int,
  deadline timestamptz not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Assignment questions ──────────────────────────────────────
create table assignment_questions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  question_text text not null,
  marks int not null default 1,
  sort_order int not null default 0
);

-- ── Assignment options ────────────────────────────────────────
create table assignment_options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references assignment_questions(id) on delete cascade,
  option_text text not null,
  option_key char(1) not null,
  is_correct boolean not null default false
);

-- ── Assignment submissions ────────────────────────────────────
create table assignment_submissions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  learner_id uuid not null references learners(id) on delete cascade,
  status submission_status not null default 'pending',
  score int,
  max_score int,
  started_at timestamptz,
  submitted_at timestamptz,
  unique (assignment_id, learner_id)
);

-- ── Submission answers ────────────────────────────────────────
create table submission_answers (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references assignment_submissions(id) on delete cascade,
  question_id uuid not null references assignment_questions(id) on delete cascade,
  selected_option_id uuid references assignment_options(id) on delete set null,
  is_correct boolean not null default false,
  unique (submission_id, question_id)
);

-- ── Notifications ─────────────────────────────────────────────
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Settings ──────────────────────────────────────────────────
create table settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────
create index on learners(year_level_id);
create index on learners(class_group_id);
create index on lessons(lesson_date);
create index on lessons(year_level_id, class_group_id);
create index on attendances(lesson_id);
create index on attendances(learner_id);
create index on assignment_submissions(assignment_id);
create index on assignment_submissions(learner_id);
create index on notifications(user_id, is_read);

-- ── Updated_at trigger ────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger users_updated_at before update on users
  for each row execute function update_updated_at();

-- ── Row Level Security ────────────────────────────────────────
-- We manage auth ourselves via JWT, so disable RLS for service role access
alter table users disable row level security;
alter table year_levels disable row level security;
alter table class_groups disable row level security;
alter table subjects disable row level security;
alter table educators disable row level security;
alter table learners disable row level security;
alter table lessons disable row level security;
alter table lesson_educators disable row level security;
alter table attendances disable row level security;
alter table assignments disable row level security;
alter table assignment_questions disable row level security;
alter table assignment_options disable row level security;
alter table assignment_submissions disable row level security;
alter table submission_answers disable row level security;
alter table exam_groups disable row level security;
alter table learner_exam_groups disable row level security;
alter table notifications disable row level security;
alter table settings disable row level security;

-- ── Seed: default super admin ─────────────────────────────────
-- Password: SuperAdmin@123 (bcrypt hash)
insert into users (name, email, password_hash, role) values
  ('Super Admin', 'superadmin@whytepyramid.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMlJbekRBw.5qWV8TjlKlLGmHa', 'super_admin'),
  ('Academy Admin', 'admin@whytepyramid.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMlJbekRBw.5qWV8TjlKlLGmHa', 'admin');

insert into settings (key, value) values
  ('academy_name', 'Whyte Pyramid Academy'),
  ('academy_tagline', 'Excellence in Education'),
  ('contact_email', 'admin@whytepyramid.com'),
  ('timezone', 'Africa/Lagos');
