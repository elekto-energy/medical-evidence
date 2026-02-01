import type { QueryResponse } from '@/lib/types'

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

export function DrugCompareCard({ data }: Props) {
  // ATC code from corpus metadata (deterministic)
  const atcCode = data.atc_code || '?'
  const stats = data.stats
  
  const seriousPercent = stats 
    ? Math.round((stats.seriousness.serious / (stats.seriousness.serious + stats.seriousness.non_serious)) * 100)
    : 0
  
  const fatalCount = stats?.outcome_distribution['Fatal'] || 0

  return (
    <div className="bg-eve-card border border-eve-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${ATC_COLORS[atcCode] ?? ATC_COLORS['?']}`}>
          {atcCode}
        </span>
        <h2 className="text-xl font-semibold capitalize text-eve-text-strong">{data.drug}</h2>
      </div>
      
      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-eve-bg-subtle rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-eve-text-strong">{data.summary.total_events}</div>
          <div className="text-[10px] text-eve-muted uppercase">Events</div>
        </div>
        <div className="bg-eve-bg-subtle rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-eve-text-strong">{seriousPercent}%</div>
          <div className="text-[10px] text-eve-muted uppercase">Serious</div>
        </div>
        <div className="bg-eve-bg-subtle rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-eve-text-strong">{fatalCount}</div>
          <div className="text-[10px] text-eve-muted uppercase">Fatal</div>
        </div>
        <div className="bg-eve-bg-subtle rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-eve-text-strong">{data.summary.total_in_fda.toLocaleString()}</div>
          <div className="text-[10px] text-eve-muted uppercase">Total FDA</div>
        </div>
      </div>
      
      {/* Top reactions */}
      <div>
        <h3 className="text-xs text-eve-muted uppercase mb-2">Top Reactions</h3>
        <div className="space-y-1">
          {data.summary.top_reactions.slice(0, 5).map((r) => (
            <div key={r.reaction} className="flex justify-between text-sm">
              <span className="text-eve-text truncate">{r.reaction}</span>
              <span className="text-eve-muted ml-2">{r.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
