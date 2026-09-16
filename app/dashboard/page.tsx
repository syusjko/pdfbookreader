import { createClient } from '../../utils/supabase/server'
import Link from 'next/link'
import { Plus, BookOpen, Clock, MoreVertical } from 'lucide-react'
import UploadButton from './UploadButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's books from Supabase
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="w-full pb-20">
      
      {/* ── Sub Nav (Filters) ── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 mb-4">
        <button className="whitespace-nowrap px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100">
          모든 도서
        </button>
        <button className="whitespace-nowrap px-4 py-1.5 bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-full border border-gray-200 transition-colors">
          최근 읽은 책
        </button>
        <button className="whitespace-nowrap px-4 py-1.5 bg-white text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-full border border-gray-200 transition-colors">
          오디오북
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">내 서재</h2>
          <p className="text-sm text-gray-500 mt-1">업로드한 PDF 문서를 오디오북으로 즐겨보세요</p>
        </div>
        <UploadButton />
      </div>

      {/* ── Books Grid (Google Play Style) ── */}
      {(!books || books.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
          <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-700">서재가 비어있습니다</h3>
          <p className="text-sm text-gray-500 mt-2 text-center max-w-sm">
            상단의 업로드 버튼을 눌러 PDF 파일을 추가하고<br/>AI 낭독을 시작해 보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-8">
          {books.map((book) => (
            <Link href={`/reader/${book.id}`} key={book.id} className="group flex flex-col">
              {/* Book Cover */}
              <div className="relative aspect-[2/3] w-full bg-gray-200 rounded-md overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-50 p-4 text-center">
                    <span className="text-blue-900 font-serif font-bold text-sm line-clamp-3 leading-snug">
                      {book.title}
                    </span>
                  </div>
                )}
                {/* Overlay on hover (Desktop) */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <BookOpen className="w-5 h-5 text-gray-900 ml-0.5" />
                  </div>
                </div>
              </div>
              
              {/* Book Info */}
              <div className="flex items-start justify-between gap-1">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1 truncate">
                    {book.author || '알 수 없는 저자'}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(book.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-900" onClick={(e) => e.preventDefault()}>
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
