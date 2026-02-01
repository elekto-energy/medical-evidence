import Link from 'next/link'
import { getCorpus } from '@/lib/api'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let corpus = null
  try {
    corpus = await getCorpus()
  } catch (e) {
    // API not running, use fallback values
  }
  
  const totalSubstances = corpus?.total_substances || 36
  const totalEvents = corpus?.total_events || 18000
  const therapeuticAreas = corpus?.therapeutic_areas || 6
  
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 text-xs font-medium rounded-full bg-eve-notice/10 border border-eve-notice/30 text-eve-notice">
          🔒 Patent Pending: EVE-PAT-2026-001
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          <span className="text-eve-accent">EVE</span> <span className="text-eve-text-strong">Medical Evidence</span>
        </h1>
        
        <p className="text-sm text-eve-muted mb-6">
          Evidence & Verification Engine
        </p>
        
        <p className="text-lg text-eve-muted max-w-2xl mx-auto mb-8">
          Verifiable navigation of drug safety data from FDA FAERS.
          No advice. No interpretation. Only traceable evidence.
        </p>
        
        <Link 
          href="/medical"
          className="inline-block px-8 py-4 bg-eve-accent text-white font-semibold rounded-xl hover:bg-eve-accent-hover transition text-lg"
        >
          Explore Demo →
        </Link>
      </section>
      
      {/* What is this */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12 text-eve-text-strong">What is this?</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-eve-card border border-eve-border rounded-2xl p-6">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="font-semibold mb-2 text-eve-text-strong">Verified Data</h3>
            <p className="text-sm text-eve-muted">
              All answers can be traced back to source via cryptographic hash. 
              Nothing can change without it being visible.
            </p>
          </div>
          
          <div className="bg-eve-card border border-eve-border rounded-2xl p-6">
            <div className="text-3xl mb-4">🔐</div>
            <h3 className="font-semibold mb-2 text-eve-text-strong">Witness Mode</h3>
            <p className="text-sm text-eve-muted">
              The system displays and filters data, but never gives advice or 
              recommendations. AI as witness, not decision-maker.
            </p>
          </div>
          
          <div className="bg-eve-card border border-eve-border rounded-2xl p-6">
            <div className="text-3xl mb-4">🏥</div>
            <h3 className="font-semibold mb-2 text-eve-text-strong">FDA FAERS</h3>
            <p className="text-sm text-eve-muted">
              Data from FDA's Adverse Event Reporting System. 
              Reported adverse events, not clinical trials.
            </p>
          </div>
        </div>
      </section>
      
      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-eve-card border border-eve-border rounded-2xl p-8">
          <h2 className="text-xl font-bold text-center mb-8 text-eve-text-strong">In this demo</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-eve-accent">{totalSubstances}</div>
              <div className="text-sm text-eve-muted mt-1">Substances</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-eve-accent">{therapeuticAreas}</div>
              <div className="text-sm text-eve-muted mt-1">Therapeutic Areas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-eve-accent">{totalEvents.toLocaleString()}</div>
              <div className="text-sm text-eve-muted mt-1">Verified Events</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-eve-accent">1</div>
              <div className="text-sm text-eve-muted mt-1">Snapshot</div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-eve-border">
            <h3 className="text-sm font-medium text-eve-muted mb-4 text-center">Therapeutic Areas (ATC)</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1.5 text-xs rounded-lg bg-atc-A/20 text-atc-A font-medium">A - Metabolism/Diabetes</span>
              <span className="px-3 py-1.5 text-xs rounded-lg bg-atc-C/20 text-atc-C font-medium">C - Cardiovascular</span>
              <span className="px-3 py-1.5 text-xs rounded-lg bg-atc-N/20 text-atc-N font-medium">N - CNS/Psychiatry</span>
              <span className="px-3 py-1.5 text-xs rounded-lg bg-atc-M/20 text-atc-M font-medium">M - Pain/Inflammation</span>
              <span className="px-3 py-1.5 text-xs rounded-lg bg-atc-J/20 text-atc-J font-medium">J - Anti-infectives</span>
              <span className="px-3 py-1.5 text-xs rounded-lg bg-atc-R/20 text-atc-R font-medium">R - Respiratory/Allergy</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12 text-eve-text-strong">How does verification work?</h2>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-eve-accent/20 text-eve-accent flex items-center justify-center mx-auto mb-3 font-bold">1</div>
            <h3 className="font-medium text-sm mb-1 text-eve-text-strong">Ingest</h3>
            <p className="text-xs text-eve-muted">Data fetched from FDA FAERS and hashed</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-eve-accent/20 text-eve-accent flex items-center justify-center mx-auto mb-3 font-bold">2</div>
            <h3 className="font-medium text-sm mb-1 text-eve-text-strong">Snapshot</h3>
            <p className="text-xs text-eve-muted">All data locked in a version with Merkle root</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-eve-accent/20 text-eve-accent flex items-center justify-center mx-auto mb-3 font-bold">3</div>
            <h3 className="font-medium text-sm mb-1 text-eve-text-strong">Query</h3>
            <p className="text-xs text-eve-muted">Every query returns data + verification hash</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-eve-accent/20 text-eve-accent flex items-center justify-center mx-auto mb-3 font-bold">4</div>
            <h3 className="font-medium text-sm mb-1 text-eve-text-strong">Verify</h3>
            <p className="text-xs text-eve-muted">Results can be verified offline against root hash</p>
          </div>
        </div>
      </section>
      
      {/* Important notice */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-eve-notice/10 border border-eve-notice/30 rounded-2xl p-6 text-center">
          <h3 className="font-semibold text-eve-notice mb-2">⚠️ Important Notice</h3>
          <p className="text-sm text-eve-text">
            This system does not provide medical advice. FAERS data has known limitations 
            including underreporting and reporting bias. Data shows correlation, not causality.
            Do not use for clinical decisions.
          </p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-eve-border py-8 text-center text-xs text-eve-muted">
        <p>EVE Medical Evidence · Corpus v20260131-01</p>
        <p className="mt-1">Patent Pending EVE-PAT-2026-001 · © 2026 Organiq Sweden AB</p>
      </footer>
    </main>
  )
}
