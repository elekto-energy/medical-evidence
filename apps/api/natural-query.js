/**
 * Natural Language Query Endpoint
 * 
 * Trinity Pipeline:
 *   1. Claude L2 (Parser) - Interprets question → structured parameters
 *   2. EVE L1 (Query) - Deterministic query → verified result
 *   3. Claude L2 (Renderer) - Formats EVE result → readable answer
 * 
 * Claude is ONLY a linguistic adapter - never an expert.
 * All intelligence happens deterministically in EVE.
 * 
 * Language: User can ask in ANY language. Response is in same language.
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
 * Detect language from question
 */
function detectLanguage(text) {
  // Simple heuristics - extend as needed
  const svWords = /\b(för|och|är|med|hos|alla|vilka|finns|det|rapporter|biverkningar|dödsfall|kvinnor|män|äldre)\b/i;
  const deWords = /\b(für|und|ist|mit|bei|alle|welche|gibt|das|berichte|nebenwirkungen|todesfälle|frauen|männer)\b/i;
  const frWords = /\b(pour|et|est|avec|chez|tous|quels|existe|des|rapports|effets|décès|femmes|hommes)\b/i;
  
  if (svWords.test(text)) return 'sv';
  if (deWords.test(text)) return 'de';
  if (frWords.test(text)) return 'fr';
  return 'en'; // Default to English
}

/**
 * STEP 1: Parse natural language → structured query
 * Claude L2 - Parser role ONLY
 */
async function parseQuestion(question, knownDrugs) {
  // System prompt is always in English for consistency
  const systemPrompt = `You are a PARSER for medical queries. Your ONLY task is to extract structured parameters.

ALLOWED PARAMETERS:
- drug: one of [${knownDrugs.join(', ')}]
- sex: "Male" or "Female" (or null)
- age_group: "0-17", "18-40", "41-64", "65-84", "85+" (or null)
- serious: true (serious), false (non-serious), or null (all)
- reaction: specific reaction if mentioned (or null)

RULES:
- Respond ONLY with JSON
- No explanations
- No medical interpretation
- If drug doesn't match the list, set drug: null
- If anything is unclear, set null

EXAMPLES:
Question: "What are the most common side effects for metformin in women over 65?"
Answer: {"drug":"metformin","sex":"Female","age_group":"65-84","serious":null,"reaction":null}

Question: "Serious reactions for warfarin?"
Answer: {"drug":"warfarin","sex":null,"age_group":null,"serious":true,"reaction":null}

Question: "Vilka biverkningar finns för aspirin?" (Swedish)
Answer: {"drug":"aspirin","sex":null,"age_group":null,"serious":null,"reaction":null}

Question: "Gibt es Todesfälle für metformin?" (German)
Answer: {"drug":"metformin","sex":null,"age_group":null,"serious":null,"reaction":"death"}`;

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
 * 
 * Responds in the SAME language as the question
 */
async function renderAnswer(eveResult, language, originalQuestion) {
  const languageMap = {
    en: 'English',
    sv: 'Swedish',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    it: 'Italian',
    nl: 'Dutch',
    da: 'Danish',
    no: 'Norwegian',
    fi: 'Finnish'
  };
  
  const langName = languageMap[language] || 'English';
  
  const systemPrompt = `You are a RENDERER for medical data. Your ONLY task is to formulate EVE's verified result as readable text.

RULES:
- Use ONLY data from the EVE result below
- Do NOT add your own knowledge
- Give NO recommendations or interpretations
- Write in ${langName}
- Keep the response concise (2-4 sentences)
- Mention the number of reports and percentages for top reactions
- End by stating this is reported data, not medical advice

EVE RESULT:
${JSON.stringify(eveResult.results, null, 2)}

FILTERS USED:
${eveResult.applied_filters.join(', ')}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Formulate an answer to: "${originalQuestion}"` }]
  });

  return response.content[0].text.trim();
}

/**
 * Main handler for natural language queries
 */
async function processNaturalQuery(question, language, guidedQueryFn, knownDrugs) {
  const startTime = Date.now();
  
  // Auto-detect language from question
  const detectedLanguage = language || detectLanguage(question);
  
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
      const noMatchMsg = {
        en: 'Could not identify a drug in the question.',
        sv: 'Kunde inte identifiera något läkemedel i frågan.',
        de: 'Konnte kein Medikament in der Frage identifizieren.',
        fr: 'Impossible d\'identifier un médicament dans la question.'
      };
      
      return {
        status: 'NO_MATCH',
        error: noMatchMsg[detectedLanguage] || noMatchMsg.en,
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

    // STEP 3: Render answer (in detected language)
    const renderStart = Date.now();
    const answerText = await renderAnswer(eveResult, detectedLanguage, question);
    pipeline.render = {
      model: 'CLAUDE_L2',
      status: 'complete',
      time_ms: Date.now() - renderStart
    };

    // Disclaimer in user's language
    const disclaimers = {
      en: 'This is descriptive statistics from reported adverse events in FDA FAERS. It does not constitute medical advice and does not imply causality.',
      sv: 'Detta är deskriptiv statistik baserad på rapporterade biverkningar i FDA FAERS. Det utgör inte medicinsk rådgivning och implicerar inte kausalitet.',
      de: 'Dies ist deskriptive Statistik aus gemeldeten Nebenwirkungen in FDA FAERS. Sie stellt keine medizinische Beratung dar und impliziert keine Kausalität.',
      fr: 'Il s\'agit de statistiques descriptives basées sur les effets indésirables signalés dans FDA FAERS. Cela ne constitue pas un avis médical et n\'implique pas de causalité.'
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
        language: detectedLanguage,
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
      
      disclaimer: disclaimers[detectedLanguage] || disclaimers.en,
      
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

module.exports = { processNaturalQuery, parseQuestion, renderAnswer, detectLanguage };
