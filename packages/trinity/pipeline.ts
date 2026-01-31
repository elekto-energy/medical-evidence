/**
 * packages/trinity/pipeline.ts
 * 
 * Trinity Hierarchical Processing Pipeline
 * Patent Krav 1e, 5, 16
 * 
 * Three levels of processing:
 * 1. Deterministic Factory (~0.1ms) - VERIFIED
 * 2. Local LLM (Qwen 7B→32B) - UNVERIFIED
 * 3. External LLM (Claude) - UNVERIFIED
 */

import { GenerationMode, VerificationStatus } from '../shared/types';

// ============================================
// Types
// ============================================

export interface TrinityInput {
  query: string;
  searchTerms: string[];      // From dual-LLM instance 1
  corpusFragments: string[];  // Retrieved from core
  corpusVersion: string;
}

export interface TrinityOutput {
  answer: string;
  level: 1 | 2 | 3;
  generationMode: GenerationMode;
  verificationStatus: VerificationStatus;
  processingTimeMs: number;
  templateId?: string;        // If Level 1
  modelUsed?: string;         // If Level 2 or 3
}

export interface TrinityConfig {
  level2Timeout: number;      // ms before escalating to Level 3
  level2QualityThreshold: number;
  enableLevel3: boolean;      // Can be disabled for offline mode
}

const DEFAULT_CONFIG: TrinityConfig = {
  level2Timeout: 5000,
  level2QualityThreshold: 0.7,
  enableLevel3: true,
};

// ============================================
// Level 1: Deterministic Factory
// ============================================

interface Template {
  id: string;
  pattern: RegExp;
  generator: (matches: RegExpMatchArray, fragments: string[]) => string;
}

const TEMPLATES: Template[] = [
  {
    id: 'adverse_event_count',
    pattern: /hur många biverkningar|how many adverse events/i,
    generator: (_, fragments) => {
      const count = fragments.length;
      return `Baserat på FDA FAERS-databasen finns ${count} rapporterade biverkningar för detta läkemedel.`;
    },
  },
  {
    id: 'adverse_event_list',
    pattern: /vilka biverkningar|what adverse events|lista biverkningar/i,
    generator: (_, fragments) => {
      // Parse and list unique reactions
      const reactions = new Set<string>();
      fragments.forEach(f => {
        try {
          const data = JSON.parse(f);
          data.patient?.reaction?.forEach((r: any) => {
            if (r.reactionmeddrapt) reactions.add(r.reactionmeddrapt);
          });
        } catch {}
      });
      
      const list = Array.from(reactions).slice(0, 10);
      return `Rapporterade biverkningar inkluderar: ${list.join(', ')}.`;
    },
  },
];

function tryDeterministicFactory(input: TrinityInput): TrinityOutput | null {
  const start = performance.now();
  
  for (const template of TEMPLATES) {
    const match = input.query.match(template.pattern);
    if (match) {
      const answer = template.generator(match, input.corpusFragments);
      
      return {
        answer,
        level: 1,
        generationMode: 'VERIFIED_DETERMINISTIC',
        verificationStatus: 'VERIFIED',
        processingTimeMs: performance.now() - start,
        templateId: template.id,
      };
    }
  }
  
  return null;
}

// ============================================
// Level 2: Local LLM
// ============================================

async function tryLocalLLM(
  input: TrinityInput,
  config: TrinityConfig
): Promise<TrinityOutput | null> {
  const start = performance.now();
  
  // TODO: Integrate with local Qwen
  // For now, return null to escalate
  
  console.log('[trinity] Level 2: Local LLM not yet implemented');
  return null;
}

// ============================================
// Level 3: External LLM
// ============================================

async function tryExternalLLM(
  input: TrinityInput
): Promise<TrinityOutput> {
  const start = performance.now();
  
  // TODO: Integrate with Claude API
  // For now, return placeholder
  
  return {
    answer: `[Level 3 placeholder] Analys av ${input.corpusFragments.length} källor för: ${input.query}`,
    level: 3,
    generationMode: 'EXTERNAL_LLM_UNVERIFIED',
    verificationStatus: 'UNVERIFIED',
    processingTimeMs: performance.now() - start,
    modelUsed: 'claude-sonnet-4-20250514',
  };
}

// ============================================
// Main Pipeline
// ============================================

export async function processTrinity(
  input: TrinityInput,
  config: TrinityConfig = DEFAULT_CONFIG
): Promise<TrinityOutput> {
  
  // Level 1: Try deterministic factory first
  console.log('[trinity] Trying Level 1: Deterministic Factory');
  const level1Result = tryDeterministicFactory(input);
  if (level1Result) {
    console.log(`[trinity] ✅ Level 1 success (${level1Result.processingTimeMs.toFixed(2)}ms)`);
    return level1Result;
  }
  
  // Level 2: Try local LLM
  console.log('[trinity] Escalating to Level 2: Local LLM');
  const level2Result = await tryLocalLLM(input, config);
  if (level2Result) {
    console.log(`[trinity] ✅ Level 2 success (${level2Result.processingTimeMs.toFixed(2)}ms)`);
    return level2Result;
  }
  
  // Level 3: External LLM (if enabled)
  if (!config.enableLevel3) {
    throw new Error('Level 3 disabled (offline mode) and no local solution found');
  }
  
  console.log('[trinity] Escalating to Level 3: External LLM');
  const level3Result = await tryExternalLLM(input);
  console.log(`[trinity] ✅ Level 3 success (${level3Result.processingTimeMs.toFixed(2)}ms)`);
  
  return level3Result;
}

// ============================================
// Offline Mode (Patent Krav 16)
// ============================================

export function createOfflineConfig(): TrinityConfig {
  return {
    ...DEFAULT_CONFIG,
    enableLevel3: false,
  };
}
