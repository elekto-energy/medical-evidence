import { Suspense } from 'react'
import { CompareView } from '@/components/CompareView'

export default function ComparePage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string }
}) {
  const drugA = searchParams.a
  const drugB = searchParams.b

  if (!drugA || !drugB) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-eve-text-strong mb-4">Compare Substances</h1>
          <p className="text-eve-muted mb-6">
            Select two substances to compare side-by-side using the same evidence snapshot.
          </p>
          <div className="p-6 bg-eve-card border border-eve-border rounded-xl">
            <p className="text-sm text-eve-muted">
              Usage: <code className="bg-eve-bg px-2 py-1 rounded">/medical/compare?a=warfarin&b=apixaban</code>
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <Suspense fallback={<div className="text-eve-muted">Loading comparison...</div>}>
        <CompareView drugA={drugA} drugB={drugB} />
      </Suspense>
    </main>
  )
}
