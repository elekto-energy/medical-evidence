'use client'

import { useState } from 'react'
import type { QueryResponse } from '@/lib/types'
import { BarChart } from './charts/BarChart'
import { ReactionDrawer } from './ReactionDrawer'
import { ExportPdfButton } from './ExportPdfButton'

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
}

// Map drug to ATC code
const DRUG_ATC: Record<string, string> = {
  'metformin': 'A', 'insulin': 'A', 'glimepiride': 'A', 'sitagliptin': 'A', 'empagliflozin': 'A', 'liraglutide': 'A',
  'atorvastatin': 'C', 'simvastatin': 'C', 'warfarin': 'C', 'apixaban': 'C', 'metoprolol': 'C', 'amlodipine': 'C', 'lisinopril': 'C',
  'sertraline': 'N', 'fluoxetine': 'N', 'escitalopram': 'N', 'venlafaxine': 'N', 'quetiapine': 'N', 'risperidone': 'N', 'diazepam': 'N',
  'ibuprofen': 'M', 'aspirin': 'M', 'paracetamol': 'M', 'naproxen': 'M', 'diclofenac': 'M', 'tramadol': 'M',
  'amoxicillin': 'J', 'ciprofloxacin': 'J', 'doxycycline': 'J', 'azithromycin': 'J', 'vancomycin': 'J',
  'salbutamol': 'R', 'budesonide': 'R', 'fluticasone': 'R', 'montelukast': 'R', 'cetirizine': 'R',
}

export function DrugDetail({ data }: Props) {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null)
  
  const atcCode = DRUG_ATC[data.drug.toLowerCase()] || '?'
  const stats = data.stats
  
  const seriousPercent = stats 
    ? Math.round((stats.seriousness.serious / (stats.seriousness.serious + stats.seriousness.non_serious)) * 100)
    : 0
  
  const fatalCount = stats?.outcome_distribution['Fatal'] || 0
  
  return (
    <>
      <div className="bg-eve-card border border-eve-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-eve-border flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${ATC_COLORS[atcCode]}`}>
              {atcCode}
            </span>
            <h1 className="text-2xl font-bold capitalize">{data.drug}</h1>
          </div>
          <div className="flex items-center gap-4">
            <ExportPdfButton data={data} />
            <div className="text-right text-sm text-eve-muted">
              <div>{data.processing_time_ms}ms</div>
              <div>Trinity Level {data.trinity_level}</div>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-eve-bg rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-eve-accent">{data.summary.total_events}</div>
              <div className="text-xs text-eve-muted mt-1">Events in Corpus</div>
            </div>
            <div className="bg-eve-bg rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-eve-accent">{data.summary.total_in_fda.toLocaleString()}</div>
              <div className="text-xs text-eve-muted mt-1">Total in FDA</div>
            </div>
            <div className="bg-eve-bg rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-eve-accent">{seriousPercent}%</div>
              <div className="text-xs text-eve-muted mt-1">Serious Reports</div>
            </div>
            <div className="bg-eve-bg rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-eve-red">{fatalCount}</div>
              <div className="text-xs text-eve-muted mt-1">Fatal Outcomes</div>
            </div>
          </div>
          
          {/* Charts */}
          {stats && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-eve-bg rounded-xl p-4">
                <h3 className="text-sm font-medium text-eve-muted mb-3">⚠️ Seriousness</h3>
                <BarChart 
                  data={{ 'Serious': stats.seriousness.serious, 'Non-Serious': stats.seriousness.non_serious }}
                  colorMap={{ 'Serious': 'bg-eve-red', 'Non-Serious': 'bg-eve-accent' }}
                />
              </div>
              <div className="bg-eve-bg rounded-xl p-4">
                <h3 className="text-sm font-medium text-eve-muted mb-3">👥 Sex Distribution</h3>
                <BarChart 
                  data={stats.sex_distribution}
                  colorMap={{ 'Male': 'bg-eve-blue', 'Female': 'bg-pink-400', 'Unknown': 'bg-eve-muted' }}
                />
              </div>
              <div className="bg-eve-bg rounded-xl p-4">
                <h3 className="text-sm font-medium text-eve-muted mb-3">📊 Age Distribution</h3>
                <BarChart data={stats.age_distribution} />
              </div>
              <div className="bg-eve-bg rounded-xl p-4">
                <h3 className="text-sm font-medium text-eve-muted mb-3">🏥 Outcomes</h3>
                <BarChart 
                  data={stats.outcome_distribution}
                  colorMap={{ 'Fatal': 'bg-eve-red', 'Recovered/Resolved': 'bg-eve-accent' }}
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
                  className="px-3 py-1.5 text-sm bg-eve-bg border border-eve-border rounded-lg hover:border-eve-accent transition"
                >
                  {r.reaction} <span className="text-eve-accent font-medium ml-1">{r.count}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Verification */}
          <div className="bg-eve-bg rounded-xl p-4 mb-4">
            <h3 className="text-sm font-medium text-eve-muted mb-2">🔐 Verification Data</h3>
            <div className="font-mono text-xs text-eve-muted/70 space-y-1">
              <div><span className="text-eve-accent">Corpus Version:</span> {data.corpus_version}</div>
              <div><span className="text-eve-accent">Root Hash:</span> {data.root_hash}</div>
              <div><span className="text-eve-accent">Stats Hash:</span> {data.stats_hash || 'N/A'}</div>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="bg-eve-yellow/10 border border-eve-yellow/20 rounded-xl p-4 text-sm text-eve-yellow">
            ⚠️ {data.disclaimer}
          </div>
        </div>
      </div>
      
      {/* Reaction Drawer */}
      {selectedReaction && (
        <ReactionDrawer
          drug={data.drug}
          reaction={selectedReaction}
          corpusVersion={data.corpus_version}
          onClose={() => setSelectedReaction(null)}
        />
      )}
    </>
  )
}
