'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

export function AuthHeader() {
  const [user, setUser] = useState<any>(null)
  const [isDark, setIsDark] = useState(false) // Light mode default
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Get user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
    
    // Load theme
    const saved = localStorage.getItem('eve-theme')
    if (saved === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL || 'https://eveverified.com/medical'
    window.location.href = loginUrl
  }

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    
    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('eve-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('eve-theme', 'light')
    }
  }

  if (!user) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      <button
        onClick={toggleTheme}
        className="w-10 h-10 rounded-xl bg-eve-card border border-eve-border flex items-center justify-center text-eve-muted hover:text-eve-accent hover:border-eve-accent transition"
        title={isDark ? 'Ljust läge' : 'Mörkt läge'}
      >
        {isDark ? '☀️' : '🌙'}
      </button>
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-eve-card border border-eve-border">
        <span className="text-xs text-eve-muted">{user.email}</span>
        <button 
          onClick={handleLogout}
          className="text-xs text-eve-muted hover:text-eve-accent transition"
        >
          Logga ut
        </button>
      </div>
    </div>
  )
}
