/**
 * Natural Language Query Endpoint
 * 
 * Trinity Pipeline:
 *   1. Claude L2 (Parser) - Tolkar fråga → strukturerade parametrar
 *   2. EVE L1 (Query) - Deterministisk query → verifierat resultat
 *   3. Claude L2 (Renderer) - Formaterar EVE-resultat → läsbart svar
 * 
 * Claude är ENDAST språklig adapter - aldrig expert.
 * All intelligens sker deterministiskt i EVE.
 * 
 * Patent: EVE-PAT-2026-001
 */

const Anthropic = require('@anthropic-ai/sdk').default;

// Initialize client with explicit API key
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Available query parameters (from corpus)
const VALID_PARAMS = {
  sex: ['Male', 'Female'],
  age_group: ['0-17', '18-40', '41-64', '65-84', '85+'],
  serious: [true, false]
};

/**
 * STEP 1: Parse natural language → structured query
 * Claude L2 - Parser role ONLY
 */
async function parseQuestion(question, knownDrugs) {
  const systemPrompt = `Du är en PARSER för medicinska frågor. Din ENDA uppgift är att extrahera strukturerade parametrar.

TILLÅTNA PARAMETRAR:
- drug: en av [${knownDrugs.join(', ')}]
- sex: "Male" eller "Female" (eller null)
- age_group: "0-17", "18-40", "41-64", "65-84", "85+" (eller null)
- serious: true (allvarliga), false (icke-allvarliga), eller null (alla)
- reaction: specifik reaktion om nämnd (eller null)

REGLER:
- Svara ENDAST med JSON
- Inga förklaringar
- Ingen medicinsk tolkning
- Om läkemedel inte matchar listan, sätt drug: null
- Om något är oklart, sätt null

EXEMPEL:
Fråga: "Vilka biverkningar är vanligast för metformin hos kvinnor över 65?"
Svar: {"drug":"metformin","sex":"Female","age_group":"65-84","serious":null,"reaction":null}

Fråga: "Allvarliga reaktioner för warfarin?"
Svar: {"drug":"warfarin","sex":null,"age_group":null,"serious":true,"reaction":null}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }]
  });

  const text = response.content[0].text.trim();
  
  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}

/**
 * STEP 3: Render EVE result → natural language
 * Claude L2 - Renderer role ONLY
 */
async function renderAnswer(eveResult, language, originalQuestion) {
  const systemPrompt = `Du är en RENDERER för medicinska data. Din ENDA uppgift är att formulera EVE:s verifierade resultat som läsbar text.

REGLER:
- Använd ENDAST data från EVE-resultatet nedan
- Lägg INTE till egen kunskap
- Ge INGA rekommendationer eller tolkningar
- Skriv på ${language === 'sv' ? 'svenska' : 'engelska'}
- Håll svaret koncist (2-4 meningar)
- Nämn antal rapporter och procent för topp-reaktioner
- Avsluta med att detta är rapporterad data, inte medicinsk rådgivning

EVE-RESULTAT:
${JSON.stringify(eveResult.results, null, 2)}

FILTER SOM ANVÄNDES:
${eveResult.applied_filters.join(', ')}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Formulera ett svar på frågan: "${originalQuestion}"` }]
  });

  return response.content[0].text.trim();
}

/**
 * Main handler for natural language queries
 */
async function processNaturalQuery(question, language, guidedQueryFn, knownDrugs) {
  const startTime = Date.now();
  const pipeline = {
    parse: { model: 'CLAUDE_L2', status: 'pending' },
    query: { model: 'EVE_L1', status: 'pending' },
    render: { model: 'CLAUDE_L2', status: 'pending' }
  };

  try {
    // STEP 1: Parse question
    const parseStart = Date.now();
    const params = await parseQuestion(question, knownDrugs);
    pipeline.parse = { 
      model: 'CLAUDE_L2', 
      status: 'complete',
      time_ms: Date.now() - parseStart,
      result: params
    };

    // Validate drug was found
    if (!params.drug) {
      return {
        status: 'NO_MATCH',
        error: 'Kunde inte identifiera något läkemedel i frågan.',
        available_drugs: knownDrugs,
        trinity: pipeline,
        processing_time_ms: Date.now() - startTime
      };
    }

    // STEP 2: EVE Guided Query (deterministic)
    const queryStart = Date.now();
    const eveResult = guidedQueryFn(params);
    pipeline.query = {
      model: 'EVE_L1',
      status: eveResult.status === 'VERIFIED' ? 'complete' : 'error',
      time_ms: Date.now() - queryStart,
      corpus_version: eveResult.corpus_version,
      root_hash: eveResult.root_hash
    };

    if (eveResult.status !== 'VERIFIED') {
      return {
        status: 'QUERY_ERROR',
        error: eveResult.error,
        trinity: pipeline,
        processing_time_ms: Date.now() - startTime
      };
    }

    // STEP 3: Render answer
    const renderStart = Date.now();
    const answerText = await renderAnswer(eveResult, language, question);
    pipeline.render = {
      model: 'CLAUDE_L2',
      status: 'complete',
      time_ms: Date.now() - renderStart
    };

    // Build final response
    return {
      status: 'VERIFIED',
      
      trinity: pipeline,
      
      corpus: {
        version: eveResult.corpus_version,
        root_hash: eveResult.root_hash
      },
      
      query: {
        original: question,
        parsed: params,
        applied_filters: eveResult.applied_filters
      },
      
      answer: {
        language: language,
        text: answerText
      },
      
      evidence: {
        total_matching: eveResult.results.total_matching,
        total_in_corpus: eveResult.results.total_in_corpus,
        top_reactions: eveResult.results.reaction_summary.slice(0, 5),
        seriousness: eveResult.results.seriousness_summary,
        outcomes: eveResult.results.outcome_summary
      },
      
      verification: {
        query_hash: eveResult.verification.query_hash,
        result_hash: eveResult.verification.result_hash,
        reproducible: true
      },
      
      disclaimer: language === 'sv' 
        ? 'Detta är deskriptiv statistik baserad på rapporterade biverkningar i FDA FAERS. Det utgör inte medicinsk rådgivning och implicerar inte kausalitet.'
        : 'This is descriptive statistics from reported adverse events in FDA FAERS. It does not constitute medical advice and does not imply causality.',
      
      processing_time_ms: Date.now() - startTime
    };

  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message,
      trinity: pipeline,
      processing_time_ms: Date.now() - startTime
    };
  }
}

module.exports = { processNaturalQuery, parseQuestion, renderAnswer };
