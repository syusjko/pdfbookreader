"use client"
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent, type: 'login' | 'signup') => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    
    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-white font-sans overflow-hidden">
      
      {/* ── Left Side: Cover Image (Hidden on Mobile) ── */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative bg-gray-100">
        <img 
          src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80" 
          alt="Reading a book" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Optional overlay for aesthetic */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* ── Right Side: Auth Form ── */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center px-8 sm:px-12 xl:px-20 relative bg-white">
        
        {/* Back Button (Top Left of form area) */}
        <button 
          onClick={() => router.push('/')} 
          className="absolute top-8 left-8 text-gray-400 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm font-medium"
        >
          ← 돌아가기
        </button>

        <div className="w-full max-w-[340px] mx-auto mt-12 md:mt-0">
          
          <div className="text-center mb-10">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-snug">
              나만의 오디오북 서재,<br/>BookReader
            </h1>
            <p className="text-sm text-gray-500 mt-4 break-keep">
              계정을 생성하고 하루 3권의<br/>무료 분석 혜택을 받아보세요.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-xs text-center border border-red-100">
              {errorMsg}
            </div>
          )}

          <form className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                required
              />
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={(e) => handleEmailLogin(e, 'login')}
                disabled={loading}
                className="w-full bg-[#fde047] hover:bg-[#facc15] text-gray-900 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                이메일로 로그인
              </button>
              
              <button
                onClick={(e) => handleEmailLogin(e, 'signup')}
                disabled={loading}
                className="w-full bg-white border border-gray-200 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                새 계정 만들기
              </button>
            </div>
          </form>

          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs font-mono">
              <span className="px-3 bg-white text-gray-400">또는</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-medium py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            구글 계정으로 계속하기
          </button>
          
        </div>
      </div>
    </div>
  )
}
