import { NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: usage } = await supabase
    .from('daily_usage')
    .select('upload_count')
    .eq('user_id', user.id)
    .eq('usage_date', today)
    .single()

  const count = usage?.upload_count || 0

  if (count >= 3) {
    return NextResponse.json({ allowed: false, error: '하루 무료 분석 한도(3권)를 모두 사용하셨습니다. 내일 다시 이용해주세요.' })
  }

  return NextResponse.json({ allowed: true, count })
}
