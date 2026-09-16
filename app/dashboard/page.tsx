import { createClient } from '../../utils/supabase/server'
import Link from 'next/link'
import { BookOpen, Clock, MoreVertical, Plus, UploadCloud, Headphones, Languages } from 'lucide-react'
import UploadButton from './UploadButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '회원'

  return (
    <div className="w-full">

      {/* ── Welcome Header ── */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {userName}님, 환영합니다 👋
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          오늘도 좋은 이야기와 함께하세요.
        </p>
      </div>

      {/* ── Quick Actions (Millie Feature Icons Style) ── */}
      <section className="mb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: <UploadCloud className="w-6 h-6 text-blue-600" />, label: 'PDF 업로드', desc: '새 책 추가', isUpload: true },
            { icon: <Headphones className="w-6 h-6 text-indigo-600" />, label: 'AI 낭독', desc: '듣기 시작' },
            { icon: <Languages className="w-6 h-6 text-emerald-600" />, label: '번역 듣기', desc: '다국어 지원' },
            { icon: <BookOpen className="w-6 h-6 text-amber-600" />, label: '직독직해', desc: '문장 분석' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center gap-2.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <span className="text-sm font-semibold text-gray-800">{item.label}</span>
              <span className="text-[11px] text-gray-400">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── My Library Section ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">내 서재</h2>
            <p className="text-xs text-gray-400 mt-1">{books?.length || 0}권의 책</p>
          </div>
          <UploadButton />
        </div>

        {(!books || books.length === 0) ? (
          /* ── Empty State ── */
          <div className="bg-white border border-gray-100 border-dashed rounded-2xl flex flex-col items-center justify-center py-20 px-6">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5">
              <BookOpen className="w-9 h-9 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">아직 등록된 도서가 없습니다</h3>
            <p className="text-sm text-gray-400 text-center max-w-sm mb-6 break-keep">
              PDF 파일을 업로드하면 AI가 자동으로 분석하고,<br/>
              오디오북처럼 낭독해 드립니다.
            </p>
            <UploadButton variant="large" />
          </div>
        ) : (
          /* ── Books Grid ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {books.map((book) => (
              <Link href={`/reader/${book.id}`} key={book.id} className="group flex flex-col">
                {/* Cover */}
                <div className="relative aspect-[2/3] w-full bg-white rounded-xl overflow-hidden mb-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)] group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 p-5 text-center">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <BookOpen className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="text-gray-700 font-semibold text-xs sm:text-sm line-clamp-3 leading-snug break-keep">
                        {book.title}
                      </span>
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Headphones className="w-5 h-5 text-gray-900" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="px-0.5">
                  <h3 className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {book.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(book.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
