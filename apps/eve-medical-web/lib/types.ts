/**
 * lib/types.ts
 * 
 * TypeScript types for EVE Medical Evidence
 * All types match API response shapes exactly
 */

export interface Drug {
  drug: string
  events: number
  total_in_fda: number
  source: string
  serious_percent: number | null
  fatal_count: number | null
  top_reaction: string | null
  therapeutic_area?: string
  atc_code?: string
}

export interface CorpusResponse {
  version: string
  root_hash: string
  total_events: number
  total_substances: number
  therapeutic_areas: number
  drugs: Drug[]
  proof_available: boolean
  disclaimer: string
}

export interface Seriousness {
  serious: number
  non_serious: number
  unknown: number
}

export interface Stats {
  total_reports: number
  seriousness: Seriousness
  age_distribution: Record<string, number>
  sex_distribution: Record<string, number>
  outcome_distribution: Record<string, number>
  country_distribution: Record<string, number>
  reports_by_year: Record<string, number>
}

export interface Reaction {
  reaction: string
  count: number
}

export interface QueryResponse {
  status: 'VERIFIED' | 'NO_MATCH' | 'ERROR'
  eve_decision_id?: string
  corpus_version?: string // legacy
  root_hash?: string // legacy
  corpus?: {
    version: string
    root_hash: string
  }
  response_hash?: string
  drug: string
  atc_code?: string | null
  atc_name?: string | null
  summary: {
    total_events: number
    total_in_fda: number
    source: string
    api_last_updated: string
    top_reactions: Reaction[]
  }
  citations: Array<{
    id: string
    hash: string
    source: string
  }>
  citation_count: number
  stats: Stats | null
  stats_hash: string | null
  stats_disclaimer: string | null
  generation_mode: 'VERIFIED_DETERMINISTIC'
  verification_status: 'VERIFIED'
  trinity_level: number
  disclaimer: string
  processing_time_ms: number
}

export interface Report {
  report_id: string
  serious: 'Yes' | 'No' | 'Unknown'
  age: string
  sex: 'Male' | 'Female' | 'Unknown'
  outcome: string
  receive_date: string
}

export interface ReactionQueryResponse {
  status: 'VERIFIED' | 'ERROR'
  eve_decision_id?: string
  filter_type: 'REACTION'
  drug: string
  reaction: string
  corpus: {
    version: string
    root_hash: string
  }
  results: {
    total_events_in_corpus: number
    filtered_count: number
    reports: Report[]
  }
  verification: {
    query_hash: string
    result_hash: string
    context_hash: string
    governance: string
    policy: string
    reproducible: boolean
  }
  generation_mode: 'VERIFIED_DETERMINISTIC'
  disclaimer: string
  processing_time_ms: number
}
