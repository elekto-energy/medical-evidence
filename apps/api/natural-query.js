/**
 * Natural Language Query Endpoint
 * 
 * Trinity Pipeline:
 *   1. Claude L2 (Parser) - Interprets question → structured parameters
 *   2. EVE L1 (Query) - Deterministic query → verified result
 *   3. Claude L2 (Renderer) - Formats EVE result → readable answer
 * 
 * Language Detection (EVE-correct):
 *   - LLM classifier (not word lists)
 *   - Post-check with franc-min
 *   - Re-render once if mismatch
 *   - Full transparency in response
 * 
 * Patent: EVE-PAT-2026-001
 */

const Anthropic = require('@anthropic-ai/sdk').default;
const { franc } = require('franc-min');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Available query parameters (from corpus)
const VALID_PARAMS = {
  sex: ['Male', 'Female'],
  age_group: ['0-17', '18-40', '41-64', '65-84', '85+'],
  serious: [true, false]
};

// ISO 639-1 to full name mapping
const LANGUAGE_NAMES = {
  en: 'English',
  sv: 'Swedish',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  nl: 'Dutch',
  da: 'Danish',
  no: 'Norwegian',
  fi: 'Finnish',
  ja: 'Japanese',
  zh: 'Chinese',
  ko: 'Korean',
  ar: 'Arabic',
  ru: 'Russian',
  pt: 'Portuguese',
  pl: 'Polish',
  tr: 'Turkish',
  he: 'Hebrew',
  th: 'Thai',
  vi: 'Vietnamese',
  hi: 'Hindi'
};

// franc uses ISO 639-3, map to ISO 639-1
const FRANC_TO_ISO1 = {
  'eng': 'en', 'swe': 'sv', 'deu': 'de', 'fra': 'fr', 'spa': 'es',
  'ita': 'it', 'nld': 'nl', 'dan': 'da', 'nor': 'no', 'fin': 'fi',
  'jpn': 'ja', 'cmn': 'zh', 'kor': 'ko', 'ara': 'ar', 'rus': 'ru',
  'por': 'pt', 'pol': 'pl', 'tur': 'tr', 'heb': 'he', 'tha': 'th',
  'vie': 'vi', 'hin': 'hi', 'und': 'en'
};

/**
 * LLM-based language classifier
 * Returns ISO 639-1 code + confidence
 */
