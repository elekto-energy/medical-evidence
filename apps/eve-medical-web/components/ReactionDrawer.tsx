'use client'

import { useEffect, useState } from 'react'
import { queryReaction } from '@/lib/api'
import type { ReactionQueryResponse, Report } from '@/lib/types'

interface Props {
  drug: string
  reaction: string
  corpusVersion: string
  onClose: () => void
}

export function ReactionDrawer({ drug, reaction, corpusVersion, onClose }: Props) {
  const [data, setData] = useState<ReactionQueryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    setLoading(true)
    queryReaction(drug, reaction)
      .then(setData)
      .finally(() => setLoading(false))
  }, [drug, reaction])
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 w-full max-w-lg h-full bg-eve-card border-l border-eve-border z-50 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-eve-border flex justify-between items-start">
          <div>
            <h2 className="font-semibold">Reaction: {reaction}</h2>
            <p className="text-sm text-eve-muted mt-1">
              Drug: {drug} · Corpus: {corpusVersion}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-2xl text-eve-muted hover:text-white"
          >
            ×
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-12 text-eve-muted">Loading...</div>
          ) : data?.status === 'VERIFIED' ? (
            <>
              {/* Stats */}
              <div className="flex gap-3 mb-5">
                <div className="flex-1 bg-eve-bg rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-eve-accent">{data.total_events_in_corpus}</div>
                  <div className="text-xs text-eve-muted">Total in Corpus</div>
                </div>
                <div className="flex-1 bg-eve-bg rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-eve-accent">{data.filtered_count}</div>
                  <div className="text-xs text-eve-muted">With This Reaction</div>
                </div>
              </div>
              
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
                  {data.reports.map((r) => (
                    <tr key={r.report_id} className="border-t border-eve-border/50">
                      <td className="py-2 font-mono text-xs">{r.report_id}</td>
                      <td className={`py-2 ${r.serious === 'Yes' ? 'text-eve-red' : 'text-eve-accent'}`}>
                        {r.serious}
                      </td>
                      <td className="py-2">{r.age}</td>
                      <td className="py-2">{r.sex}</td>
                      <td className={`py-2 ${r.outcome === 'Fatal' ? 'text-eve-red font-medium' : r.outcome.includes('Recovered') ? 'text-eve-accent' : ''}`}>
                        {r.outcome}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="text-center py-12 text-eve-red">Error loading data</div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 border-t border-eve-border bg-eve-bg text-xs text-eve-muted">
          <span className="text-eve-accent">Status:</span> VERIFIED · Filtered from same snapshot · No new calculations
          {data?.root_hash && (
            <div className="mt-1">
              <span className="text-eve-accent">Root Hash:</span> {data.root_hash.slice(0, 24)}...
            </div>
          )}
        </div>
      </div>
    </>
  )
}
