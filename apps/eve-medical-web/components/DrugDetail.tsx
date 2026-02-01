'use client'

import { useState } from 'react'
import type { QueryResponse } from '@/lib/types'
import { BarChart } from './charts/BarChart'
import { ReactionDrawer } from './ReactionDrawer'
import { ExportPdfButton } from './ExportPdfButton'
import { MoleculeViewer } from './MoleculeViewer'

interface Props {
  data: QueryResponse
}

const ATC_COLORS: Record<string, string> = {
  'A': 'bg-atc-A/20 text-atc-A',
  'C': 'bg-atc-C/20 text-atc-C',
  'N': 'bg-atc-N/20 text-atc-N',
  'M': 'bg-atc-M/20 text-atc-M',
  'J': 'bg-atc-J/20 text-atc-J',
  'R': 'bg-atc-R/20 text-atc-R',
  '?': 'bg-gray-100 text-gray-400',
}

export function DrugDetail({ data }: Props) {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null)
  
  // ATC code from corpus metadata (deterministic)
  const atcCode = data.atc_code || '?'
  const stats = data.stats
  
  const seriousPercent = stats 
    ? Math.round((stats.seriousness.serious / (stats.seriousness.serious + stats.seriousness.non_serious)) * 100)
    : 0
  
  const fatalCount = stats?.outcome_distribution['Fatal'] || 0
  
  return (
    <>
      <div className="evidence-card">
        {/* Header */}
        <div className="evidence-header flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${ATC_COLORS[atcCode] ?? ATC_COLORS['?']}`}>
              {atcCode}
            </span>
            <h1 className="text-2xl font-semibold capitalize text-eve-text-strong">{data.drug}</h1>
          </div>
          <div className="flex items-center gap-4">
            <ExportPdfButton data={data} />
            <div className="text-right text-sm text-eve-muted">
              <div>{data.processing_time_ms}ms</div>
              <div className="badge-corpus">Level {data.trinity_level}</div>
            </div>
          </div>
        </div>
        
        {/* What this is / is not */}
        <div className="mt-6 mb-6 grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-eve-bg-subtle border border-eve-border rounded-xl">
            <h3 className="text-sm font-medium text-eve-verified mb-2 flex items-center gap-2">
              <span>✓</span> What this shows
            </h3>
            <ul className="text-xs text-eve-muted space-y-1">
              <li>• Reported adverse events from FDA FAERS</li>
              <li>• Descriptive statistics from a locked corpus</li>
              <li>• Data verified with cryptographic hashes</li>
            </ul>
          </div>
          <div className="p-4 bg-eve-bg-subtle border border-eve-border rounded-xl">
            <h3 className="text-sm font-medium text-eve-notice mb-2 flex items-center gap-2">
              <span>✗</span> What this is NOT
            </h3>
            <ul className="text-xs text-eve-muted space-y-1">
              <li>• Not medical advice or recommendations</li>
              <li>• Not proof of causality</li>
              <li>• Not a complete safety profile</li>
            </ul>
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="evidence-stat">
              <div className="evidence-stat-value">{data.summary.total_events}</div>
              <div className="evidence-stat-label">Events in Corpus</div>
              <div className="text-[10px] text-eve-muted mt-1">{data.corpus.version}</div>
            </div>
            <div className="evidence-stat">
              <div className="evidence-stat-value">{data.summary.total_in_fda.toLocaleString()}</div>
              <div className="evidence-stat-label">Total in FDA</div>
            </div>
            <div className="evidence-stat">
              <div className="evidence-stat-value">{seriousPercent}%</div>
              <div className="evidence-stat-label">Serious Reports</div>
            </div>
            <div className="evidence-stat">
              <div className="evidence-stat-value">{fatalCount}</div>
              <div className="evidence-stat-label">Fatal Outcomes</div>
            </div>
          </div>
          
          {/* Charts */}
          {stats && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="evidence-stat p-4">
                <h3 className="text-sm font-medium text-eve-muted mb-3">Seriousness</h3>
                <BarChart 
                  data={{ 'Serious': stats.seriousness.serious, 'Non-Serious': stats.seriousness.non_serious }}
                  colorMap={{ 'Serious': 'bg-eve-caution', 'Non-Serious': 'bg-eve-accent' }}
                />
              </div>
              <div className="evidence-stat p-4">
                <h3 className="text-sm font-medium text-eve-muted mb-3">Sex Distribution</h3>
                <BarChart 
                  data={stats.sex_distribution}
                  colorMap={{ 'Male': 'bg-atc-C', 'Female': 'bg-atc-R', 'Unknown': 'bg-eve-muted' }}
                />
              </div>
              <div className="evidence-stat p-4">
                <h3 className="text-sm font-medium text-eve-muted mb-3">Age Distribution</h3>
                <BarChart data={stats.age_distribution} />
              </div>
              <div className="evidence-stat p-4">
                <h3 className="text-sm font-medium text-eve-muted mb-3">Outcomes</h3>
                <BarChart 
                  data={stats.outcome_distribution}
                  colorMap={{ 'Fatal': 'bg-eve-caution', 'Recovered/Resolved': 'bg-eve-accent' }}
                />
              </div>
            </div>
          )}
          
          {/* Stats disclaimer */}
          {data.stats_disclaimer && (
            <p className="text-xs text-eve-muted text-center italic mb-6">
              {data.stats_disclaimer}
            </p>
          )}
          
          {/* Reactions */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-eve-muted mb-3">
              Top Reported Reactions <span className="font-normal">(click to view reports)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.summary.top_reactions.slice(0, 10).map((r) => (
                <button
                  key={r.reaction}
                  onClick={() => setSelectedReaction(r.reaction)}
                  className="px-3 py-1.5 text-sm bg-eve-bg border border-eve-border rounded-lg hover:border-eve-accent transition-colors"
                >
                  {r.reaction} <span className="text-eve-accent font-medium ml-1">{r.count}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Verification */}
          <div className="verification-panel p-4 mb-4">
            <h3 className="text-sm font-medium text-eve-muted mb-2">Verification Data</h3>
            <div className="hash-text space-y-1">
              <div><span className="text-eve-accent">Corpus Version:</span> {data.corpus.version}</div>
              <div><span className="text-eve-accent">Root Hash:</span> {data.corpus.root_hash}</div>
              <div><span className="text-eve-accent">Stats Hash:</span> {data.stats_hash || 'N/A'}</div>
              {data.eve_decision_id && (
                <div><span className="text-eve-accent">EVE Decision ID:</span> {data.eve_decision_id}</div>
              )}
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="disclaimer">
            <span className="disclaimer-icon">ℹ</span>
            {data.disclaimer}
          </div>
        </div>
      </div>
      
      {/* Molecular Structure - Reference Section */}
      <div className="evidence-card mt-6">
        <h3 className="text-sm font-medium text-eve-muted mb-1">
          Molecular Structure <span className="font-normal">(reference)</span>
        </h3>
        <p className="text-xs text-eve-muted mb-4">
          Structural visualization for identification only.
        </p>
        <MoleculeViewer drugName={data.drug} />
      </div>
      
      {/* Reaction Drawer */}
      {selectedReaction && (
        <ReactionDrawer
          drug={data.drug}
          reaction={selectedReaction}
          corpusVersion={data.corpus.version}
          onClose={() => setSelectedReaction(null)}
        />
      )}
    </>
  )
}
