'use client'

import { useState } from 'react'

interface GuidedQueryParams {
  drug: string
  sex?: string
  age_group?: string
  serious?: boolean | null
  reaction?: string
}

interface ReactionSummary {
  reaction: string
  count: number
  percent: number
}

interface GuidedQueryResult {
  status: string
  trinity_level: number
  corpus_version: string
  root_hash: string
  results: {
    total_in_corpus: number
    total_matching: number
    reaction_summary: ReactionSummary[]
    outcome_summary: Record<string, number>
    seriousness_summary: Record<string, number>
    sex_summary: Record<string, number>
  }
  natural_language_summary: string
  verification: {
    query_hash: string
    result_hash: string
  }
  disclaimer: string
  processing_time_ms: number
}

interface Props {
  drugs: Array<{ drug: string }>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'
const AGE_GROUPS = ['0-17', '18-40', '41-64', '65-84', '85+']

export function EvidenceScope({ drugs }: Props) {
  const [params, setParams] = useState<GuidedQueryParams>({ drug: '' })
  const [result, setResult] = useState<GuidedQueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  
  const runQuery = async () => {
    if (!params.drug) return
    setLoading(true)
    
    try {
      const res = await fetch(`${API_URL}/query/guided`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      const data = await res.json()
      if (data.status === 'VERIFIED') setResult(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  const updateParam = (key: keyof GuidedQueryParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value || undefined }))
  }
  
  const reset = () => {
    setResult(null)
    setParams({ drug: '' })
    setExpanded(false)
  }
  
  // Scope description
  const scope = [
    params.drug,
    params.sex,
    params.age_group && `Age ${params.age_group}`,
    params.serious === true && 'Serious',
    params.serious === false && 'Non-serious',
    params.reaction
  ].filter(Boolean).join(' · ')

  // Results view
  if (result) {
    return (
      <div className="animate-fadeIn">
        {/* Scope header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-verified-soft text-verified">
                <span className="w-1.5 h-1.5 rounded-full bg-verified"></span>
                Verified
              </span>
              <span className="text-faint text-xs font-mono">{result.corpus_version}</span>
            </div>
            <h2 className="text-xl font-semibold text-primary capitalize">{scope}</h2>
          </div>
          <button onClick={reset} className="text-sm text-muted hover:text-primary transition">
            New query
          </button>
        </div>
        
        {/* Summary */}
        <p className="text-lg text-secondary leading-relaxed mb-2">
          {result.natural_language_summary}
        </p>
        <p className="text-sm text-muted mb-8">
          {result.results.total_matching.toLocaleString()} matching reports · {result.processing_time_ms}ms
        </p>
        
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-primary rounded-lg p-4 border border-default">
            <div className="text-2xl font-semibold text-primary">{result.results.total_matching}</div>
            <div className="text-xs text-muted mt-1">Reports</div>
          </div>
          <div className="bg-primary rounded-lg p-4 border border-default">
            <div className="text-2xl font-semibold text-serious">{result.results.seriousness_summary.serious || 0}</div>
            <div className="text-xs text-muted mt-1">Serious</div>
          </div>
          <div className="bg-primary rounded-lg p-4 border border-default">
            <div className="text-2xl font-semibold text-serious">{result.results.outcome_summary['Fatal'] || 0}</div>
            <div className="text-xs text-muted mt-1">Fatal</div>
          </div>
          <div className="bg-primary rounded-lg p-4 border border-default">
            <div className="text-2xl font-semibold text-primary">
              {result.results.sex_summary.Female || 0}
              <span className="text-muted font-normal text-base"> / </span>
              {result.results.sex_summary.Male || 0}
            </div>
            <div className="text-xs text-muted mt-1">F / M</div>
          </div>
        </div>
        
        {/* Reactions */}
        <div className="bg-primary rounded-lg border border-default p-6 mb-6">
          <h3 className="text-sm font-medium text-muted mb-4">Reported Reactions</h3>
          <div className="space-y-3">
            {result.results.reaction_summary.slice(0, 10).map((r, i) => (
              <div key={r.reaction} className="flex items-center gap-4">
                <span className="w-5 text-xs text-faint text-right">{i + 1}</span>
                <span className="w-32 text-sm text-primary truncate">{r.reaction}</span>
                <div className="flex-1 h-2 bg-tertiary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(r.percent * 2.5, 100)}%` }}
                  />
                </div>
                <span className="w-12 text-sm text-muted text-right">{r.percent}%</span>
                <span className="w-10 text-sm text-faint text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Verification */}
        <div className="bg-primary rounded-lg border border-default p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-verified" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium text-primary">Verification</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-muted">
            <div className="flex gap-4">
              <span className="w-16 text-faint">Root</span>
              <span className="break-all">{result.root_hash}</span>
            </div>
            <div className="flex gap-4">
              <span className="w-16 text-faint">Query</span>
              <span className="break-all">{result.verification.query_hash}</span>
            </div>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="bg-warning-soft rounded-lg p-4 text-sm text-warning">
          ⚠️ {result.disclaimer}
        </div>
      </div>
    )
  }
  
  // Input view
  return (
    <div className="max-w-lg mx-auto">
      {/* Drug select */}
      <div className="mb-6">
        <label className="block text-sm text-muted mb-2">Substance</label>
        <select
          value={params.drug}
          onChange={(e) => updateParam('drug', e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-base capitalize"
        >
          <option value="">Select a substance</option>
          {drugs.map(d => (
            <option key={d.drug} value={d.drug}>{d.drug}</option>
          ))}
        </select>
      </div>
      
      {/* Population (appears when drug selected) */}
      {params.drug && (
        <div className="mb-6 animate-fadeIn">
          <label className="block text-sm text-muted mb-2">Population</label>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={params.sex || ''}
              onChange={(e) => updateParam('sex', e.target.value)}
              className="px-4 py-2.5 rounded-lg"
            >
              <option value="">All sexes</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select
              value={params.age_group || ''}
              onChange={(e) => updateParam('age_group', e.target.value)}
              className="px-4 py-2.5 rounded-lg"
            >
              <option value="">All ages</option>
              {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
            </select>
          </div>
        </div>
      )}
      
      {/* Refinements (toggle) */}
      {params.drug && (
        <div className="mb-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-accent hover:underline"
          >
            {expanded ? '− Less options' : '+ More options'}
          </button>
          
          {expanded && (
            <div className="mt-3 grid grid-cols-2 gap-3 animate-fadeIn">
              <select
                value={params.serious === true ? 'true' : params.serious === false ? 'false' : ''}
                onChange={(e) => updateParam('serious', e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)}
                className="px-4 py-2.5 rounded-lg"
              >
                <option value="">All seriousness</option>
                <option value="true">Serious only</option>
                <option value="false">Non-serious</option>
              </select>
              <input
                type="text"
                value={params.reaction || ''}
                onChange={(e) => updateParam('reaction', e.target.value)}
                placeholder="Reaction..."
                className="px-4 py-2.5 rounded-lg"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Query button */}
      {params.drug && (
        <button
          onClick={runQuery}
          disabled={loading}
          className="w-full py-3.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Querying...' : 'Query Evidence'}
        </button>
      )}
      
      {/* Preview */}
      {params.drug && (
        <div className="mt-4 text-center text-sm text-faint">
          {scope}
        </div>
      )}
    </div>
  )
}
