'use client'

import { useState } from 'react'

interface NaturalQueryResult {
  status: string
  trinity: {
    parse: { model: string; status: string; time_ms?: number; result?: any }
    query: { model: string; status: string; time_ms?: number; corpus_version?: string; root_hash?: string }
    render: { model: string; status: string; time_ms?: number }
  }
  corpus?: {
    version: string
    root_hash: string
  }
  query?: {
    original: string
    parsed: any
    applied_filters: string[]
  }
  answer?: {
    language: string
    text: string
  }
  evidence?: {
    total_matching: number
    total_in_corpus: number
    top_reactions: Array<{ reaction: string; count: number; percent: number }>
  }
  verification?: {
    query_hash: string
    result_hash: string
  }
  disclaimer?: string
  processing_time_ms: number
  error?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050'

const EXAMPLE_QUESTIONS = [
  'Vilka biverkningar är vanligast för metformin hos kvinnor över 65?',
  'Finns det rapporterade dödsfall för warfarin?',
  'Visa allvarliga reaktioner för sertraline hos män',
  'Hur många rapporter finns för aspirin?',
]

export function NaturalQuery() {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<NaturalQueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  
  const askQuestion = async (q?: string) => {
    const queryText = q || question
    if (!queryText.trim()) return
    
    setLoading(true)
    setResult(null)
    
    try {
      const res = await fetch(`${API_URL}/query/natural`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText, language: 'sv' })
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({
        status: 'ERROR',
        error: 'Kunde inte ansluta till API',
        trinity: {
          parse: { model: 'CLAUDE_L2', status: 'error' },
          query: { model: 'EVE_L1', status: 'pending' },
          render: { model: 'CLAUDE_L2', status: 'pending' }
        },
        processing_time_ms: 0
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="bg-eve-card border border-eve-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-eve-border">
        <h2 className="font-semibold flex items-center gap-2">
          <span className="text-eve-accent">💬</span>
          Fråga EVE
        </h2>
        <p className="text-xs text-eve-muted mt-1">
          Ställ frågor på naturligt språk. AI tolkar, EVE svarar med verifierade fakta.
        </p>
      </div>
      
      {/* Input */}
      <div className="p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
            placeholder="T.ex. Vilka biverkningar är vanligast för metformin hos kvinnor över 65?"
            className="flex-1 px-4 py-3 bg-eve-bg border border-eve-border rounded-xl text-sm focus:border-eve-accent outline-none"
            disabled={loading}
          />
          <button
            onClick={() => askQuestion()}
            disabled={loading || !question.trim()}
            className="px-6 py-3 bg-gradient-to-r from-eve-accent to-eve-blue text-black font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? '...' : 'Fråga'}
          </button>
        </div>
        
        {/* Example questions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-eve-muted">Exempel:</span>
          {EXAMPLE_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => { setQuestion(q); askQuestion(q); }}
              className="text-xs px-2 py-1 rounded bg-eve-bg border border-eve-border text-eve-muted hover:border-eve-accent hover:text-eve-accent transition"
              disabled={loading}
            >
              {q.length > 40 ? q.slice(0, 40) + '...' : q}
            </button>
          ))}
        </div>
      </div>
      
      {/* Result */}
      {result && (
        <div className="border-t border-eve-border">
          {/* Trinity Pipeline Status */}
          <div className="px-6 py-3 bg-eve-bg/50 border-b border-eve-border">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-eve-muted">Trinity Pipeline:</span>
              <span className={`flex items-center gap-1 ${result.trinity.parse.status === 'complete' ? 'text-eve-accent' : 'text-eve-muted'}`}>
                <span className={`w-2 h-2 rounded-full ${result.trinity.parse.status === 'complete' ? 'bg-eve-accent' : 'bg-eve-muted'}`}></span>
                Parse {result.trinity.parse.time_ms ? `(${result.trinity.parse.time_ms}ms)` : ''}
              </span>
              <span className="text-eve-muted">→</span>
              <span className={`flex items-center gap-1 ${result.trinity.query.status === 'complete' ? 'text-eve-accent' : 'text-eve-muted'}`}>
                <span className={`w-2 h-2 rounded-full ${result.trinity.query.status === 'complete' ? 'bg-eve-accent' : 'bg-eve-muted'}`}></span>
                EVE Query {result.trinity.query.time_ms ? `(${result.trinity.query.time_ms}ms)` : ''}
              </span>
              <span className="text-eve-muted">→</span>
              <span className={`flex items-center gap-1 ${result.trinity.render.status === 'complete' ? 'text-eve-accent' : 'text-eve-muted'}`}>
                <span className={`w-2 h-2 rounded-full ${result.trinity.render.status === 'complete' ? 'bg-eve-accent' : 'bg-eve-muted'}`}></span>
                Render {result.trinity.render.time_ms ? `(${result.trinity.render.time_ms}ms)` : ''}
              </span>
              <span className="ml-auto text-eve-muted">{result.processing_time_ms}ms totalt</span>
            </div>
          </div>
          
          {result.status === 'VERIFIED' && result.answer ? (
            <>
              {/* Answer */}
              <div className="px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-eve-accent/20 to-eve-blue/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-eve-accent">✓</span>
                  </div>
                  <div>
                    <p className="text-sm leading-relaxed">{result.answer.text}</p>
                  </div>
                </div>
              </div>
              
              {/* Evidence */}
              {result.evidence && (
                <div className="px-6 py-4 border-t border-eve-border">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-eve-muted">Topp reaktioner</span>
                    <span className="text-xs text-eve-muted/50">({result.evidence.total_matching} av {result.evidence.total_in_corpus} rapporter)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.evidence.top_reactions.map(r => (
                      <span key={r.reaction} className="px-2 py-1 text-xs bg-eve-bg border border-eve-border rounded">
                        {r.reaction} <span className="text-eve-accent">{r.percent}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Parsed Query */}
              {result.query?.parsed && (
                <div className="px-6 py-3 border-t border-eve-border bg-eve-bg/30">
                  <div className="text-xs text-eve-muted">
                    <span className="text-eve-verify">Tolkade parametrar:</span>{' '}
                    {Object.entries(result.query.parsed)
                      .filter(([_, v]) => v !== null)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(', ')}
                  </div>
                </div>
              )}
              
              {/* Verification */}
              <div className="px-6 py-4 verification-panel">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-eve-verify">🔐</span>
                  <span className="text-sm font-medium text-eve-verify">Verifiering</span>
                </div>
                <div className="space-y-1 hash-text">
                  <div>Corpus: {result.corpus?.version}</div>
                  <div>Root: {result.corpus?.root_hash?.slice(0, 32)}...</div>
                  <div>Query: {result.verification?.query_hash?.slice(0, 32)}...</div>
                </div>
              </div>
              
              {/* Disclaimer */}
              <div className="px-6 py-3 bg-eve-yellow/5 border-t border-eve-yellow/20">
                <p className="text-xs text-eve-yellow/80">⚠️ {result.disclaimer}</p>
              </div>
            </>
          ) : (
            /* Error state */
            <div className="px-6 py-5">
              <p className="text-sm text-eve-red">{result.error || 'Ett fel uppstod'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
