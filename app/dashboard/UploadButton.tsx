"use client"
import { useState, useRef } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UploadButton() {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    // To implement: PDF upload to Supabase storage and create DB record.
    // For now, just simulating a delay then redirecting.
    setTimeout(() => {
      setIsUploading(false)
      alert("PDF 업로드 로직이 곧 구현될 예정입니다!")
    }, 1500)
  }

  return (
    <>
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">새 PDF 업로드</span>
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
