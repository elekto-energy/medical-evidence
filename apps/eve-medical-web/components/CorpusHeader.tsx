import type { CorpusResponse } from '@/lib/types'

interface Props {
  corpus: CorpusResponse
}

export function CorpusHeader({ corpus }: Props) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="bg-eve-card border border-eve-border rounded-xl px-5 py-3 text-center">
        <div className="text-2xl font-bold text-eve-accent">{corpus.total_substances}</div>
        <div className="text-xs text-eve-muted">Substances</div>
      </div>
      <div className="bg-eve-card border border-eve-border rounded-xl px-5 py-3 text-center">
        <div className="text-2xl font-bold text-eve-accent">{corpus.total_events.toLocaleString()}</div>
        <div className="text-xs text-eve-muted">Events</div>
      </div>
      <div className="bg-eve-card border border-eve-border rounded-xl px-5 py-3 text-center">
        <div className="text-2xl font-bold text-eve-accent">{corpus.therapeutic_areas}</div>
        <div className="text-xs text-eve-muted">Therapeutic Areas</div>
      </div>
      <div className="bg-eve-card border border-eve-border rounded-xl px-5 py-3 text-center flex-1 min-w-[200px]">
        <div className="text-sm font-mono text-eve-muted truncate">{corpus.root_hash?.slice(0, 24)}...</div>
        <div className="text-xs text-eve-muted">Root Hash</div>
      </div>
    </div>
  )
}
