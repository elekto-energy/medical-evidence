/**
 * packages/dual-llm/isolator.ts
 * 
 * Dual-LLM Isolation Layer
 * Patent Krav 17, 18
 * 
 * Two isolated LLM instances:
 * - Instance 1: Extracts search terms (CANNOT generate answers)
 * - Instance 2: Synthesizes response (CANNOT see original query)
 */

// ============================================
// Types
// ============================================

export interface ExtractionResult {
  searchTerms: string[];
  regulatoryConcepts: string[];
  extractionTimestamp: string;
}

export interface SynthesisInput {
  fragments: string[];  // Only approved corpus fragments
  language: 'sv' | 'en';
  // NOTE: Original query is NOT passed here (Krav 17.iii)
}

export interface SynthesisResult {
  answer: string;
  usedFragments: string[];
  synthesisTimestamp: string;
}

// ============================================
// Instance 1: Search Term Extractor
// ============================================

const EXTRACTOR_SYSTEM_PROMPT = `
Du är en sökterm-extraktor för medicinsk evidenssökning.

DINA UPPGIFTER:
1. Extrahera medicinska termer från användarens fråga
2. Identifiera regulatoriska koncept (FDA, EMA, etc.)
3. Returnera ENDAST söktermer

DU FÅR INTE:
- Generera svar på frågan
- Ge medicinska råd
- Tolka eller sammanfatta

OUTPUT-FORMAT:
Returnera JSON: { "searchTerms": [...], "regulatoryConcepts": [...] }
`;

export async function extractSearchTerms(
  query: string,
  llmProvider: LLMProvider
): Promise<ExtractionResult> {
  const response = await llmProvider.complete({
    systemPrompt: EXTRACTOR_SYSTEM_PROMPT,
    userMessage: query,
    maxTokens: 200,
    temperature: 0, // Deterministic
  });
  
  try {
    const parsed = JSON.parse(response);
    return {
      searchTerms: parsed.searchTerms || [],
      regulatoryConcepts: parsed.regulatoryConcepts || [],
      extractionTimestamp: new Date().toISOString(),
    };
  } catch {
    // Fallback: simple word extraction
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return {
      searchTerms: words,
      regulatoryConcepts: [],
      extractionTimestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// Instance 2: Response Synthesizer
// ============================================

const SYNTHESIZER_SYSTEM_PROMPT_SV = `
Du är en medicinsk evidenssammanfattare.

DINA UPPGIFTER:
1. Sammanfatta de givna källfragmenten
2. Citera källor korrekt
3. Var objektiv och faktabaserad

DU FÅR INTE:
- Ge rekommendationer ("du bör", "jag rekommenderar")
- Lägga till information utanför fragmenten
- Ge medicinsk rådgivning

ALLTID AVSLUTA MED:
"Källa: [fragment-ID]"
`;

const SYNTHESIZER_SYSTEM_PROMPT_EN = `
You are a medical evidence summarizer.

YOUR TASKS:
1. Summarize the given source fragments
2. Cite sources correctly
3. Be objective and fact-based

YOU MUST NOT:
- Give recommendations ("you should", "I recommend")
- Add information outside the fragments
- Give medical advice

ALWAYS END WITH:
"Source: [fragment-ID]"
`;

export async function synthesizeResponse(
  input: SynthesisInput,
  llmProvider: LLMProvider
): Promise<SynthesisResult> {
  const systemPrompt = input.language === 'sv' 
    ? SYNTHESIZER_SYSTEM_PROMPT_SV 
    : SYNTHESIZER_SYSTEM_PROMPT_EN;
  
  // Format fragments for LLM
  const fragmentText = input.fragments
    .map((f, i) => `[Fragment ${i + 1}]:\n${f}`)
    .join('\n\n');
  
  const response = await llmProvider.complete({
    systemPrompt,
    userMessage: `Sammanfatta följande evidens:\n\n${fragmentText}`,
    maxTokens: 1000,
    temperature: 0.3,
  });
  
  return {
    answer: response,
    usedFragments: input.fragments.map((_, i) => `fragment-${i + 1}`),
    synthesisTimestamp: new Date().toISOString(),
  };
}

// ============================================
// LLM Provider Interface
// ============================================

export interface LLMProvider {
  complete(params: {
    systemPrompt: string;
    userMessage: string;
    maxTokens: number;
    temperature: number;
  }): Promise<string>;
}

// ============================================
// Full Dual-LLM Pipeline
// ============================================

export async function processDualLLM(
  query: string,
  corpusFragments: string[],
  language: 'sv' | 'en',
  llmProvider: LLMProvider
): Promise<{
  extraction: ExtractionResult;
  synthesis: SynthesisResult;
}> {
  // Instance 1: Extract search terms
  const extraction = await extractSearchTerms(query, llmProvider);
  
  // Instance 2: Synthesize response (WITHOUT original query!)
  const synthesis = await synthesizeResponse(
    { 
      fragments: corpusFragments, 
      language 
    },
    llmProvider
  );
  
  return { extraction, synthesis };
}
