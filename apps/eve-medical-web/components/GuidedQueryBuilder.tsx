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
  query_type: string
  trinity_level: number
  parameters: GuidedQueryParams
  applied_filters: string[]
  corpus_version: string
  root_hash: string
  results: {
    total_in_corpus: number
    total_matching: number
    match_percent: number
    filter_description: string
    reaction_summary: ReactionSummary[]
    outcome_summary: Record<string, number>
    seriousness_summary: Record<string, number>
    sex_summary: Record<string, number>
  }
  natural_language_summary: string
  verification: {
    query_hash: string
    result_hash: string
    reproducible: boolean
  }
  disclaimer: string
  processing_time_ms: number
}

interface Props {
  drugs: Array<{ drug: string }>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'

const AGE_GROUPS = ['0-17', '18-40', '41-64', '65-84', '85+']

export function GuidedQueryBuilder({ drugs }: Props) {
  const [params, setParams] = useState<GuidedQueryParams>({ drug: '' })
  const [result, setResult] = useState<GuidedQueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const runQuery = async () => {
    if (!params.drug) {
      setError('Please select a substance')
      return
    }
    
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const res = await fetch(`${API_URL}/query/guided`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      
      const data = await res.json()
      
      if (data.status === 'VERIFIED') {
        setResult(data)
      } else {
        setError(data.error || 'Query failed')
      }
    } catch (err) {
      setError('Failed to connect to API')
    } finally {
      setLoading(false)
    }
  }
  
  const updateParam = (key: keyof GuidedQueryParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value || undefined }))
  }
  
  return (
    <div className="bg-eve-card border border-eve-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-eve-border bg-gradient-to-r from-eve-card to-[#0f1628]">
        <h2 className="font-semibold flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-eve-accent/20 to-eve-blue/20 flex items-center justify-center">
            <span className="text-eve-accent">⚡</span>
          </span>
          <span className="bg-gradient-to-r from-eve-accent to-eve-blue bg-clip-text text-transparent">
            Guided Evidence Query
          </span>
        </h2>
        <p className="text-xs text-eve-muted mt-1 ml-10">
          Structured queries against the verified corpus · Trinity Level 1
        </p>
      </div>
      
      {/* Query Builder */}
      <div className="p-6 grid-bg">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Drug selector */}
          <div>
            <label className="block text-xs text-eve-muted mb-2 uppercase tracking-wide">Substance *</label>
            <select
              value={params.drug}
              onChange={(e) => updateParam('drug', e.target.value)}
              className="w-full bg-eve-bg border border-eve-border rounded-lg px-4 py-2.5 text-sm focus:border-eve-accent focus:ring-1 focus:ring-eve-accent/30 outline-none capitalize transition"
            >
              <option value="">Select substance...</option>
              {drugs.map(d => (
                <option key={d.drug} value={d.drug} className="capitalize">{d.drug}</option>
              ))}
            </select>
          </div>
          
          {/* Sex filter */}
          <div>
            <label className="block text-xs text-eve-muted mb-2 uppercase tracking-wide">Sex</label>
            <select
              value={params.sex || ''}
              onChange={(e) => updateParam('sex', e.target.value)}
              className="w-full bg-eve-bg border border-eve-border rounded-lg px-4 py-2.5 text-sm focus:border-eve-accent focus:ring-1 focus:ring-eve-accent/30 outline-none transition"
            >
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          
          {/* Age group */}
          <div>
            <label className="block text-xs text-eve-muted mb-2 uppercase tracking-wide">Age Group</label>
            <select
              value={params.age_group || ''}
              onChange={(e) => updateParam('age_group', e.target.value)}
              className="w-full bg-eve-bg border border-eve-border rounded-lg px-4 py-2.5 text-sm focus:border-eve-accent focus:ring-1 focus:ring-eve-accent/30 outline-none transition"
            >
              <option value="">All ages</option>
              {AGE_GROUPS.map(ag => (
                <option key={ag} value={ag}>{ag}</option>
              ))}
            </select>
          </div>
          
          {/* Seriousness */}
          <div>
            <label className="block text-xs text-eve-muted mb-2 uppercase tracking-wide">Seriousness</label>
            <select
              value={params.serious === true ? 'true' : params.serious === false ? 'false' : ''}
              onChange={(e) => updateParam('serious', e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)}
              className="w-full bg-eve-bg border border-eve-border rounded-lg px-4 py-2.5 text-sm focus:border-eve-accent focus:ring-1 focus:ring-eve-accent/30 outline-none transition"
            >
              <option value="">All</option>
              <option value="true">Serious only</option>
              <option value="false">Non-serious only</option>
            </select>
          </div>
          
          {/* Reaction filter */}
          <div className="md:col-span-2">
            <label className="block text-xs text-eve-muted mb-2 uppercase tracking-wide">Reaction (optional)</label>
            <input
              type="text"
              value={params.reaction || ''}
              onChange={(e) => updateParam('reaction', e.target.value)}
              placeholder="e.g., Fatigue, Nausea, Headache..."
              className="w-full bg-eve-bg border border-eve-border rounded-lg px-4 py-2.5 text-sm focus:border-eve-accent focus:ring-1 focus:ring-eve-accent/30 outline-none transition placeholder:text-eve-muted/50"
            />
          </div>
        </div>
        
        {/* Run button */}
        <button
          onClick={runQuery}
          disabled={loading || !params.drug}
          className="w-full py-3.5 bg-gradient-to-r from-eve-accent to-eve-blue text-[#0a0f1a] font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 glow-accent"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Running query...
            </span>
          ) : 'Run Verified Query'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-eve-red/10 border border-eve-red/30 rounded-lg text-sm text-eve-red">
            {error}
          </div>
        )}
      </div>
      
      {/* Results */}
      {result && (
        <div className="border-t border-eve-border">
          {/* Summary header */}
          <div className="px-6 py-4 bg-gradient-to-r from-eve-accent/5 to-eve-blue/5 border-b border-eve-border">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="badge-verified px-3 py-1 text-xs rounded-full font-medium">
                  ✓ VERIFIED
                </span>
                <span className="badge-trinity px-3 py-1 text-xs rounded-full font-medium">
                  ◈ Trinity Level {result.trinity_level}
                </span>
              </div>
              <span className="text-xs text-eve-muted font-mono">
                {result.processing_time_ms}ms · {result.results.total_matching} of {result.results.total_in_corpus} reports
              </span>
            </div>
          </div>
          
          {/* Natural language summary */}
          <div className="px-6 py-5 border-b border-eve-border">
            <p className="text-sm leading-relaxed">
              {result.natural_language_summary}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {result.applied_filters.map((filter, i) => (
                <span key={i} className="px-2.5 py-1 text-xs bg-eve-bg border border-eve-border rounded-full text-eve-muted">
                  {filter}
                </span>
              ))}
            </div>
          </div>
          
          {/* Reaction summary */}
          <div className="px-6 py-5 border-b border-eve-border">
            <h3 className="text-xs font-medium text-eve-muted uppercase tracking-wide mb-4">Top Reported Reactions</h3>
            <div className="space-y-2.5">
              {result.results.reaction_summary.slice(0, 10).map((r, i) => (
                <div key={r.reaction} className="flex items-center gap-3">
                  <div className="w-4 text-xs text-eve-muted/50 text-right">{i + 1}</div>
                  <div className="w-28 text-xs truncate">{r.reaction}</div>
                  <div className="flex-1 h-5 bg-eve-bg rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-eve-accent to-eve-blue rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(r.percent * 2, 100)}%` }}
                    />
                  </div>
                  <div className="w-20 text-xs text-right">
                    <span className="text-eve-accent font-medium">{r.count}</span>
                    <span className="text-eve-muted ml-1">({r.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Stats grid */}
          <div className="px-6 py-5 border-b border-eve-border grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-xs text-eve-muted uppercase tracking-wide mb-3">Seriousness</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Serious</span>
                  <span className="text-eve-red font-medium">{result.results.seriousness_summary.serious || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Non-serious</span>
                  <span className="text-eve-green font-medium">{result.results.seriousness_summary.non_serious || 0}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs text-eve-muted uppercase tracking-wide mb-3">Sex Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Male</span>
                  <span className="font-medium">{result.results.sex_summary.Male || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Female</span>
                  <span className="font-medium">{result.results.sex_summary.Female || 0}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs text-eve-muted uppercase tracking-wide mb-3">Outcomes</h4>
              <div className="space-y-2">
                {Object.entries(result.results.outcome_summary)
                  .filter(([, v]) => v > 0)
                  .slice(0, 3)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center">
                      <span className="text-sm truncate">{k}</span>
                      <span className={`font-medium ${k === 'Fatal' ? 'text-eve-red' : ''}`}>{v}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          {/* Verification - New Design */}
          <div className="px-6 py-5 verification-panel">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-eve-verify/10 flex items-center justify-center">
                <span className="text-eve-verify">🔐</span>
              </div>
              <h4 className="text-sm font-medium text-eve-verify">Verification</h4>
            </div>
            <div className="space-y-3 pl-10">
              <div className="flex items-start gap-3">
                <span className="text-xs text-eve-muted w-20 shrink-0">Corpus</span>
                <span className="hash-text">{result.corpus_version}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs text-eve-muted w-20 shrink-0">Root Hash</span>
                <span className="hash-text break-all">{result.root_hash}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs text-eve-muted w-20 shrink-0">Query Hash</span>
                <span className="hash-text break-all">{result.verification.query_hash}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs text-eve-muted w-20 shrink-0">Result Hash</span>
                <span className="hash-text break-all">{result.verification.result_hash}</span>
              </div>
            </div>
            <div className="mt-4 pl-10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-eve-green animate-pulse"></span>
              <span className="text-xs text-eve-green">Reproducible · Same input = Same output</span>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="px-6 py-4 bg-eve-yellow/5 border-t border-eve-yellow/20">
            <p className="text-xs text-eve-yellow/90 flex items-start gap-2">
              <span>⚠️</span>
              <span>{result.disclaimer}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
