/**
 * Compare Evidence Query (CEQ) - Kontrafaktisk Jämförelse
 * 
 * EVE:s kärnprincip: "Visa delta, inte slutsats"
 * 
 * Kör två deterministiska queries, jämför fördelningar,
 * visar skillnader utan tolkning eller rekommendation.
 * 
 * Patent: EVE-PAT-2026-001 - Witness Mode
 * "AI may observe and cite — never recommend or decide"
 */

const crypto = require('crypto');
const { processGuidedQuery, AGE_GROUPS } = require('./guided-query');

/**
 * Process a Compare Evidence Query
 * 
 * Jämför två populationer (Group A vs Group B)
 * Returnerar delta utan värdering
 * 
 * @param {Object} groupA - First query parameters
 * @param {Object} groupB - Second query parameters  
 * @param {Object} helpers - { loadRawEvents, loadProof, getLatestVersion }
 */
function processCompareQuery(groupA, groupB, helpers) {
  const startTime = Date.now();
  
  // Validera att båda grupperna har drug
  if (!groupA.drug || !groupB.drug) {
    return { 
      status: 'ERROR', 
      error: 'Both groups require "drug" parameter' 
    };
  }
  
  // Kör båda queries
  const resultA = processGuidedQuery(groupA, helpers);
  const resultB = processGuidedQuery(groupB, helpers);
  
  // Kontrollera att båda lyckades
  if (resultA.status !== 'VERIFIED') {
    return { 
      status: 'ERROR', 
      error: `Group A query failed: ${resultA.error}`,
      group_a_error: resultA
    };
  }
  
  if (resultB.status !== 'VERIFIED') {
    return { 
      status: 'ERROR', 
      error: `Group B query failed: ${resultB.error}`,
      group_b_error: resultB
    };
  }
  
  // Beräkna delta för reaktioner
  const reactionDelta = calculateReactionDelta(
    resultA.results.reaction_summary,
    resultB.results.reaction_summary,
    resultA.results.total_matching,
    resultB.results.total_matching
  );
  
  // Beräkna delta för allvarlighetsgrad
  const seriousnessDelta = calculateSeriousnessDelta(
    resultA.results.seriousness_summary,
    resultB.results.seriousness_summary,
    resultA.results.total_matching,
    resultB.results.total_matching
  );
  
  // Beräkna delta för utfall
  const outcomeDelta = calculateOutcomeDelta(
    resultA.results.outcome_summary,
    resultB.results.outcome_summary
  );
  
  // Generera jämförelsebesk rivning (ingen värdering)
  const comparisonDescription = generateComparisonDescription(groupA, groupB);
  
  // Generera jämförelse-hash för reproducerbarhet
  const compareData = {
    group_a: groupA,
    group_b: groupB,
    version: resultA.corpus_version,
    timestamp: new Date().toISOString()
  };
  const compareHash = crypto.createHash('sha256')
    .update(JSON.stringify(compareData))
    .digest('hex');
  
  return {
    status: 'VERIFIED',
    query_type: 'COMPARE_EVIDENCE',
    trinity_level: 1,
    generation_mode: 'VERIFIED_DETERMINISTIC',
    
    comparison: comparisonDescription,
    
    corpus_version: resultA.corpus_version,
    root_hash: resultA.root_hash,
    
    group_a: {
      parameters: groupA,
      applied_filters: resultA.applied_filters,
      total_matching: resultA.results.total_matching,
      total_in_corpus: resultA.results.total_in_corpus,
      match_percent: resultA.results.match_percent
    },
    
    group_b: {
      parameters: groupB,
      applied_filters: resultB.applied_filters,
      total_matching: resultB.results.total_matching,
      total_in_corpus: resultB.results.total_in_corpus,
      match_percent: resultB.results.match_percent
    },
    
    delta: {
      sample_size_difference: resultA.results.total_matching - resultB.results.total_matching,
      
      reactions: reactionDelta,
      seriousness: seriousnessDelta,
      outcomes: outcomeDelta,
    },
    
    // Rå data för UI
    raw: {
      group_a_reactions: resultA.results.reaction_summary,
      group_b_reactions: resultB.results.reaction_summary,
      group_a_seriousness: resultA.results.seriousness_summary,
      group_b_seriousness: resultB.results.seriousness_summary,
      group_a_outcomes: resultA.results.outcome_summary,
      group_b_outcomes: resultB.results.outcome_summary,
    },
    
    verification: {
      compare_hash: compareHash,
      query_hash_a: resultA.verification.query_hash,
      query_hash_b: resultB.verification.query_hash,
      reproducible: true,
      note: 'Same parameters always produce same comparison from same corpus version'
    },
    
    // EVE:s kärnprincip
    interpretation_policy: {
      allowed: [
        'Descriptive statistics',
        'Percentage differences',
        'Count comparisons',
        'Presence/absence of reactions'
      ],
      blocked: [
        'Risk assessment',
        'Safety conclusions',
        'Medical recommendations',
        'Causal inference',
        'Words: "safer", "more dangerous", "better", "worse", "risk"'
      ]
    },
    
    disclaimer: 'This comparison shows differences in reported adverse events between two populations. ' +
      'It does NOT imply causality, relative safety, or risk. ' +
      'Differences may reflect reporting patterns, population characteristics, or chance. ' +
      'Always consult qualified healthcare professionals for medical decisions.',
    
    processing_time_ms: Date.now() - startTime
  };
}

/**
 * Beräkna delta för reaktioner mellan två grupper
 */
