"use client";
import { useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Plus } from "lucide-react";

interface SampleBook {
  id: string;
  title: string;
  author: string;
  lang: string;
  coverColor: string;
  fileName: string;
}

const SAMPLE_BOOKS: SampleBook[] = [
  { id: "en-1", title: "Alice in Wonderland", author: "Lewis Carroll", lang: "English", coverColor: "bg-gray-100", fileName: "en-1.pdf" },
  { id: "en-2", title: "Moby Dick", author: "Herman Melville", lang: "English", coverColor: "bg-gray-200", fileName: "en-2.pdf" },
  { id: "fr-1", title: "Le Petit Prince", author: "Antoine de Saint-Exupéry", lang: "French", coverColor: "bg-gray-100", fileName: "fr-1.pdf" },
  { id: "fr-2", title: "Les Misérables", author: "Victor Hugo", lang: "French", coverColor: "bg-gray-200", fileName: "fr-2.pdf" },
  { id: "ko-1", title: "어린 왕자", author: "생텍쥐페리", lang: "Korean", coverColor: "bg-gray-100", fileName: "ko-1.pdf" },
  { id: "ko-2", title: "별 헤는 밤", author: "윤동주", lang: "Korean", coverColor: "bg-gray-200", fileName: "ko-2.pdf" },
  { id: "ja-1", title: "吾輩は猫である", author: "夏目漱石", lang: "Japanese", coverColor: "bg-gray-100", fileName: "ja-1.pdf" },
  { id: "ja-2", title: "羅生門", author: "芥川龍之介", lang: "Japanese", coverColor: "bg-gray-200", fileName: "ja-2.pdf" },
];

export default function SampleBooks({ userId }: { userId: string }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAddBook = async (book: SampleBook) => {
    if (loadingId) return;
    setLoadingId(book.id);
    try {
      // 1. Fetch PDF from public folder
      const res = await fetch(`/samples/${book.fileName}`);
      const blob = await res.blob();
      const file = new File([blob], book.fileName, { type: "application/pdf" });

      // 2. Upload to Supabase Storage
      const filePath = `${userId}/${Date.now()}_${book.fileName}`;
      const { error: uploadError } = await supabase.storage.from("pdfs").upload(filePath, file);
      if (uploadError) throw uploadError;

      // 3. Insert into Books table
      const { data: bookRecord, error: dbError } = await supabase.from("books").insert({
        user_id: userId,
        title: book.title,
        original_lang: "auto",
        target_lang: "Korean",
        pdf_storage_path: filePath,
      }).select().single();

      if (dbError) throw dbError;

      // 4. Redirect
      router.push(`/reader/${bookRecord.id}`);
    } catch (err: any) {
      console.error(err);
      alert("책 추가 중 오류가 발생했습니다.");
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 pb-12">
      {SAMPLE_BOOKS.map((book) => (
        <button
          key={book.id}
          onClick={() => handleAddBook(book)}
          disabled={loadingId !== null}
          className="group flex flex-col text-left relative"
        >
          <div className={`relative aspect-[2/3] w-full ${book.coverColor} rounded-sm overflow-hidden mb-3 border border-gray-200 shadow-none group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1`}>
            <div className="absolute inset-0 flex flex-col p-4 justify-between">
              <span className="text-[10px] font-mono text-gray-500 uppercase">{book.lang}</span>
              <div>
                <BookOpen className="w-6 h-6 text-gray-400 mb-2" />
                <h3 className="font-serif font-bold text-gray-900 leading-tight mb-1">{book.title}</h3>
                <p className="text-xs text-gray-600">{book.author}</p>
              </div>
            </div>
            
            {/* Hover / Loading Overlay */}
            <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center ${loadingId === book.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {loadingId === book.id ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <div className="flex flex-col items-center text-white">
                  <Plus className="w-8 h-8 mb-1" />
                  <span className="text-xs font-bold">내 서재에 추가</span>
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
