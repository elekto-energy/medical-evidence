import Link from 'next/link'
import { getCorpus } from '@/lib/api'
import { NaturalQuery } from '@/components/NaturalQuery'

export const dynamic = 'force-dynamic'

export default async function AskEvePage() {
  const corpus = await getCorpus()
  
  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-eve-text-strong">Ask</span> <span className="text-eve-accent">EVE</span>
          </h1>
          <p className="text-eve-muted text-xs mt-1">
            Evidence & Verification Engine
          </p>
          <p className="text-eve-muted text-sm mt-2">
            Ask in any language → Receive verified facts
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <Link 
              href="/"
              className="px-3 py-1 text-xs rounded-full bg-eve-card border border-eve-border text-eve-muted hover:border-eve-accent transition"
            >
              ← Home
            </Link>
            <Link 
              href="/medical"
              className="px-3 py-1 text-xs rounded-full bg-eve-card border border-eve-border text-eve-muted hover:border-eve-accent transition"
            >
              All Substances
            </Link>
            <Link 
              href="/medical/query"
              className="px-3 py-1 text-xs rounded-full bg-eve-card border border-eve-border text-eve-muted hover:border-eve-accent transition"
            >
              Query Builder
            </Link>
          </div>
        </header>
        
        {/* Trinity Pipeline Explanation */}
        <div className="mb-8 p-4 bg-eve-card border border-eve-border rounded-xl">
          <div className="flex items-center gap-8 justify-center text-sm">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-eve-slate-soft flex items-center justify-center mb-2">
                <span>🧠</span>
              </div>
              <div className="font-medium text-eve-text-strong">Claude L2</div>
              <div className="text-xs text-eve-muted">Parser</div>
            </div>
            <div className="text-eve-muted">→</div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-eve-accent-soft flex items-center justify-center mb-2">
                <span className="text-eve-accent">⚡</span>
              </div>
              <div className="font-medium text-eve-text-strong">EVE L1</div>
              <div className="text-xs text-eve-muted">Deterministic</div>
            </div>
            <div className="text-eve-muted">→</div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-eve-slate-soft flex items-center justify-center mb-2">
                <span>📝</span>
              </div>
              <div className="font-medium text-eve-text-strong">Claude L2</div>
              <div className="text-xs text-eve-muted">Renderer</div>
            </div>
          </div>
          <p className="text-xs text-eve-muted text-center mt-4">
            Claude interprets your question and formats the response. EVE fetches and verifies all data.
          </p>
        </div>
        
        {/* Natural Query Component */}
        <NaturalQuery />
        
        {/* Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="bg-eve-card border border-eve-border rounded-xl p-4">
            <div className="text-lg mb-2 text-eve-text-strong">✅ AI does</div>
            <ul className="text-sm text-eve-muted space-y-1">
              <li>• Interpret your question into parameters</li>
              <li>• Format EVE's response in your language</li>
              <li>• Reference sources and hashes</li>
            </ul>
          </div>
          <div className="bg-eve-card border border-eve-border rounded-xl p-4">
            <div className="text-lg mb-2 text-eve-text-strong">❌ AI does not</div>
            <ul className="text-sm text-eve-muted space-y-1">
              <li>• Interpret medical risk</li>
              <li>• Give advice or recommendations</li>
              <li>• Use external knowledge</li>
            </ul>
          </div>
        </div>
        
        {/* Language notice */}
        <div className="mt-6 p-4 bg-eve-bg-subtle border border-eve-border rounded-xl text-center">
          <p className="text-sm text-eve-muted">
            🌍 <strong className="text-eve-text">Ask in any language</strong> — EVE responds in the same language as your question.
            <br />
            <span className="text-xs">The language choice affects only presentation, never data or logic.</span>
          </p>
        </div>
        
        {/* Footer */}
        <footer className="text-center mt-12 text-xs text-eve-muted">
          <p>EVE · Evidence & Verification Engine · Corpus {corpus.version}</p>
          <p className="mt-1">Patent Pending EVE-PAT-2026-001 · © 2026 Organiq Sweden AB</p>
        </footer>
      </div>
    </main>
  )
}
