import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'
import AssignmentClient from './client'
export default async function PublicAssignmentPage({params}:{params:{token:string}}){
  const{data:a}=await supabaseAdmin.from('assignments').select('id,title,instructions,assignment_type,deadline,time_limit_mins,pdf_url,pdf_filename,is_published,share_token').eq('share_token',params.token).maybeSingle()
  if(!a||!a.is_published)return notFound()
  const dl=new Date(a.deadline);const expired=dl<new Date()
  let questions:any[]=[]
  if(a.assignment_type==='cbt'){const{data}=await supabaseAdmin.from('assignment_questions').select('id,question_text,marks,sort_order,assignment_options(id,option_text,option_key)').eq('assignment_id',a.id).order('sort_order');questions=data??[]}
  return(
    <div className="min-h-screen" style={{background:'linear-gradient(135deg,#f8fafc,#f1f5f9)'}}>
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10"><div className="max-w-2xl mx-auto px-5 py-3 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg></div><div><p className="text-[13px] font-black text-slate-900">Whyte Pyramid Academy</p><p className="text-[10.5px] text-slate-400">Assignment Portal</p></div></div></div>
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"><div className="flex items-start justify-between gap-3 mb-4"><h1 className="text-[20px] font-black text-slate-900">{a.title}</h1><Badge variant={expired?'destructive':'success'}>{expired?'Closed':'Open'}</Badge></div>{a.instructions&&<p className="text-[13px] text-slate-600 leading-relaxed mb-4">{a.instructions}</p>}<div className="flex flex-wrap gap-4 text-[12px] text-slate-500"><div className="flex items-center gap-1.5"><Calendar size={13}/>Due: <strong>{dl.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</strong></div>{a.time_limit_mins&&<div className="flex items-center gap-1.5"><Clock size={13}/><strong>{a.time_limit_mins} min</strong></div>}</div></div>
        {expired?<div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center"><p className="text-[16px] font-bold text-red-700">Assignment closed</p></div>:<AssignmentClient assignment={{...a,questions}} token={params.token}/>}
      </div>
    </div>
  )
}
