import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  // Protected routes
  const protectedPaths = ['/medical']
  const isProtected = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))
  
  if (isProtected && !session) {
    // Redirect to eveverified.com login
    const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL || 'https://eveverified.com/medical'
    return NextResponse.redirect(loginUrl)
  }
  
  return res
}

export const config = {
  matcher: ['/medical/:path*']
}
