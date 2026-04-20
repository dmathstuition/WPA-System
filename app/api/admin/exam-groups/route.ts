import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
export async function GET(){try{await requireRole(['admin','super_admin','educator']);const{data,error}=await supabaseAdmin.from('exam_groups').select('*').order('name');if(error)throw error;return NextResponse.json(data??[])}catch(e:any){return NextResponse.json({error:e.message},{status:500})}}
export async function POST(req:NextRequest){try{await requireRole(['admin']);const b=await req.json();if(!b.name)return NextResponse.json({error:'Name required'},{status:400});await supabaseAdmin.from('exam_groups').insert({name:b.name,code:b.code||null,description:b.description||null});return NextResponse.json({ok:true},{status:201})}catch(e:any){return NextResponse.json({error:e.message},{status:400})}}
export async function DELETE(req:NextRequest){try{await requireRole(['admin']);const{id}=await req.json();await supabaseAdmin.from('exam_groups').delete().eq('id',id);return NextResponse.json({ok:true})}catch(e:any){return NextResponse.json({error:e.message},{status:500})}}
