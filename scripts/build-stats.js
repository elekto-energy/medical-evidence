/**
 * scripts/build-stats.js
 * 
 * Deterministic Stats Builder
 * Generates verifiable statistics from corpus snapshot
 * 
 * Stats are DERIVED from corpus - same hash = same stats
 * No AI, no analysis, no recommendations - just counts
 * 
 * Run: node scripts/build-stats.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CORPUS_DIR = path.join(__dirname, '..', 'data', 'corpus');

// ============================================
// Age Bins (standard epidemiological)
// ============================================
const AGE_BINS = [
  { label: '0-17', min: 0, max: 17 },
  { label: '18-40', min: 18, max: 40 },
  { label: '41-64', min: 41, max: 64 },
  { label: '65-84', min: 65, max: 84 },
  { label: '85+', min: 85, max: 999 },
];

// ============================================
// Outcome Codes (FAERS standard)
// ============================================
const OUTCOME_MAP = {
  '1': 'Recovered/Resolved',
  '2': 'Recovering/Resolving', 
  '3': 'Not Recovered/Not Resolved',
  '4': 'Recovered with Sequelae',
  '5': 'Fatal',
  '6': 'Unknown',
};

// ============================================
// Sex Codes (FAERS standard)
// ============================================
const SEX_MAP = {
  '1': 'Male',
  '2': 'Female',
  '0': 'Unknown',
};

// ============================================
// Stats Extraction Functions
// ============================================

function extractStats(events) {
  const stats = {
    total_reports: events.length,
    
    // 1. Seriousness (Priority #1)
    seriousness: {
      serious: 0,
      non_serious: 0,
      unknown: 0,
    },
    
    // 2. Age Distribution (Priority #2)
    age_distribution: {
      '0-17': 0,
      '18-40': 0,
      '41-64': 0,
      '65-84': 0,
      '85+': 0,
      'Unknown': 0,
    },
    
    // 3. Sex Distribution (Priority #3)
    sex_distribution: {
      'Male': 0,
      'Female': 0,
      'Unknown': 0,
    },
    
    // 4. Outcome Distribution (Priority #4)
    outcome_distribution: {
      'Recovered/Resolved': 0,
      'Recovering/Resolving': 0,
      'Not Recovered/Not Resolved': 0,
      'Recovered with Sequelae': 0,
      'Fatal': 0,
      'Unknown': 0,
    },
    
    // 5. Top Countries (Priority #5)
    country_distribution: {},
    
    // 6. Reports by Year (Priority #6)
    reports_by_year: {},
  };
  
  events.forEach(event => {
    // 1. Seriousness
    if (event.serious === '1') {
      stats.seriousness.serious++;
    } else if (event.serious === '2') {
      stats.seriousness.non_serious++;
    } else {
      stats.seriousness.unknown++;
    }
    
    // 2. Age
    const patient = event.patient || {};
    const age = parseInt(patient.patientonsetage);
    if (!isNaN(age) && age >= 0) {
      let binned = false;
      for (const bin of AGE_BINS) {
        if (age >= bin.min && age <= bin.max) {
          stats.age_distribution[bin.label]++;
          binned = true;
          break;
        }
      }
      if (!binned) stats.age_distribution['Unknown']++;
    } else {
      stats.age_distribution['Unknown']++;
    }
    
    // 3. Sex
    const sex = patient.patientsex;
    const sexLabel = SEX_MAP[sex] || 'Unknown';
    stats.sex_distribution[sexLabel]++;
    
    // 4. Outcome (from reactions)
    const reactions = patient.reaction || [];
    let hasOutcome = false;
    reactions.forEach(r => {
      if (r.reactionoutcome) {
        const outcomeLabel = OUTCOME_MAP[r.reactionoutcome] || 'Unknown';
        stats.outcome_distribution[outcomeLabel]++;
        hasOutcome = true;
      }
    });
    if (!hasOutcome) {
      stats.outcome_distribution['Unknown']++;
    }
    
    // 5. Country
    const country = event.primarysourcecountry || event.occurcountry || 'Unknown';
    stats.country_distribution[country] = (stats.country_distribution[country] || 0) + 1;
    
    // 6. Year
    const receiveDate = event.receivedate;
    if (receiveDate && receiveDate.length >= 4) {
      const year = receiveDate.substring(0, 4);
      stats.reports_by_year[year] = (stats.reports_by_year[year] || 0) + 1;
    }
  });
  
  // Sort countries by count, keep top 10
  const sortedCountries = Object.entries(stats.country_distribution)
    .sort((a, b) => b[1] - a[1]);
  
  const top10Countries = {};
  let otherCount = 0;
  sortedCountries.forEach(([country, count], i) => {
    if (i < 10) {
      top10Countries[country] = count;
    } else {
      otherCount += count;
    }
  });
  if (otherCount > 0) {
    top10Countries['Other'] = otherCount;
  }
  stats.country_distribution = top10Countries;
  
  // Sort years
  const sortedYears = {};
  Object.keys(stats.reports_by_year).sort().forEach(year => {
    sortedYears[year] = stats.reports_by_year[year];
  });
  stats.reports_by_year = sortedYears;
  
  return stats;
}

// ============================================
// Main
// ============================================

function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  005 Medical Evidence - Stats Builder');
  console.log('  Deterministic statistics from corpus snapshot');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  // Find latest version
  const versions = fs.readdirSync(CORPUS_DIR)
    .filter(f => f.startsWith('v') && fs.statSync(path.join(CORPUS_DIR, f)).isDirectory())
    .sort()
    .reverse();
  
  if (versions.length === 0) {
    console.error('❌ No corpus found');
    process.exit(1);
  }
  
  const version = versions[0];
  const versionDir = path.join(CORPUS_DIR, version);
  console.log(`[1/3] Processing version: ${version}`);
  
  // Find all raw source files
  const sourcesDir = path.join(__dirname, '..', 'data', 'sources', 'openfda');
  const rawFiles = fs.readdirSync(sourcesDir).filter(f => f.endsWith('.json'));
  
  console.log(`[2/3] Building stats for ${rawFiles.length} drug(s)...`);
  
  rawFiles.forEach(file => {
    const drugName = file.split('_raw_')[0];
    console.log(`      - ${drugName}`);
    
    // Load raw data (has full event details)
    const rawData = JSON.parse(fs.readFileSync(path.join(sourcesDir, file), 'utf-8'));
    const events = rawData.results || [];
    
    // Extract stats
    const stats = extractStats(events);
    
    // Add metadata
    const statsDoc = {
      drug: drugName,
      corpus_version: version,
      generated_at: new Date().toISOString(),
      source: 'FDA FAERS via OpenFDA',
      stats: stats,
      disclaimer: 'Based on reported adverse events in FDA FAERS. This visualization does not imply causality or risk.',
    };
    
    // Hash the stats (for verification)
    statsDoc.stats_hash = crypto.createHash('sha256')
      .update(JSON.stringify(stats))
      .digest('hex');
    
    // Save to corpus
    const statsPath = path.join(versionDir, `${drugName}_stats.json`);
    fs.writeFileSync(statsPath, JSON.stringify(statsDoc, null, 2));
  });
  
  console.log('[3/3] Done!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  STATS BUILT');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Version: ${version}`);
  console.log(`  Drugs:   ${rawFiles.length}`);
  console.log('');
  console.log('  Stats files created in corpus (verifiable, deterministic)');
  console.log('  Same corpus = same stats = same hash');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
}

main();
