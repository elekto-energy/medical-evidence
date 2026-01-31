/**
 * lib/auth.ts
 * 
 * Supabase Auth client for EVE Medical
 * 
 * Setup:
 * 1. Create project at supabase.com
 * 2. Get URL and anon key from Settings > API
 * 3. Add to .env.local:
 *    NEXT_PUBLIC_SUPABASE_URL=your-url
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
 * 4. Enable Email auth in Authentication > Providers
 * 5. Disable "Confirm email" for demo (or setup email)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create client if credentials exist
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Check if auth is configured
export const isAuthEnabled = () => !!supabase

// Get current user
export const getUser = async () => {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Sign in with email/password
export const signIn = async (email: string, password: string) => {
  if (!supabase) throw new Error('Auth not configured')
  return supabase.auth.signInWithPassword({ email, password })
}

// Sign out
export const signOut = async () => {
  if (!supabase) return
  return supabase.auth.signOut()
}

// Sign up (for creating demo accounts)
export const signUp = async (email: string, password: string) => {
  if (!supabase) throw new Error('Auth not configured')
  return supabase.auth.signUp({ email, password })
}
