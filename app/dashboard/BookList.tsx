"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Headphones, Loader2 } from "lucide-react";

export default function BookList({ books }: { books: any[] }) {
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null);
  const router = useRouter();

  const handleBookClick = (e: React.MouseEvent, bookId: string) => {
    e.preventDefault();
    setLoadingBookId(bookId);
    router.push(`/reader/${bookId}`);
  };

  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-5 sm:overflow-visible sm:pb-0 scrollbar-hide">
      {books.map((book) => (
        <a 
          href={`/reader/${book.id}`}
          onClick={(e) => handleBookClick(e, book.id)}
          key={book.id} 
          className="group flex flex-col shrink-0 w-32 sm:w-auto snap-start relative"
        >
          {/* Cover */}
          <div className="relative aspect-[2/3] w-full bg-white rounded-sm overflow-hidden mb-3 border border-gray-200 shadow-none group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover grayscale mix-blend-luminosity" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f7f7f7] border border-gray-200 p-3 sm:p-5 text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2 sm:mb-3">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
                <span className="text-gray-900 font-serif font-bold text-xs sm:text-sm line-clamp-3 leading-snug break-keep">
                  {book.title}
                </span>
              </div>
            )}
            
            {/* Hover / Loading Overlay */}
            <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center ${loadingBookId === book.id ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'}`}>
              {loadingBookId === book.id ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform scale-75 sm:group-hover:scale-100 transition-transform duration-300">
                  <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col">
            <h3 className="font-serif font-bold text-gray-900 text-xs sm:text-sm line-clamp-1 leading-tight">{book.title}</h3>
            <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5 opacity-50">
              <span className="text-[9px] sm:text-[10px] font-mono uppercase bg-gray-100 px-1.5 py-0.5 rounded-sm text-gray-600">
                {book.original_lang || 'AUTO'}
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
