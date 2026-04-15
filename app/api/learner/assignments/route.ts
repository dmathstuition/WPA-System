import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ error: 'Learner portal removed' }, { status: 410 })
}
