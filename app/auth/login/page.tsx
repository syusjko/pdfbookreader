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

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setErrorMsg('이메일과 비밀번호를 모두 입력해주세요.')
      return
    }
    
    if (authMode === 'signup' && password !== passwordConfirm) {
      setErrorMsg('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // If confirm email is off, signUp also logs in the user automatically.
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      // Improve error messages
      if (err.message.includes('Anonymous')) {
        setErrorMsg('이메일과 비밀번호를 올바르게 입력해주세요.')
      } else if (err.message.includes('Invalid login')) {
        setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else {
        setErrorMsg(err.message)
      }
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
    <div className="h-[100dvh] overflow-y-auto flex w-full bg-white font-sans">
      
      {/* ── Left Side: Cover Image (Hidden on Mobile) ── */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative bg-white border-r border-gray-200">
        <img 
          src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80" 
          alt="Reading a book" 
          className="absolute inset-0 w-full h-full object-cover grayscale mix-blend-luminosity opacity-90"
        />
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* ── Right Side: Auth Form ── */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center px-8 sm:px-12 xl:px-20 relative bg-white">
        
        {/* Back Button */}
        <button 
          onClick={() => {
            if (authMode === 'signup') setAuthMode('login')
            else router.push('/')
          }} 
          className="absolute top-5 sm:top-8 left-5 sm:left-8 text-gray-400 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm font-medium"
        >
          ← 돌아가기
        </button>

        <div className="w-full max-w-[340px] mx-auto mt-16 md:mt-0">
          
          <div className="text-center mb-6 sm:mb-10">
            <h1 className="text-2xl font-serif font-extrabold text-black tracking-tight leading-snug">
              {authMode === 'login' ? (
                <>나만의 오디오북 서재,<br/>BookReader</>
              ) : (
                <>회원가입</>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-4 break-keep">
              {authMode === 'login' ? (
                <>계정을 생성하고 하루 3권의<br/>무료 분석 혜택을 받아보세요.</>
              ) : (
                <>이메일과 비밀번호를 입력하여<br/>새로운 계정을 만드세요.</>
              )}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-xs text-center border border-red-100">
              {errorMsg}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleEmailAuth}>
            <div>
              <input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-gray-400"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="비밀번호 (6자리 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-gray-400"
                required
                minLength={6}
              />
            </div>
            
            {authMode === 'signup' && (
              <div>
                <input
                  type="password"
                  placeholder="비밀번호 확인"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all placeholder:text-gray-400"
                  required
                  minLength={6}
                />
              </div>
            )}

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2.5 sm:py-3.5 rounded-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {authMode === 'login' ? '이메일로 로그인' : '가입하기'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login')
                  setErrorMsg('')
                  setPasswordConfirm('')
                }}
                disabled={loading}
                className="w-full bg-white border border-gray-300 text-black font-bold py-2.5 sm:py-3.5 rounded-sm hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                {authMode === 'login' ? '새 계정 만들기' : '이미 계정이 있으신가요? 로그인'}
              </button>
            </div>
          </form>

          {authMode === 'login' && (
            <>
              <div className="my-6 sm:my-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs font-mono">
                  <span className="px-3 bg-white text-gray-400">또는</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-black font-medium py-2.5 sm:py-3.5 rounded-sm hover:bg-gray-50 transition-colors"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                구글 계정으로 계속하기
              </button>
            </>
          )}
          
        </div>
      </div>
    </div>
  )
}