function calculateReactionDelta(reactionsA, reactionsB, countA, countB) {
  // Samla alla unika reaktioner
  const allReactions = new Set();
  reactionsA.forEach(r => allReactions.add(r.reaction));
  reactionsB.forEach(r => allReactions.add(r.reaction));
  
  const delta = [];
  
  allReactions.forEach(reaction => {
    const a = reactionsA.find(r => r.reaction === reaction);
    const b = reactionsB.find(r => r.reaction === reaction);
    
    const percentA = a ? a.percent : 0;
    const percentB = b ? b.percent : 0;
    const countAVal = a ? a.count : 0;
    const countBVal = b ? b.count : 0;
    
    const percentDiff = percentA - percentB;
    
    // Endast inkludera om det finns någon skillnad
    if (percentA !== 0 || percentB !== 0) {
      delta.push({
        reaction,
        group_a_percent: percentA,
        group_b_percent: percentB,
        group_a_count: countAVal,
        group_b_count: countBVal,
        percent_difference: percentDiff,
        direction: percentDiff > 0 ? 'HIGHER_IN_A' : percentDiff < 0 ? 'HIGHER_IN_B' : 'EQUAL',
        // Absolut skillnad för sortering
        abs_difference: Math.abs(percentDiff)
      });
    }
  });
  
  // Sortera efter största skillnad
  delta.sort((a, b) => b.abs_difference - a.abs_difference);
  
  // Top 15 största skillnader
  return {
    largest_differences: delta.slice(0, 15),
    total_unique_reactions: allReactions.size,
    only_in_a: delta.filter(d => d.group_b_percent === 0).length,
    only_in_b: delta.filter(d => d.group_a_percent === 0).length
  };
}

/**
 * Beräkna delta för allvarlighetsgrad
 */
function calculateSeriousnessDelta(seriousA, seriousB, countA, countB) {
  const seriousPercentA = countA > 0 ? Math.round((seriousA.serious / countA) * 100) : 0;
  const seriousPercentB = countB > 0 ? Math.round((seriousB.serious / countB) * 100) : 0;
  
  const nonSeriousPercentA = countA > 0 ? Math.round((seriousA.non_serious / countA) * 100) : 0;
  const nonSeriousPercentB = countB > 0 ? Math.round((seriousB.non_serious / countB) * 100) : 0;
  
  return {
    serious: {
      group_a_count: seriousA.serious,
      group_b_count: seriousB.serious,
      group_a_percent: seriousPercentA,
      group_b_percent: seriousPercentB,
      percent_difference: seriousPercentA - seriousPercentB,
      direction: seriousPercentA > seriousPercentB ? 'HIGHER_IN_A' : 
                 seriousPercentA < seriousPercentB ? 'HIGHER_IN_B' : 'EQUAL'
    },
    non_serious: {
      group_a_count: seriousA.non_serious,
      group_b_count: seriousB.non_serious,
      group_a_percent: nonSeriousPercentA,
      group_b_percent: nonSeriousPercentB,
      percent_difference: nonSeriousPercentA - nonSeriousPercentB,
      direction: nonSeriousPercentA > nonSeriousPercentB ? 'HIGHER_IN_A' : 
                 nonSeriousPercentA < nonSeriousPercentB ? 'HIGHER_IN_B' : 'EQUAL'
    }
  };
}

/**
 * Beräkna delta för utfall
 */
function calculateOutcomeDelta(outcomesA, outcomesB) {
  const outcomes = ['Recovered', 'Recovering', 'Not Recovered', 'Recovered with Sequelae', 'Fatal', 'Unknown'];
  
  // Totaler för procentberäkning
  const totalA = Object.values(outcomesA).reduce((a, b) => a + b, 0);
  const totalB = Object.values(outcomesB).reduce((a, b) => a + b, 0);
  
  const delta = {};
  
  outcomes.forEach(outcome => {
    const countA = outcomesA[outcome] || 0;
    const countB = outcomesB[outcome] || 0;
    const percentA = totalA > 0 ? Math.round((countA / totalA) * 100) : 0;
    const percentB = totalB > 0 ? Math.round((countB / totalB) * 100) : 0;
    
    delta[outcome] = {
      group_a_count: countA,
      group_b_count: countB,
      group_a_percent: percentA,
      group_b_percent: percentB,
      percent_difference: percentA - percentB,
      direction: percentA > percentB ? 'HIGHER_IN_A' : 
                 percentA < percentB ? 'HIGHER_IN_B' : 'EQUAL'
    };
  });
  
  return delta;
}

/**
 * Generera beskrivning av jämförelsen (neutral, ingen värdering)
 */
function generateComparisonDescription(groupA, groupB) {
  const descA = buildGroupDescription(groupA);
  const descB = buildGroupDescription(groupB);
  
  return {
    group_a_label: descA,
    group_b_label: descB,
    comparison_type: detectComparisonType(groupA, groupB),
    natural_language: `Comparing ${descA} vs ${descB}`
  };
}

function buildGroupDescription(params) {
  const parts = [params.drug];
  
  if (params.sex) parts.push(params.sex.toLowerCase());
  if (params.age_group) parts.push(`age ${params.age_group}`);
  if (params.serious === true) parts.push('serious');
  if (params.serious === false) parts.push('non-serious');
  if (params.reaction) parts.push(`with ${params.reaction}`);
  
  return parts.join(', ');
}

function detectComparisonType(groupA, groupB) {
  // Identifiera vilken typ av jämförelse
  if (groupA.age_group !== groupB.age_group && groupA.sex === groupB.sex) {
    return 'AGE_COMPARISON';
  }
  if (groupA.sex !== groupB.sex && groupA.age_group === groupB.age_group) {
    return 'SEX_COMPARISON';
  }
  if (groupA.serious !== groupB.serious) {
    return 'SERIOUSNESS_COMPARISON';
  }
  if (groupA.drug !== groupB.drug) {
    return 'DRUG_COMPARISON';
  }
  return 'CUSTOM_COMPARISON';
}

module.exports = { processCompareQuery };
