'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Drug {
  drug: string
  events: number
  total_in_fda: number
  therapeutic_area?: string
  atc_code?: string
  serious_percent?: number
  fatal_count?: number
}

interface Props {
  drugs: Drug[]
}

const ATC_COLORS: Record<string, string> = {
  'A': 'bg-atc-A',
  'C': 'bg-atc-C',
  'N': 'bg-atc-N',
  'M': 'bg-atc-M',
  'J': 'bg-atc-J',
  'R': 'bg-atc-R',
}

export function MasterTable({ drugs }: Props) {
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<'name' | 'events'>('name')
  
  const areas = [...new Set(drugs.map(d => d.therapeutic_area).filter(Boolean))]
  
  let filtered = drugs
  if (filter) {
    filtered = drugs.filter(d => d.therapeutic_area === filter)
  }
  
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'events') return b.events - a.events
    return a.drug.localeCompare(b.drug)
  })
  
  return (
    <div>
      {/* Filters */}
      <div className="px-6 py-3 border-b border-eve-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-eve-muted">Area:</span>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm px-2 py-1 rounded bg-eve-bg border border-eve-border text-eve-muted focus:border-eve-accent outline-none"
            >
              <option value="">All Areas</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-eve-muted">Sort:</span>
            <select 
              value={sort}
              onChange={(e) => setSort(e.target.value as 'name' | 'events')}
              className="text-sm px-2 py-1 rounded bg-eve-bg border border-eve-border text-eve-muted focus:border-eve-accent outline-none"
            >
              <option value="name">Name</option>
              <option value="events">Events</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-eve-muted uppercase tracking-wide border-b border-eve-border">
            <th className="px-6 py-3 font-medium">Substance</th>
            <th className="px-6 py-3 font-medium">Therapeutic Area</th>
            <th className="px-6 py-3 font-medium text-right">Events</th>
            <th className="px-6 py-3 font-medium text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((drug) => (
            <tr 
              key={drug.drug}
              className="border-b border-eve-border/50 hover:bg-eve-bg/50 transition cursor-pointer"
            >
              <td className="px-6 py-4">
                <Link href={`/medical/${drug.drug.toLowerCase()}`} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg ${ATC_COLORS[drug.atc_code || ''] || 'bg-eve-muted'} flex items-center justify-center text-xs font-bold text-white`}>
                    {drug.atc_code || '?'}
                  </span>
                  <span className="font-medium capitalize hover:text-eve-accent transition">
                    {drug.drug}
                  </span>
                </Link>
              </td>
              <td className="px-6 py-4 text-sm text-eve-muted">
                {drug.therapeutic_area || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-right">
                {drug.events}
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-xs text-eve-accent">VERIFIED</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
