'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCorpus } from '@/lib/api'

interface Drug {
  drug: string
  atc_code?: string
}

export function CompareSelector() {
  const router = useRouter()
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [drugA, setDrugA] = useState<string>('')
  const [drugB, setDrugB] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [corpusVersion, setCorpusVersion] = useState<string>('')

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const corpus = await getCorpus()
        setDrugs(corpus.drugs.sort((a, b) => a.drug.localeCompare(b.drug)))
        setCorpusVersion(corpus.version)
      } catch (err) {
        console.error('Failed to load drugs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDrugs()
  }, [])

  const handleCompare = () => {
    if (drugA && drugB && drugA !== drugB) {
      router.push(`/medical/compare?a=${drugA}&b=${drugB}`)
    }
  }

  const canCompare = drugA && drugB && drugA !== drugB

  if (loading) {
    return (
      <div className="text-center py-12 text-eve-muted">
        Loading substances...
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-eve-text-strong mb-2">
        Compare Substances
      </h1>
      <p className="text-sm text-eve-muted mb-8">
        Side-by-side descriptive comparison from the same locked evidence snapshot.
      </p>

      <div className="bg-eve-card border border-eve-border rounded-xl p-6 space-y-6">
        {/* Substance A */}
        <div>
          <label className="block text-sm font-medium text-eve-muted mb-2">
            Substance A
          </label>
          <select
            value={drugA}
            onChange={(e) => setDrugA(e.target.value)}
            className="w-full p-3 bg-eve-bg border border-eve-border rounded-lg text-eve-text-strong focus:border-eve-accent focus:outline-none capitalize"
          >
            <option value="">Select substance...</option>
            {drugs.map((d) => (
              <option 
                key={d.drug} 
                value={d.drug}
                disabled={d.drug === drugB}
              >
                {d.drug} {d.atc_code ? `(${d.atc_code})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Substance B */}
        <div>
          <label className="block text-sm font-medium text-eve-muted mb-2">
            Substance B
          </label>
          <select
            value={drugB}
            onChange={(e) => setDrugB(e.target.value)}
            className="w-full p-3 bg-eve-bg border border-eve-border rounded-lg text-eve-text-strong focus:border-eve-accent focus:outline-none capitalize"
          >
            <option value="">Select substance...</option>
            {drugs.map((d) => (
              <option 
                key={d.drug} 
                value={d.drug}
                disabled={d.drug === drugA}
              >
                {d.drug} {d.atc_code ? `(${d.atc_code})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Compare button */}
        <button
          onClick={handleCompare}
          disabled={!canCompare}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            canCompare
              ? 'bg-eve-accent text-white hover:bg-eve-accent/90'
              : 'bg-eve-border text-eve-muted cursor-not-allowed'
          }`}
        >
          Compare
        </button>

        {/* Corpus info */}
        {corpusVersion && (
          <p className="text-center text-xs text-eve-muted">
            Corpus: <span className="font-mono text-eve-accent">{corpusVersion}</span>
          </p>
        )}
      </div>
    </div>
  )
}
