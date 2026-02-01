'use client'

import { useEffect, useState } from 'react'
import { queryReaction } from '@/lib/api'
import type { ReactionQueryResponse } from '@/lib/types'

interface Props {
  drug: string
  reaction: string
  corpusVersion: string
  onClose: () => void
}

export function ReactionDrawer({ drug, reaction, corpusVersion, onClose }: Props) {
  const [data, setData] = useState<ReactionQueryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    setLoading(true)
    setError(null)
    queryReaction(drug, reaction)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [drug, reaction])
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 w-full max-w-lg h-full bg-eve-card border-l border-eve-border z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-eve-border flex justify-between items-start">
          <div>
            <h2 className="font-semibold text-eve-text-strong">Reaction: {reaction}</h2>
            <p className="text-sm text-eve-muted mt-1">
              Drug: {drug} · Corpus: {corpusVersion}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-2xl text-eve-muted hover:text-eve-text-strong transition-colors"
          >
            ×
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-12 text-eve-muted">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-eve-notice">{error}</div>
          ) : data?.status === 'VERIFIED' ? (
            <>
              {/* Stats */}
              <div className="flex gap-3 mb-5">
                <div className="flex-1 bg-eve-bg-subtle rounded-lg p-3 text-center border border-eve-border">
                  <div className="text-xl font-bold text-eve-text-strong">{data.results.total_events_in_corpus}</div>
                  <div className="text-xs text-eve-muted">Total in Corpus</div>
                </div>
                <div className="flex-1 bg-eve-bg-subtle rounded-lg p-3 text-center border border-eve-border">
                  <div className="text-xl font-bold text-eve-accent">{data.results.filtered_count}</div>
                  <div className="text-xs text-eve-muted">With This Reaction</div>
                </div>
              </div>
              
              {/* EVE Decision ID */}
              {data.eve_decision_id && (
                <div className="mb-4 p-3 bg-eve-bg-subtle rounded-lg border border-eve-border">
                  <span className="text-xs text-eve-muted">EVE Decision ID: </span>
                  <span className="text-xs font-mono text-eve-accent">{data.eve_decision_id}</span>
                </div>
              )}
              
              {/* Table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-eve-muted uppercase">
                    <th className="text-left py-2">Report ID</th>
                    <th className="text-left py-2">Serious</th>
                    <th className="text-left py-2">Age</th>
                    <th className="text-left py-2">Sex</th>
                    <th className="text-left py-2">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.reports.map((r) => (
                    <tr key={r.report_id} className="border-t border-eve-border">
                      <td className="py-2 font-mono text-xs">{r.report_id}</td>
                      <td className={`py-2 ${r.serious === 'Yes' ? 'text-eve-notice font-medium' : 'text-eve-muted'}`}>
                        {r.serious}
                      </td>
                      <td className="py-2">{r.age}</td>
                      <td className="py-2">{r.sex}</td>
                      <td className={`py-2 ${r.outcome === 'Fatal' ? 'text-eve-notice font-medium' : r.outcome.includes('Recovered') ? 'text-eve-verified' : ''}`}>
                        {r.outcome}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {data.results.reports.length === 0 && (
                <p className="text-center py-8 text-eve-muted">No reports found for this reaction.</p>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-eve-notice">Error loading data</div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 border-t border-eve-border bg-eve-bg-subtle text-xs text-eve-muted">
          <span className="text-eve-accent">Status:</span> {data?.status || 'Loading'} · Filtered from same snapshot
          {data?.corpus?.root_hash && (
            <div className="mt-1 font-mono">
              <span className="text-eve-accent">Root Hash:</span> {data.corpus.root_hash.slice(0, 24)}...
            </div>
          )}
        </div>
      </div>
    </>
  )
}
