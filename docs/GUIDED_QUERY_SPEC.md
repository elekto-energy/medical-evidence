/**
 * API endpoint: POST /query/guided
 * 
 * Guided Evidence Query (GEQ)
 * Structured query against verified corpus
 * Trinity Level 1: Pure deterministic filtering
 * 
 * Patent Krav: AI som ökar precision, inte auktoritet
 */

// Add this to query-server.js after the /query/reaction endpoint

/*
GUIDED QUERY PARAMETERS:
{
  "drug": "metformin",           // Required
  "sex": "Female" | "Male" | null,
  "age_group": "65-84" | "18-40" | etc | null,
  "serious": true | false | null,
  "reaction": "Fatigue" | null,
  "limit": 100
}

RESPONSE:
{
  "status": "VERIFIED",
  "query_type": "GUIDED_EVIDENCE",
  "trinity_level": 1,
  "parameters": { ... },
  "corpus_version": "v20260131-01",
  "root_hash": "...",
  
  "results": {
    "total_matching": 142,
    "total_in_corpus": 500,
    "filter_description": "Women aged 65+ with metformin",
    
    "reaction_summary": [
      { "reaction": "Fatigue", "count": 17, "percent": 12.0 },
      ...
    ],
    "outcome_summary": { ... },
    "seriousness_summary": { ... }
  },
  
  "natural_language_summary": "Based on 142 FAERS reports...",
  
  "verification": {
    "query_hash": "...",
    "result_hash": "...",
    "reproducible": true
  },
  
  "disclaimer": "This is descriptive statistics from reported adverse events. It does not imply causality or risk."
}
*/
