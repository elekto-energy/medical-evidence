/**
 * Guided Evidence Query (GEQ) - Trinity Level 1
 * 
 * Structured, deterministic queries against verified corpus
 * No AI interpretation - just intelligent filtering
 * 
 * Patent: AI som ökar precision, inte auktoritet
 */

const crypto = require('crypto');

// Age group mapping (standardized bins)
const AGE_GROUPS = {
  '0-17': { min: 0, max: 17 },
  '18-40': { min: 18, max: 40 },
  '41-64': { min: 41, max: 64 },
  '65-84': { min: 65, max: 84 },
  '85+': { min: 85, max: 999 },
};

/**
 * Process a Guided Evidence Query
 * 
 * @param {Object} params Query parameters
 * @param {string} params.drug Required - drug name
 * @param {string} params.sex Optional - 'Male', 'Female'
 * @param {string} params.age_group Optional - '0-17', '18-40', '41-64', '65-84', '85+'
 * @param {boolean} params.serious Optional - true for serious only, false for non-serious only
 * @param {string} params.reaction Optional - filter to specific reaction
 * @param {function} loadRawEvents Function to load raw events
 * @param {function} loadProof Function to load proof
 * @param {function} getLatestVersion Function to get latest version
 */
function processGuidedQuery(params, { loadRawEvents, loadProof, getLatestVersion }) {
  const startTime = Date.now();
  
  // Validate required params
  if (!params.drug) {
    return { status: 'ERROR', error: 'Missing required parameter: drug' };
  }
  
  const version = params.version || getLatestVersion();
  if (!version) {
    return { status: 'ERROR', error: 'No corpus available' };
  }
  
  const proof = loadProof(version);
  if (!proof) {
    return { status: 'ERROR', error: `No proof found for version ${version}` };
  }
  
  // Load raw events
  const allEvents = loadRawEvents(params.drug);
  if (allEvents.length === 0) {
    return { status: 'ERROR', error: `No data for drug: ${params.drug}` };
  }
  
  // Apply filters
  let filtered = allEvents;
  const appliedFilters = [];
  
  // Sex filter
  if (params.sex) {
    const sexCode = params.sex === 'Male' ? '1' : params.sex === 'Female' ? '2' : null;
    if (sexCode) {
      filtered = filtered.filter(e => e.patient?.patientsex === sexCode);
      appliedFilters.push(`Sex: ${params.sex}`);
    }
  }
  
  // Age group filter
  if (params.age_group && AGE_GROUPS[params.age_group]) {
    const { min, max } = AGE_GROUPS[params.age_group];
    filtered = filtered.filter(e => {
      const age = parseFloat(e.patient?.patientonsetage);
      if (isNaN(age)) return false;
      // Handle age unit (years vs months vs days)
      const ageUnit = e.patient?.patientonsetageunit;
      let ageYears = age;
      if (ageUnit === '802') ageYears = age / 12; // months
      if (ageUnit === '804') ageYears = age / 365; // days
      return ageYears >= min && ageYears <= max;
    });
    appliedFilters.push(`Age: ${params.age_group}`);
  }
  
  // Seriousness filter
  if (params.serious === true) {
    filtered = filtered.filter(e => e.serious === '1');
    appliedFilters.push('Serious only');
  } else if (params.serious === false) {
    filtered = filtered.filter(e => e.serious === '2');
    appliedFilters.push('Non-serious only');
  }
  
  // Reaction filter
  if (params.reaction) {
    filtered = filtered.filter(e => {
      const reactions = e.patient?.reaction || [];
      return reactions.some(r => 
        r.reactionmeddrapt?.toLowerCase() === params.reaction.toLowerCase()
      );
    });
    appliedFilters.push(`Reaction: ${params.reaction}`);
  }
  
  // Calculate statistics from filtered set
  const reactionCounts = {};
  const outcomeCounts = {};
  const sexCounts = { Male: 0, Female: 0, Unknown: 0 };
  const seriousCounts = { serious: 0, non_serious: 0, unknown: 0 };
  
  filtered.forEach(event => {
    // Reactions
    const reactions = event.patient?.reaction || [];
    reactions.forEach(r => {
      const name = r.reactionmeddrapt;
      if (name) reactionCounts[name] = (reactionCounts[name] || 0) + 1;
    });
    
    // Outcomes
    reactions.forEach(r => {
      const outcomeMap = {
        '1': 'Recovered',
        '2': 'Recovering',
        '3': 'Not Recovered',
        '4': 'Recovered with Sequelae',
        '5': 'Fatal',
        '6': 'Unknown'
      };
      const outcome = outcomeMap[r.reactionoutcome] || 'Unknown';
      outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
    });
    
    // Sex
    const sex = event.patient?.patientsex;
    if (sex === '1') sexCounts.Male++;
    else if (sex === '2') sexCounts.Female++;
    else sexCounts.Unknown++;
    
    // Seriousness
    if (event.serious === '1') seriousCounts.serious++;
    else if (event.serious === '2') seriousCounts.non_serious++;
    else seriousCounts.unknown++;
  });
  
  // Top reactions
  const topReactions = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([reaction, count]) => ({
      reaction,
      count,
      percent: Math.round((count / filtered.length) * 100)
    }));
  
  // Build filter description
  const filterParts = [params.drug];
  if (params.sex) filterParts.push(params.sex.toLowerCase() + ' patients');
  if (params.age_group) filterParts.push(`aged ${params.age_group}`);
  if (params.serious === true) filterParts.push('serious cases');
  if (params.serious === false) filterParts.push('non-serious cases');
  if (params.reaction) filterParts.push(`with ${params.reaction}`);
  const filterDescription = filterParts.join(', ');
  
  // Generate natural language summary (descriptive only, no interpretation)
  let summary = `Based on ${filtered.length} FAERS reports for ${filterDescription}`;
  if (topReactions.length > 0) {
    const top3 = topReactions.slice(0, 3).map(r => `${r.reaction} (${r.percent}%)`).join(', ');
    summary += `, the most frequently reported reactions are: ${top3}.`;
  } else {
    summary += ', no reactions were reported in the matching set.';
  }
  
  // Calculate query hash (for reproducibility verification)
  const queryData = {
    drug: params.drug,
    sex: params.sex || null,
    age_group: params.age_group || null,
    serious: params.serious ?? null,
    reaction: params.reaction || null,
    version: version
  };
  const queryHash = crypto.createHash('sha256')
    .update(JSON.stringify(queryData))
    .digest('hex');
  
  // Calculate result hash
  const resultHash = crypto.createHash('sha256')
    .update(JSON.stringify({ filtered_count: filtered.length, top_reactions: topReactions }))
    .digest('hex');
  
  return {
    status: 'VERIFIED',
    query_type: 'GUIDED_EVIDENCE',
    trinity_level: 1,
    generation_mode: 'VERIFIED_DETERMINISTIC',
    
    parameters: queryData,
    applied_filters: appliedFilters,
    
    corpus_version: version,
    root_hash: proof.root_hash,
    
    results: {
      total_in_corpus: allEvents.length,
      total_matching: filtered.length,
      match_percent: Math.round((filtered.length / allEvents.length) * 100),
      filter_description: filterDescription,
      
      reaction_summary: topReactions,
      outcome_summary: outcomeCounts,
      seriousness_summary: seriousCounts,
      sex_summary: sexCounts,
    },
    
    natural_language_summary: summary,
    
    verification: {
      query_hash: queryHash,
      result_hash: resultHash,
      reproducible: true,
      note: 'Same query parameters will always produce same results from same corpus version'
    },
    
    disclaimer: 'This is descriptive statistics from reported adverse events in FDA FAERS. It does not imply causality, risk assessment, or medical advice.',
    
    processing_time_ms: Date.now() - startTime
  };
}

module.exports = { processGuidedQuery, AGE_GROUPS };
