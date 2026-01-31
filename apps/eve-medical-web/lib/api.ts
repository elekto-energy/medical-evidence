/**
 * lib/api.ts
 * 
 * EVE Medical API client
 * Read-only access to verified corpus
 * 
 * IMPORTANT: All fetch calls use { cache: 'no-store' }
 * This ensures we always get fresh data from the API
 * and never serve stale/cached responses.
 */

import type { CorpusResponse, QueryResponse, ReactionQueryResponse } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'

/**
 * Fetch corpus overview
 * Returns all substances with basic stats
 */
export async function getCorpus(): Promise<CorpusResponse> {
  const res = await fetch(`${API_URL}/corpus`, {
    cache: 'no-store', // EVE: Always fresh, no caching
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch corpus')
  }
  
  return res.json()
}

/**
 * Query a specific drug
 * Returns detailed stats and reactions
 */
export async function queryDrug(drug: string): Promise<QueryResponse> {
  const res = await fetch(`${API_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: drug }),
    cache: 'no-store', // EVE: Always fresh, no caching
  })
  
  if (!res.ok) {
    throw new Error('Failed to query drug')
  }
  
  return res.json()
}

/**
 * Filter reports by reaction
 * Same corpus, just filtered view
 */
export async function queryReaction(
  drug: string, 
  reaction: string
): Promise<ReactionQueryResponse> {
  const res = await fetch(`${API_URL}/query/reaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drug, reaction }),
    cache: 'no-store', // EVE: Always fresh, no caching
  })
  
  if (!res.ok) {
    throw new Error('Failed to query reaction')
  }
  
  return res.json()
}

/**
 * Health check
 */
export async function checkHealth(): Promise<{ status: string; corpus_version: string }> {
  const res = await fetch(`${API_URL}/health`, {
    cache: 'no-store',
  })
  
  if (!res.ok) {
    throw new Error('API not available')
  }
  
  return res.json()
}
