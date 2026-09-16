"use client"
import { useState, useRef } from 'react'
import { Plus, Loader2, UploadCloud } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UploadButtonProps {
  variant?: 'default' | 'large'
}

export default function UploadButton({ variant = 'default' }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    // TODO: PDF upload to Supabase storage and create DB record.
    setTimeout(() => {
      setIsUploading(false)
      alert("PDF 업로드 기능이 곧 연결됩니다!")
    }, 1500)
  }

  if (variant === 'large') {
    return (
      <>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <UploadCloud className="w-5 h-5" />
          )}
          첫 번째 PDF 업로드하기
        </button>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">PDF 업로드</span>
        <span className="sm:hidden">업로드</span>
      </button>

      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </>
  )
}
