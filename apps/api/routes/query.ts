/**
 * apps/api/routes/query.ts
 * 
 * Main query endpoint
 * Patent Krav 5, 19
 */

import { 
  QueryRequest, 
  MedicalEvidenceResponse,
  DISCLAIMER_SV,
  DISCLAIMER_EN 
} from '../../../packages/shared/types';
import { validateWitnessOutput } from '../../../packages/witness/blocklist';
import { processTrinity } from '../../../packages/trinity/pipeline';
import { createHash } from 'crypto';

/**
 * POST /query
 * 
 * Main entry point for medical evidence queries
 */
export async function handleQuery(
  request: QueryRequest
): Promise<MedicalEvidenceResponse> {
  const startTime = performance.now();
  const language = request.language || 'sv';
  
  // Step 1: Extract search terms (Dual-LLM Instance 1)
  const searchTerms = extractBasicTerms(request.query);
  
  // Step 2: Retrieve from corpus
  const corpusFragments = await retrieveFromCorpus(searchTerms);
  const corpusVersion = 'v20250131-01';
  
  // Step 3: Process through Trinity pipeline
  const trinityResult = await processTrinity({
    query: request.query,
    searchTerms,
    corpusFragments,
    corpusVersion,
  });
  
  // Step 4: Validate witness constraints (Krav 20)
  validateWitnessOutput(trinityResult.answer);
  
  // Step 5: Generate proof hash
  const responseData = {
    answer: trinityResult.answer,
    searchTerms,
    corpusVersion,
    timestamp: new Date().toISOString(),
  };
  const proofHash = createHash('sha256')
    .update(JSON.stringify(responseData))
    .digest('hex');
  
  // Step 6: Build response (Krav 19)
  const response: MedicalEvidenceResponse = {
    answer: trinityResult.answer,
    citations: [],
    metadata: {
      generation_mode: trinityResult.generationMode,
      verification_status: trinityResult.verificationStatus,
      corpus_version: corpusVersion,
      proof_hash: `sha256:${proofHash}`,
      search_terms_extracted: searchTerms,
      timestamp: new Date().toISOString(),
      trinity_level: trinityResult.level,
      processing_time_ms: performance.now() - startTime,
    },
    disclaimer: language === 'sv' ? DISCLAIMER_SV : DISCLAIMER_EN,
  };
  
  return response;
}

function extractBasicTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 10);
}

async function retrieveFromCorpus(terms: string[]): Promise<string[]> {
  return [
    '{"safetyreportid": "demo-1", "patient": {"drug": [{"medicinalproduct": "METFORMIN"}]}}',
  ];
}
