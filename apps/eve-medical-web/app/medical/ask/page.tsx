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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-eve-accent to-eve-blue bg-clip-text text-transparent">
            Fråga EVE
          </h1>
          <p className="text-eve-muted text-sm mt-2">
            Naturligt språk → Verifierade fakta
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
              <div className="w-10 h-10 mx-auto rounded-lg bg-eve-verify/10 flex items-center justify-center mb-2">
                <span className="text-eve-verify">🧠</span>
              </div>
              <div className="font-medium">Claude L2</div>
              <div className="text-xs text-eve-muted">Parser</div>
            </div>
            <div className="text-eve-muted">→</div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-eve-accent/10 flex items-center justify-center mb-2">
                <span className="text-eve-accent">⚡</span>
              </div>
              <div className="font-medium">EVE L1</div>
              <div className="text-xs text-eve-muted">Deterministisk</div>
            </div>
            <div className="text-eve-muted">→</div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-eve-verify/10 flex items-center justify-center mb-2">
                <span className="text-eve-verify">📝</span>
              </div>
              <div className="font-medium">Claude L2</div>
              <div className="text-xs text-eve-muted">Renderer</div>
            </div>
          </div>
          <p className="text-xs text-eve-muted text-center mt-4">
            Claude tolkar frågan och formaterar svaret. EVE hämtar och verifierar all data.
          </p>
        </div>
        
        {/* Natural Query Component */}
        <NaturalQuery />
        
        {/* Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="bg-eve-card border border-eve-border rounded-xl p-4">
            <div className="text-lg mb-2">✅ AI gör</div>
            <ul className="text-sm text-eve-muted space-y-1">
              <li>• Tolkar din fråga till parametrar</li>
              <li>• Formaterar EVE:s svar på svenska</li>
              <li>• Hänvisar till källor och hash</li>
            </ul>
          </div>
          <div className="bg-eve-card border border-eve-border rounded-xl p-4">
            <div className="text-lg mb-2">❌ AI gör inte</div>
            <ul className="text-sm text-eve-muted space-y-1">
              <li>• Tolkar medicinsk risk</li>
              <li>• Ger råd eller rekommendationer</li>
              <li>• Använder extern kunskap</li>
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="text-center mt-12 text-xs text-eve-muted/50">
          <p>EVE Medical Evidence · Corpus {corpus.version}</p>
          <p className="mt-1">Patent Pending EVE-PAT-2026-001 · © 2026 Organiq Sweden AB</p>
        </footer>
      </div>
    </main>
  )
}
