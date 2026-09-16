"use client"
import { useState, useRef } from 'react'
import { Plus, Loader2, UploadCloud } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'

interface UploadButtonProps {
  variant?: 'default' | 'large'
}

export default function UploadButton({ variant = 'default' }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // 1. Check daily limit
      const limitRes = await fetch('/api/books/check-limit')
      const limitData = await limitRes.json()
      
      if (!limitRes.ok || !limitData.allowed) {
        alert(limitData.error || '하루 업로드 한도를 초과했습니다.')
        setIsUploading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // 2. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 3. Create DB record
      const title = file.name.replace(/\.pdf$/i, '')
      const createRes = await fetch('/api/books/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          original_lang: 'en',
          target_lang: 'ko-KR',
          pdf_storage_path: filePath
        })
      })

      if (!createRes.ok) {
        const createData = await createRes.json()
        throw new Error(createData.error || 'Failed to create book record')
      }

      const { book } = await createRes.json()
      
      // 4. Redirect to reader
      router.push(`/reader/${book.id}`)
    } catch (err: any) {
      console.error(err)
      alert(`업로드 중 오류가 발생했습니다: ${err.message}`)
      setIsUploading(false)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (variant === 'large') {
    return (
      <>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2.5 bg-black hover:bg-gray-800 text-white px-8 py-3.5 rounded-sm border border-black text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
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
        className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 sm:px-5 py-2.5 rounded-sm border border-black text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
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
