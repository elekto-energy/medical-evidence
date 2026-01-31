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
  const totalEvents = corpus?.total_events || 3600
  const therapeuticAreas = corpus?.therapeutic_areas || 6
  
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 text-xs font-medium rounded-full bg-eve-accent/10 border border-eve-accent/30 text-eve-accent">
          🔒 Patent Pending: EVE-PAT-2026-001
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-eve-accent to-eve-blue bg-clip-text text-transparent">
          EVE Medical Evidence
        </h1>
        
        <p className="text-xl text-eve-muted max-w-2xl mx-auto mb-8">
          Verifierbar navigering av läkemedelssäkerhetsdata från FDA FAERS.
          Ingen rådgivning. Ingen tolkning. Bara spårbar evidens.
        </p>
        
        <Link 
          href="/medical"
          className="inline-block px-8 py-4 bg-gradient-to-r from-eve-accent to-eve-blue text-black font-semibold rounded-xl hover:opacity-90 transition text-lg"
        >
          Utforska Demo →
        </Link>
      </section>
      
      {/* What is this */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">Vad är det här?</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-eve-card border border-eve-border rounded-2xl p-6">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="font-semibold mb-2">Verifierad Data</h3>
            <p className="text-sm text-eve-muted">
              Alla svar kan spåras tillbaka till källan via kryptografiska hash. 
              Inget kan ändras utan att det syns.
            </p>
          </div>
          
          <div className="bg-eve-card border border-eve-border rounded-2xl p-6">
            <div className="text-3xl mb-4">🔐</div>
            <h3 className="font-semibold mb-2">Vittnesläge</h3>
            <p className="text-sm text-eve-muted">
              Systemet visar och filtrerar data, men ger aldrig råd eller 
              rekommendationer. AI som vittne, inte beslutsfattare.
            </p>
          </div>
          
          <div className="bg-eve-card border border-eve-border rounded-2xl p-6">
            <div className="text-3xl mb-4">🏥</div>
            <h3 className="font-semibold mb-2">FDA FAERS</h3>
            <p className="text-sm text-eve-muted">
              Data från FDA:s Adverse Event Reporting System. 
              Rapporterade biverkningar, inte kliniska prövningar.
            </p>
          </div>
        </div>
      </section>
      
      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-eve-card border border-eve-border rounded-2xl p-8">
          <h2 className="text-xl font-bold text-center mb-8">I denna demo</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-eve-accent">{totalSubstances}</div>
              <div className="text-sm text-eve-muted mt-1">Substanser</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-eve-accent">{therapeuticAreas}</div>
              <div className="text-sm text-eve-muted mt-1">Terapiområden</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-eve-accent">{totalEvents.toLocaleString()}</div>
              <div className="text-sm text-eve-muted mt-1">Verifierade Events</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-eve-accent">1</div>
              <div className="text-sm text-eve-muted mt-1">Snapshot</div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-eve-border">
            <h3 className="text-sm font-medium text-eve-muted mb-4 text-center">Terapiområden (ATC)</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1.5 text-xs rounded-lg bg-atc-A/20 text-atc-A">A - Metabolism/Diabetes</span>
              <span className="px-3 py-1.5 text-xs rounded-lg bg-atc-C/20 text-atc-C">C - Kardiovaskulära</span>
              <span className="px-3 py-1.5 text-xs rounded-lg bg-atc-N/20 text-atc-N">N - CNS/Psykiatri</span>
              <span className="px-3 py-1.5 text-xs rounded-lg bg-atc-M/20 text-atc-M">M - Smärta/Inflammation</span>
              <span className="px-3 py-1.5 text-xs rounded-lg bg-atc-J/20 text-atc-J">J - Antiinfektiva</span>
              <span className="px-3 py-1.5 text-xs rounded-lg bg-atc-R/20 text-atc-R">R - Andning/Allergi</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">Hur fungerar verifieringen?</h2>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-eve-accent/20 text-eve-accent flex items-center justify-center mx-auto mb-3 font-bold">1</div>
            <h3 className="font-medium text-sm mb-1">Ingest</h3>
            <p className="text-xs text-eve-muted">Data hämtas från FDA FAERS och hashas</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-eve-accent/20 text-eve-accent flex items-center justify-center mx-auto mb-3 font-bold">2</div>
            <h3 className="font-medium text-sm mb-1">Snapshot</h3>
            <p className="text-xs text-eve-muted">All data låses i en version med Merkle-root</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-eve-accent/20 text-eve-accent flex items-center justify-center mx-auto mb-3 font-bold">3</div>
            <h3 className="font-medium text-sm mb-1">Query</h3>
            <p className="text-xs text-eve-muted">Varje fråga returnerar data + verifieringshash</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-eve-accent/20 text-eve-accent flex items-center justify-center mx-auto mb-3 font-bold">4</div>
            <h3 className="font-medium text-sm mb-1">Verify</h3>
            <p className="text-xs text-eve-muted">Resultat kan verifieras offline mot root-hash</p>
          </div>
        </div>
      </section>
      
      {/* Important notice */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-eve-yellow/10 border border-eve-yellow/30 rounded-2xl p-6 text-center">
          <h3 className="font-semibold text-eve-yellow mb-2">⚠️ Viktig information</h3>
          <p className="text-sm text-eve-yellow/80">
            Detta system ger inte medicinsk rådgivning. FAERS-data har kända begränsningar 
            inklusive underrapportering och rapporteringsbias. Data visar korrelation, inte kausalitet.
            Använd inte för kliniska beslut.
          </p>
        </div>
      </section>
      
      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Redo att utforska?</h2>
        <p className="text-eve-muted mb-8">
          Klicka dig igenom {totalSubstances} substanser med verifierad biverkningsdata.
        </p>
        <Link 
          href="/medical"
          className="inline-block px-8 py-4 bg-gradient-to-r from-eve-accent to-eve-blue text-black font-semibold rounded-xl hover:opacity-90 transition"
        >
          Starta Demo
        </Link>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-eve-border py-8 text-center text-xs text-eve-muted">
        <p>EVE Medical Evidence · Patent Pending EVE-PAT-2026-001</p>
        <p className="mt-2">© 2026 Organiq Sweden AB</p>
      </footer>
    </main>
  )
}
