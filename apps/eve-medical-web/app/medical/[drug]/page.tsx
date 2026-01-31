import { notFound } from 'next/navigation'
import Link from 'next/link'
import { queryDrug } from '@/lib/api'
import { DrugDetail } from '@/components/DrugDetail'

export const dynamic = 'force-dynamic' // No caching

interface Props {
  params: { drug: string }
}

export default async function DrugPage({ params }: Props) {
  const drug = decodeURIComponent(params.drug)
  const data = await queryDrug(drug)
  
  if (data.status !== 'VERIFIED') {
    notFound()
  }
  
  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          href="/medical"
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm text-eve-muted bg-eve-card border border-eve-border rounded-lg hover:border-eve-accent hover:text-eve-accent transition"
        >
          ← Back to all substances
        </Link>
        
        {/* Drug Detail */}
        <DrugDetail data={data} />
        
        {/* Footer */}
        <footer className="text-center mt-12 text-xs text-eve-muted/50">
          <p>EVE Medical Evidence · Patent Pending EVE-PAT-2026-001</p>
          <p className="mt-2">© 2026 Organiq Sweden AB</p>
        </footer>
      </div>
    </main>
  )
}
