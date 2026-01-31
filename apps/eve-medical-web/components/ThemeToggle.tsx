'use client'

import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false) // Light mode default
  
  useEffect(() => {
    const saved = localStorage.getItem('eve-theme')
    if (saved === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])
  
  const toggle = () => {
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
  
  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-xl bg-eve-card border border-eve-border flex items-center justify-center text-eve-muted hover:text-eve-accent hover:border-eve-accent transition"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
