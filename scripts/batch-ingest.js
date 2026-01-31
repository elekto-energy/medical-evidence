/**
 * scripts/batch-ingest.js
 * 
 * Batch ingestion of curated drug list
 * 6 therapeutic areas, ~50 substances
 * 
 * Run: node scripts/batch-ingest.js [limit]
 * Example: node scripts/batch-ingest.js 100
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================
// Curated Drug List - 6 Therapeutic Areas
// ============================================

const DRUG_GROUPS = {
  'A - Metabolism/Diabetes': [
    'metformin',
    'insulin',
    'glimepiride',
    'sitagliptin',
    'empagliflozin',
    'liraglutide',
  ],
  'C - Cardiovascular': [
    'atorvastatin',
    'simvastatin',
    'warfarin',
    'apixaban',
    'metoprolol',
    'amlodipine',
    'lisinopril',
  ],
  'N - CNS/Psychiatry': [
    'sertraline',
    'fluoxetine',
    'escitalopram',
    'venlafaxine',
    'quetiapine',
    'risperidone',
    'diazepam',
  ],
  'M - Pain/Inflammation': [
    'ibuprofen',
    'aspirin',
    'paracetamol',
    'naproxen',
    'diclofenac',
    'tramadol',
  ],
  'J - Anti-infectives': [
    'amoxicillin',
    'ciprofloxacin',
    'doxycycline',
    'azithromycin',
    'vancomycin',
  ],
  'R - Respiratory/Allergy': [
    'salbutamol',
    'budesonide',
    'fluticasone',
    'montelukast',
    'cetirizine',
  ],
};

// Flatten to array
const ALL_DRUGS = Object.values(DRUG_GROUPS).flat();

// ============================================
// Configuration
// ============================================

const OPENFDA_BASE = 'https://api.fda.gov/drug/event.json';
const DELAY_MS = 500; // Be nice to FDA API

// ============================================
// Fetch Function
// ============================================

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Transform Function
// ============================================

function createKnowledgeObject(event, version) {
  const content = JSON.stringify(event, null, 2);
  const contentHash = crypto.createHash('sha256').update(content).digest('hex');
  
  return {
    id: `openfda-faers-${event.safetyreportid}`,
    version: version,
    content: content,
    content_hash: contentHash,
    source_uri: `${OPENFDA_BASE}?search=safetyreportid:${event.safetyreportid}`,
    source_type: 'FDA_FAERS',
    timestamp: new Date().toISOString(),
    author_id: 'batch-ingest',
    parent_version: null,
  };
}

// ============================================
// Ingest Single Drug
// ============================================

async function ingestDrug(drugName, limit, version, corpusDir, sourcesDir) {
  const url = `${OPENFDA_BASE}?search=patient.drug.medicinalproduct:"${encodeURIComponent(drugName)}"&limit=${limit}`;
  
  try {
    const data = await fetchJSON(url);
    
    if (!data.results || data.results.length === 0) {
      return { drug: drugName, status: 'NO_DATA', count: 0 };
    }
    
    const events = data.results;
    const objects = events.map(e => createKnowledgeObject(e, version));
    
    // Extract top reactions
    const reactionCounts = {};
    events.forEach(event => {
      if (event.patient && event.patient.reaction) {
        event.patient.reaction.forEach(r => {
          const name = r.reactionmeddrapt;
          if (name) reactionCounts[name] = (reactionCounts[name] || 0) + 1;
        });
      }
    });
    
    const topReactions = Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([reaction, count]) => ({ reaction, count }));
    
    // Create manifest
    const manifest = {
      version: version,
      created_at: new Date().toISOString(),
      source: 'OpenFDA FAERS',
      drug: drugName,
      total_events: events.length,
      total_available: data.meta?.results?.total || 0,
      api_last_updated: data.meta?.last_updated || 'unknown',
      disclaimer: data.meta?.disclaimer || '',
      top_reactions: topReactions,
    };
    
    // Calculate root hash for this drug
    const allHashes = objects.map(o => o.content_hash).sort();
    manifest.root_hash = crypto.createHash('sha256')
      .update(allHashes.join(''))
      .digest('hex');
    
    // Save files
    const drugSafe = drugName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    fs.writeFileSync(
      path.join(corpusDir, `${drugSafe}_manifest.json`),
      JSON.stringify(manifest, null, 2)
    );
    
    fs.writeFileSync(
      path.join(corpusDir, `${drugSafe}_objects.json`),
      JSON.stringify(objects, null, 2)
    );
    
    fs.writeFileSync(
      path.join(sourcesDir, `${drugSafe}_raw_${today}.json`),
      JSON.stringify(data, null, 2)
    );
    
    return { 
      drug: drugName, 
      status: 'OK', 
      count: events.length,
      total_in_fda: data.meta?.results?.total || 0
    };
    
  } catch (err) {
    return { drug: drugName, status: 'ERROR', error: err.message, count: 0 };
  }
}

// ============================================
// Main
// ============================================

async function main() {
  const limit = parseInt(process.argv[2] || '100', 10);
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const version = `v${today}-01`;
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  005 Medical Evidence - Batch Ingestion');
  console.log('  Curated drug list: 6 therapeutic areas');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`  Version:    ${version}`);
  console.log(`  Drugs:      ${ALL_DRUGS.length}`);
  console.log(`  Limit:      ${limit} events per drug`);
  console.log(`  Max events: ${ALL_DRUGS.length * limit}`);
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('');
  
  // Create directories
  const corpusDir = path.join(__dirname, '..', 'data', 'corpus', version);
  const sourcesDir = path.join(__dirname, '..', 'data', 'sources', 'openfda');
  
  if (!fs.existsSync(corpusDir)) fs.mkdirSync(corpusDir, { recursive: true });
  if (!fs.existsSync(sourcesDir)) fs.mkdirSync(sourcesDir, { recursive: true });
  
  // Results tracking
  const results = [];
  let totalEvents = 0;
  let successCount = 0;
  let failCount = 0;
  
  // Process each group
  for (const [groupName, drugs] of Object.entries(DRUG_GROUPS)) {
    console.log(`\n📁 ${groupName}`);
    console.log('─'.repeat(50));
    
    for (const drug of drugs) {
      process.stdout.write(`   ${drug.padEnd(20)}`);
      
      const result = await ingestDrug(drug, limit, version, corpusDir, sourcesDir);
      results.push(result);
      
      if (result.status === 'OK') {
        successCount++;
        totalEvents += result.count;
        console.log(`✅ ${result.count} events (${result.total_in_fda.toLocaleString()} in FDA)`);
      } else if (result.status === 'NO_DATA') {
        console.log(`⚠️  No data found`);
      } else {
        failCount++;
        console.log(`❌ ${result.error}`);
      }
      
      // Rate limiting
      await sleep(DELAY_MS);
    }
  }
  
  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  BATCH INGESTION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`  Version:      ${version}`);
  console.log(`  Successful:   ${successCount}/${ALL_DRUGS.length} drugs`);
  console.log(`  Total events: ${totalEvents.toLocaleString()}`);
  console.log(`  Failed:       ${failCount}`);
  console.log('');
  console.log('  Next steps:');
  console.log('    node scripts/build-stats.js');
  console.log('    node scripts/prove-corpus-runner.js');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('');
}

main();
