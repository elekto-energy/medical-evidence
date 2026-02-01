import { Suspense } from 'react'
import { CompareView } from '@/components/CompareView'
import { CompareSelector } from '@/components/CompareSelector'
import Link from 'next/link'

export default function ComparePage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string }
}) {
  const drugA = searchParams.a
  const drugB = searchParams.b

  // If both params provided, show comparison
  if (drugA && drugB) {
    return (
      <main className="min-h-screen p-8">
        <Suspense fallback={<div className="text-eve-muted">Loading comparison...</div>}>
          <CompareView drugA={drugA} drugB={drugB} />
        </Suspense>
      </main>
    )
  }

  // Otherwise show selector
  return (
    <main className="min-h-screen p-8">
      <div className="mb-6">
        <Link href="/medical" className="text-sm text-eve-muted hover:text-eve-accent">
          ← Back to all substances
        </Link>
      </div>
      <CompareSelector />
    </main>
  )
}
