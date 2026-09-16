import { NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { book_id, last_read_index, bookmarks } = await req.json()

  if (!book_id) {
    return NextResponse.json({ error: 'Missing book_id' }, { status: 400 })
  }

  const updates: any = {}
  if (last_read_index !== undefined) updates.last_read_index = last_read_index
  if (bookmarks !== undefined) updates.bookmarks = bookmarks

  const { error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', book_id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
