'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch('/api/educator/assignments?id=' + id)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="p-8 text-center">
      <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-[12.5px] text-slate-400">Loading…</p>
    </div>
  )

  if (!data || data.error) return (
    <div className="p-8 text-center">
      <p className="text-[13px] text-red-500 font-medium">{data?.error ?? 'Assignment not found.'}</p>
      <Link href="/educator/assignments" className="text-[12px] text-amber-600 mt-2 inline-block">← Back</Link>
    </div>
  )

  const questions = data.questions ?? []

  return (
    <>
      <Topbar user={{ id:'', name:'Educator', email:'', role:'educator' }}
              title={data.title} subtitle="Assignment details" />
      <div className="p-5 max-w-3xl">
        <Link href="/educator/assignments" className="inline-flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 mb-5 transition">
          <ArrowLeft size={14} /> Back to Assignments
        </Link>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-5">
          <p className="text-[14px] font-bold text-slate-900 mb-2">{data.title}</p>
          {data.instructions && <p className="text-[12.5px] text-slate-600 mb-3">{data.instructions}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={data.assignment_type === 'pdf' ? 'info' : 'purple'}>
              {data.assignment_type === 'pdf' ? 'PDF' : 'CBT'}
            </Badge>
            {data.deadline && (
              <span className="text-[11px] text-slate-400">
                Due: {new Date(data.deadline).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
              </span>
            )}
            {data.time_limit_mins && (
              <span className="text-[11px] text-slate-400">{data.time_limit_mins} min time limit</span>
            )}
          </div>
        </div>

        {questions.length > 0 && (
          <div className="space-y-3">
            <p className="text-[13px] font-bold text-slate-800">{questions.length} Question{questions.length > 1 ? 's' : ''}</p>
            {questions.map((q: any, qi: number) => (
              <div key={q.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <p className="text-[12.5px] font-semibold text-slate-800 mb-2">
                  <span className="text-amber-500 font-black mr-2">Q{qi+1}.</span>{q.question_text}
                  <span className="text-slate-400 font-normal ml-2">({q.marks} mark{q.marks > 1 ? 's' : ''})</span>
                </p>
                <div className="space-y-1.5 pl-6">
                  {(q.assignment_options ?? []).map((o: any) => (
                    <div key={o.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] ${
                      o.is_correct ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold' : 'text-slate-600'
                    }`}>
                      <span className="font-bold text-slate-400 w-4">{o.option_key}.</span>
                      <span className="flex-1">{o.option_text}</span>
                      {o.is_correct && <Check size={13} className="text-emerald-600" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
