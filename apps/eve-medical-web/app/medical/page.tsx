import Link from 'next/link'
import { getCorpus } from '@/lib/api'
import { MasterTable } from '@/components/MasterTable'
import { CorpusHeader } from '@/components/CorpusHeader'

export const dynamic = 'force-dynamic'

export default async function MedicalPage() {
  const corpus = await getCorpus()
  
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 text-eve-muted hover:text-eve-accent transition text-sm">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold">
            <span className="text-eve-accent">EVE</span> <span className="text-eve-text-strong">Medical Evidence</span>
          </h1>
          <p className="text-eve-muted text-xs mt-1">
            Evidence & Verification Engine
          </p>
          <p className="text-eve-muted text-sm mt-2">
            Verified Adverse Event Data from FDA FAERS
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <span className="px-3 py-1 text-xs rounded-full bg-eve-card border border-eve-border text-eve-muted">
              🔒 Patent Pending
            </span>
            <span className="px-3 py-1 text-xs rounded-full bg-eve-card border border-eve-border text-eve-muted">
              ✓ {corpus.version}
            </span>
            <Link 
              href="/medical/query"
              className="px-3 py-1 text-xs rounded-full bg-eve-card border border-eve-border text-eve-muted hover:border-eve-accent hover:text-eve-accent transition"
            >
              ⚡ Query Builder
            </Link>
            <Link 
              href="/medical/ask"
              className="px-3 py-1 text-xs rounded-full bg-eve-accent text-white font-medium hover:bg-eve-accent-hover transition"
            >
              💬 Ask EVE
            </Link>
            <Link 
              href="/medical/compare"
              className="px-3 py-1 text-xs rounded-full bg-eve-card border border-eve-border text-eve-muted hover:border-eve-accent hover:text-eve-accent transition"
            >
              ⚖️ Compare
            </Link>
          </div>
        </header>
        
        {/* Corpus Stats */}
        <CorpusHeader corpus={corpus} />
        
        {/* Table */}
        <div className="bg-eve-card border border-eve-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-eve-border">
            <h2 className="font-semibold text-eve-text-strong">All Substances</h2>
            <p className="text-xs text-eve-muted mt-1">Click a substance to explore detailed, deterministic evidence</p>
          </div>
          <MasterTable drugs={corpus.drugs} />
        </div>
        
        {/* Footer */}
        <footer className="text-center mt-12 text-xs text-eve-muted">
          <p>EVE · Evidence & Verification Engine · Patent Pending EVE-PAT-2026-001</p>
          <p className="mt-1">© 2026 Organiq Sweden AB</p>
        </footer>
      </div>
    </main>
  )
}
