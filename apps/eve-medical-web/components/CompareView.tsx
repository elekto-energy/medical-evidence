'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { queryDrug } from '@/lib/api'
import type { QueryResponse } from '@/lib/types'
import { DrugCompareCard } from './DrugCompareCard'

interface Props {
  drugA: string
  drugB: string
}

export function CompareView({ drugA, drugB }: Props) {
  const [dataA, setDataA] = useState<QueryResponse | null>(null)
  const [dataB, setDataB] = useState<QueryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBoth = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const [resA, resB] = await Promise.all([
          queryDrug(drugA),
          queryDrug(drugB)
        ])
        
        // EVE governance: corpus must match
        const versionA = resA.corpus?.version || resA.corpus_version
        const versionB = resB.corpus?.version || resB.corpus_version
        
        if (versionA !== versionB) {
          setError('Comparison unavailable: datasets originate from different evidence snapshots.')
          return
        }
        
        setDataA(resA)
        setDataB(resB)
      } catch (err) {
        setError('Failed to load data for comparison')
      } finally {
        setLoading(false)
      }
    }
    
    fetchBoth()
  }, [drugA, drugB])

  if (loading) {
    return <div className="text-center py-12 text-eve-muted">Loading comparison...</div>
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-6 bg-eve-notice-soft border border-eve-notice/20 rounded-xl text-center">
          <p className="text-eve-notice">{error}</p>
        </div>
      </div>
    )
  }

  if (!dataA || !dataB) return null

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/medical" className="text-sm text-eve-muted hover:text-eve-accent">
          ← Back to all substances
        </Link>
        <h1 className="text-2xl font-semibold text-eve-text-strong mt-2">
          Side-by-side Descriptive Comparison
        </h1>
        <p className="text-sm text-eve-muted mt-1">
          Both substances evaluated using identical evidence snapshot
        </p>
      </div>

      {/* What this is / is not */}
      <div className="mb-6 p-4 bg-eve-bg-subtle border border-eve-border rounded-xl">
        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-eve-verified font-medium">✓ This comparison shows:</span>
            <span className="text-eve-muted ml-2">Reported events from same locked corpus</span>
          </div>
          <div>
            <span className="text-eve-notice font-medium">✗ This is NOT:</span>
            <span className="text-eve-muted ml-2">A recommendation of one over the other</span>
          </div>
        </div>
      </div>

      {/* Side-by-side cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <DrugCompareCard data={dataA} />
        <DrugCompareCard data={dataB} />
      </div>

      {/* Corpus verification */}
      <div className="text-center text-xs text-eve-muted p-4 bg-eve-bg-subtle rounded-xl">
        <div>Corpus: <span className="font-mono text-eve-accent">{dataA.corpus?.version || dataA.corpus_version}</span></div>
        <div className="mt-1">Root Hash: <span className="font-mono">{(dataA.corpus?.root_hash || dataA.root_hash || '').slice(0, 32)}...</span></div>
      </div>
    </div>
  )
}
