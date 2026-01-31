import type { Metadata } from 'next'
import './globals.css'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthHeader } from '@/components/AuthHeader'

export const metadata: Metadata = {
  title: 'EVE Medical Evidence',
  description: 'Verified Adverse Event Data from FDA FAERS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AuthHeader />
        {children}
      </body>
    </html>
  )
}
