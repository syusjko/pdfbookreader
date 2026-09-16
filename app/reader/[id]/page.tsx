import { createClient } from '../../../utils/supabase/server'
import { redirect } from 'next/navigation'
import AuthPlayer from '../../../components/AuthPlayer'

export default async function ReaderPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Await the params object (Next.js 15 requirement for dynamic params)
  const { id } = await params

  const { data: book, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !book) {
    redirect('/dashboard')
  }

  // Get Signed URL for PDF downloading (valid for 1 hour)
  const { data: signedUrlData, error: urlError } = await supabase
    .storage
    .from('pdfs')
    .createSignedUrl(book.pdf_storage_path, 3600)

  if (urlError || !signedUrlData) {
    redirect('/dashboard')
  }

  return (
    <div className="w-full h-screen bg-white">
      <AuthPlayer 
        bookId={book.id}
        title={book.title}
        signedUrl={signedUrlData.signedUrl}
        initialIndex={book.last_read_index || 0}
        initialBookmarks={book.bookmarks || []}
      />
    </div>
  )
}
