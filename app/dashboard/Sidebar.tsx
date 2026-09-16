"use client"
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Home, Upload, Settings, LogOut, ChevronDown, User, Menu, X, Headphones } from 'lucide-react'

interface SidebarProps {
  userEmail: string
  userName: string
}

export default function Sidebar({ userEmail, userName }: SidebarProps) {
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', label: '내 서재', icon: Home },
    { href: '/dashboard', label: '오디오북', icon: Headphones },
    { href: '/', label: '체험판', icon: Upload },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* ── Mobile Top Bar ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-gray-600">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#333] rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">BookReader</span>
        </Link>
        <button
          onClick={() => setProfileOpen(!profileOpen)} 
          className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm"
        >
          {userName.charAt(0).toUpperCase()}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-white border-r border-gray-100
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-50">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#333] rounded-lg flex items-center justify-center shadow-sm">
              <BookOpen className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">BookReader</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${active 
                    ? 'bg-gray-900 text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-[18px] h-[18px] ${active ? 'text-white' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            )
          })}

          {/* Divider */}
          <div className="!my-6 border-t border-gray-100" />

          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
          >
            <Settings className="w-[18px] h-[18px] text-gray-400" />
            설정
          </Link>
        </nav>

        {/* ── Profile Card (Bottom) ── */}
        <div className="border-t border-gray-100 p-4">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-[11px] text-gray-400 truncate">{userEmail}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-10">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-xs text-gray-400">로그인 계정</p>
                  <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{userEmail}</p>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <User className="w-4 h-4 text-gray-400" />
                    프로필 관리
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4 text-gray-400" />
                    계정 설정
                  </button>
                </div>
                <div className="border-t border-gray-50 py-1">
                  <form action="/auth/logout" method="post">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
