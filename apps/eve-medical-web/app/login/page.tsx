'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, isAuthEnabled } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // If auth not configured, redirect to medical
  if (!isAuthEnabled()) {
    if (typeof window !== 'undefined') {
      router.push('/medical')
    }
    return null
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        router.push('/medical')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-eve-accent to-eve-blue bg-clip-text text-transparent">
            EVE Medical Evidence
          </h1>
          <p className="text-eve-muted text-sm mt-2">
            Inbjudan krävs för åtkomst
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-eve-card border border-eve-border rounded-2xl p-6">
          <div className="mb-4">
            <label className="block text-sm text-eve-muted mb-2">E-post</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-eve-bg border border-eve-border rounded-lg px-4 py-3 text-sm focus:border-eve-accent outline-none"
              placeholder="din@email.se"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm text-eve-muted mb-2">Lösenord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-eve-bg border border-eve-border rounded-lg px-4 py-3 text-sm focus:border-eve-accent outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-eve-red/10 border border-eve-red/30 rounded-lg text-sm text-eve-red">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-eve-accent to-eve-blue text-black font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>
        
        <p className="text-center text-xs text-eve-muted mt-6">
          Kontakta Organiq Sweden AB för demo-åtkomst
        </p>
      </div>
    </main>
  )
}
