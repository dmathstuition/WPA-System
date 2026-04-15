import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Trophy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { pct, gradeFromPct } from '@/lib/utils'

export default async function ResultPage({ params, searchParams }: { params: { id: string }, searchParams: { score?: string, max?: string } }) {
  const session = await getSession()
  const score = parseInt(searchParams.score ?? '0')
  const max = parseInt(searchParams.max ?? '1')
  const percentage = pct(score, max)
  const grade = gradeFromPct(percentage)

  const { data: sub } = await supabaseAdmin.from('assignment_submissions')
    .select('*, assignments(title, instructions, lessons(subjects(name))), submission_answers(question_id, selected_option_id, is_correct, assignment_questions(question_text, marks), assignment_options(option_text, option_key))')
    .eq('id', params.id).single()

  const { data: allOptions } = sub ? await supabaseAdmin.from('assignment_options').select('*').in('question_id', (sub.submission_answers as any[])?.map((a: any) => a.question_id) ?? []) : { data: [] }
  const optMap = new Map((allOptions ?? []).map((o: any) => [o.id, o]))

  const gradeColors: Record<string, string> = { A: 'text-emerald-600', B: 'text-blue-600', C: 'text-amber-600', D: 'text-orange-600', F: 'text-red-600' }
  const gradeBg: Record<string, string> = { A: 'from-emerald-500 to-teal-500', B: 'from-blue-500 to-indigo-500', C: 'from-amber-500 to-orange-500', D: 'from-orange-500 to-red-500', F: 'from-red-500 to-rose-600' }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/learner/dashboard" className="inline-flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        {/* Score card */}
        <div className={`bg-gradient-to-br ${gradeBg[grade] ?? gradeBg.F} rounded-2xl p-8 text-center text-white mb-6 shadow-xl`}>
          <Trophy size={40} className="mx-auto mb-4 opacity-90" />
          <p className="text-[14px] font-semibold opacity-80 mb-1">{(sub?.assignments as any)?.title}</p>
          <p className="text-[52px] font-black leading-none">{percentage}%</p>
          <p className="text-[18px] font-bold mt-2 opacity-90">Grade {grade}</p>
          <p className="text-[13px] opacity-70 mt-1">{score} out of {max} marks</p>
        </div>

        {/* Answer review */}
        {sub?.submission_answers && (sub.submission_answers as any[]).length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <p className="text-[13px] font-bold text-slate-800">Answer Review</p>
            </div>
            <div className="divide-y divide-slate-50">
              {(sub.submission_answers as any[]).map((a: any, i: number) => {
                const correctOpt = (allOptions ?? []).find((o: any) => o.question_id === a.question_id && o.is_correct)
                return (
                  <div key={a.question_id} className="px-6 py-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${a.is_correct ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {a.is_correct ? <CheckCircle size={13} className="text-emerald-600" /> : <XCircle size={13} className="text-red-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-[12.5px] font-semibold text-slate-800 mb-2">Q{i + 1}. {a.assignment_questions?.question_text}</p>
                        <div className="space-y-1.5">
                          <p className={`text-[11.5px] px-3 py-1.5 rounded-lg ${a.is_correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                            Your answer: <strong>{a.assignment_options?.option_key}. {a.assignment_options?.option_text}</strong>
                          </p>
                          {!a.is_correct && correctOpt && (
                            <p className="text-[11.5px] px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                              Correct: <strong>{correctOpt.option_key}. {correctOpt.option_text}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button asChild><Link href="/learner/dashboard">Back to Dashboard</Link></Button>
          <Button asChild variant="outline"><Link href="/learner/scores">View All Scores</Link></Button>
        </div>
      </div>
    </div>
  )
}
