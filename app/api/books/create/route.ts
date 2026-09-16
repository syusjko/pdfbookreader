import { NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, original_lang, target_lang, pdf_storage_path } = body

  if (!title || !pdf_storage_path) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
    return NextResponse.json({ error: '하루 업로드 한도를 초과했습니다.' }, { status: 403 })
  }

  const { data: book, error: bookError } = await supabase
    .from('books')
    .insert({
      user_id: user.id,
      title,
      original_lang: original_lang || 'en',
      target_lang: target_lang || 'ko-KR',
      pdf_storage_path
    })
    .select()
    .single()

  if (bookError) {
    console.error('Book insert error:', bookError)
    return NextResponse.json({ error: bookError.message }, { status: 500 })
  }

  if (usage) {
    await supabase.from('daily_usage').update({ upload_count: count + 1 }).eq('user_id', user.id).eq('usage_date', today)
  } else {
    await supabase.from('daily_usage').insert({ user_id: user.id, usage_date: today, upload_count: 1 })
  }

  return NextResponse.json({ book })
}
