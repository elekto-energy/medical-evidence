import Link from 'next/link'
import { getCorpus } from '@/lib/api'
import { GuidedQueryBuilder } from '@/components/GuidedQueryBuilder'

export const dynamic = 'force-dynamic'

export default async function GuidedQueryPage() {
  const corpus = await getCorpus()
  
  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-eve-accent to-eve-blue bg-clip-text text-transparent">
            Evidence Query Builder
          </h1>
          <p className="text-eve-muted text-sm mt-2">
            Structured queries against {corpus.total_substances} substances · {corpus.total_events.toLocaleString()} verified events
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <Link 
              href="/"
              className="px-3 py-1 text-xs rounded-full bg-eve-card border border-eve-border text-eve-muted hover:border-eve-accent transition"
            >
              ← Startsidan
            </Link>
            <Link 
              href="/medical"
              className="px-3 py-1 text-xs rounded-full bg-eve-card border border-eve-border text-eve-muted hover:border-eve-accent transition"
            >
              Alla substanser
            </Link>
            <span className="px-3 py-1 text-xs rounded-full badge-trinity">
              Trinity Level 1
            </span>
          </div>
        </header>
        
        {/* Query Builder */}
        <GuidedQueryBuilder drugs={corpus.drugs} />
        
        {/* Footer */}
        <footer className="text-center mt-12 text-xs text-eve-muted/50">
          <p>EVE Medical Evidence · Patent Pending EVE-PAT-2026-001</p>
          <p className="mt-2">© 2026 Organiq Sweden AB</p>
        </footer>
      </div>
    </main>
  )
}