async function classifyLanguage(text) {
  const systemPrompt = `You are a language classifier.
Return ONLY valid JSON. No explanation. No extra text.

Classify the language of the following text.
Use ISO 639-1 codes (en, sv, de, fr, ja, zh, ar, etc).

Output format:
{"lang":"xx","confidence":0.95}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      system: systemPrompt,
      messages: [{ role: 'user', content: text }]
    });

    const result = response.content[0].text.trim();
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return { lang: 'en', confidence: 0, source: 'fallback' };
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      lang: parsed.lang || 'en',
      confidence: parsed.confidence || 0.5,
      source: 'llm-classifier'
    };
  } catch (e) {
    console.error('Language classification failed:', e.message);
    return { lang: 'en', confidence: 0, source: 'error-fallback' };
  }
}

/**
 * Local post-check using franc-min
 * Returns detected language or null if uncertain
 */
function postCheckLanguage(text) {
  if (!text || text.length < 20) {
    return null; // Too short to detect reliably
  }
  
  const detected = franc(text, { minLength: 20 });
  return FRANC_TO_ISO1[detected] || null;
}

/**
 * STEP 1: Parse natural language → structured query
 * Claude L2 - Parser role ONLY
 */
async function parseQuestion(question, knownDrugs) {
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

Question: "アスピリンの副作用は何ですか？"
Answer: {"drug":"aspirin","sex":null,"age_group":null,"serious":null,"reaction":null}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }]
  });

  const text = response.content[0].text.trim();
  
  try {
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
 * HARD language requirement - not a preference
 */
async function renderAnswer(eveResult, lang, originalQuestion) {
  const langName = LANGUAGE_NAMES[lang] || 'English';
  
  const systemPrompt = `You are a RENDERER.

CRITICAL LANGUAGE REQUIREMENT:
- You MUST respond ONLY in ${langName}.
- Do NOT mix languages.
- Do NOT explain language choice.
- If you cannot comply, respond with: "[LANGUAGE ERROR]".

OUTPUT RULES:
- Use ONLY data from the EVE result below
- Use neutral, factual language
- No medical advice
- No recommendations
- No speculation
- Describe data only
- Keep the response concise (2-4 sentences)
- Mention the number of reports and percentages for top reactions
- End by stating this is reported data, not medical advice

This is a hard requirement, not a preference.

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
async function processNaturalQuery(question, requestedLang, guidedQueryFn, knownDrugs) {
  const startTime = Date.now();
  
  const pipeline = {
    parse: { model: 'CLAUDE_L2', status: 'pending' },
    query: { model: 'EVE_L1', status: 'pending' },
    render: { model: 'CLAUDE_L2', status: 'pending' }
  };

  // Language detection metadata
  let languageInfo = {
    requested: requestedLang || 'auto',
    detected: null,
    confidence: null,
    source: null,
    post_check: null,
    rerendered: false
  };

  try {
    // STEP 0: Determine language
    let targetLang;
    
    if (requestedLang && requestedLang !== 'auto') {
      // Explicit language - trust it
      targetLang = requestedLang;
      languageInfo.source = 'explicit';
      languageInfo.confidence = 1.0;
    } else {
      // Auto-detect via LLM classifier
      const classResult = await classifyLanguage(question);
      targetLang = classResult.lang;
      languageInfo.detected = classResult.lang;
      languageInfo.confidence = classResult.confidence;
      languageInfo.source = classResult.source;
    }

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
      const errorMsgs = {
        en: 'Could not identify a drug in the question.',
        sv: 'Kunde inte identifiera något läkemedel i frågan.',
        de: 'Konnte kein Medikament in der Frage identifizieren.',
        fr: 'Impossible d\'identifier un médicament dans la question.',
        ja: '質問から薬を特定できませんでした。',
        zh: '无法从问题中识别药物。',
        ar: 'لم نتمكن من تحديد الدواء في السؤال.'
      };
      
      return {
        status: 'NO_MATCH',
        error: errorMsgs[targetLang] || errorMsgs.en,
        available_drugs: knownDrugs,
        language: {
          ...languageInfo,
          final: targetLang
        },
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
        language: { ...languageInfo, final: targetLang },
        trinity: pipeline,
        processing_time_ms: Date.now() - startTime
      };
    }

    // STEP 3: Render answer
    const renderStart = Date.now();
    let answerText = await renderAnswer(eveResult, targetLang, question);
    pipeline.render = {
      model: 'CLAUDE_L2',
      status: 'complete',
      time_ms: Date.now() - renderStart
    };

    // STEP 4: Post-check with franc-min
    const postCheckLang = postCheckLanguage(answerText);
    languageInfo.post_check = postCheckLang;
    
    // If mismatch and we have enough confidence, re-render ONCE
    if (postCheckLang && postCheckLang !== targetLang && languageInfo.confidence >= 0.7) {
      console.log(`Language mismatch: expected ${targetLang}, got ${postCheckLang}. Re-rendering...`);
      
      const reRenderStart = Date.now();
      answerText = await renderAnswer(eveResult, targetLang, question);
      languageInfo.rerendered = true;
      
      pipeline.render.time_ms += (Date.now() - reRenderStart);
      pipeline.render.rerendered = true;
      
      // Check again
      const secondCheck = postCheckLanguage(answerText);
      languageInfo.post_check_final = secondCheck;
    }

    // Disclaimer in target language
    const disclaimers = {
      en: 'This is descriptive statistics from reported adverse events in FDA FAERS. It does not constitute medical advice and does not imply causality.',
      sv: 'Detta är deskriptiv statistik baserad på rapporterade biverkningar i FDA FAERS. Det utgör inte medicinsk rådgivning och implicerar inte kausalitet.',
      de: 'Dies ist deskriptive Statistik aus gemeldeten Nebenwirkungen in FDA FAERS. Sie stellt keine medizinische Beratung dar und impliziert keine Kausalität.',
      fr: 'Il s\'agit de statistiques descriptives basées sur les effets indésirables signalés dans FDA FAERS. Cela ne constitue pas un avis médical et n\'implique pas de causalité.',
      ja: 'これはFDA FAERSに報告された副作用の記述統計です。医学的アドバイスではなく、因果関係を示すものではありません。',
      zh: '这是FDA FAERS报告的不良事件的描述性统计。这不构成医学建议，也不意味着因果关系。',
      ar: 'هذه إحصائيات وصفية من الأحداث السلبية المبلغ عنها في FDA FAERS. لا تشكل نصيحة طبية ولا تعني السببية.',
      es: 'Estas son estadísticas descriptivas de eventos adversos reportados en FDA FAERS. No constituye consejo médico y no implica causalidad.',
      ko: '이것은 FDA FAERS에 보고된 이상반응의 기술통계입니다. 의료 조언이 아니며 인과관계를 의미하지 않습니다.',
      ru: 'Это описательная статистика зарегистрированных побочных эффектов в FDA FAERS. Это не является медицинским советом и не подразумевает причинно-следственную связь.'
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
        text: answerText,
        language: targetLang,
        language_name: LANGUAGE_NAMES[targetLang] || targetLang,
        language_source: languageInfo.source,
        confidence: languageInfo.confidence,
        post_check: languageInfo.post_check,
        rerendered: languageInfo.rerendered
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
      
      disclaimer: disclaimers[targetLang] || disclaimers.en,
      
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

module.exports = { processNaturalQuery, parseQuestion, renderAnswer, classifyLanguage, postCheckLanguage };
