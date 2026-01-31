/**
 * scripts/ingest-openfda-runner.js
 * 
 * Standalone OpenFDA ingestion script
 * Run with: node scripts/ingest-openfda-runner.js [drugname] [limit]
 * 
 * Example:
 *   node scripts/ingest-openfda-runner.js metformin 100
 *   node scripts/ingest-openfda-runner.js ibuprofen 50
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================
// Configuration
// ============================================

const OPENFDA_BASE = 'https://api.fda.gov';
const ENDPOINTS = {
  DRUG_EVENT: `${OPENFDA_BASE}/drug/event.json`,
  DRUG_LABEL: `${OPENFDA_BASE}/drug/label.json`,
};

// ============================================
// Fetch Function
// ============================================

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    console.log(`[fetch] ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// ============================================
// Transform to Knowledge Object
// ============================================

function createKnowledgeObject(event, version, source) {
  const content = JSON.stringify(event, null, 2);
  const contentHash = crypto.createHash('sha256').update(content).digest('hex');
  
  return {
    id: `openfda-faers-${event.safetyreportid}`,
    version: version,
    content: content,
    content_hash: contentHash,
    source_uri: `${ENDPOINTS.DRUG_EVENT}?search=safetyreportid:${event.safetyreportid}`,
    source_type: 'FDA_FAERS',
    timestamp: new Date().toISOString(),
    author_id: 'openfda-ingest',
    parent_version: null,
  };
}

// ============================================
// Extract unique reactions from events
// ============================================

function extractReactions(events) {
  const reactionCounts = {};
  
  events.forEach(event => {
    if (event.patient && event.patient.reaction) {
      event.patient.reaction.forEach(r => {
        const name = r.reactionmeddrapt;
        if (name) {
          reactionCounts[name] = (reactionCounts[name] || 0) + 1;
        }
      });
    }
  });
  
  // Sort by count
  return Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ reaction: name, count }));
}

// ============================================
// Main Ingestion
// ============================================

async function ingestDrug(drugName, limit = 100) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  005 Medical Evidence - OpenFDA Ingestion');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Drug:    ${drugName}`);
  console.log(`  Limit:   ${limit}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  // Build URL
  const url = `${ENDPOINTS.DRUG_EVENT}?search=patient.drug.medicinalproduct:"${encodeURIComponent(drugName)}"&limit=${limit}`;
  
  // Fetch data
  console.log('[1/5] Fetching from OpenFDA...');
  const data = await fetchJSON(url);
  
  if (!data.results || data.results.length === 0) {
    throw new Error(`No results found for drug: ${drugName}`);
  }
  
  console.log(`      Found ${data.results.length} adverse event reports`);
  console.log(`      Total in database: ${data.meta.results.total}`);
  
  // Generate version
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const version = `v${today}-01`;
  
  // Transform to knowledge objects
  console.log('[2/5] Transforming to knowledge objects...');
  const objects = data.results.map(event => 
    createKnowledgeObject(event, version, drugName)
  );
  
  // Extract reactions summary
  console.log('[3/5] Extracting reactions summary...');
  const reactions = extractReactions(data.results);
  const topReactions = reactions.slice(0, 20);
  
  // Create corpus directory
  console.log('[4/5] Saving to corpus...');
  const corpusDir = path.join(__dirname, '..', 'data', 'corpus', version);
  const sourcesDir = path.join(__dirname, '..', 'data', 'sources', 'openfda');
  
  if (!fs.existsSync(corpusDir)) {
    fs.mkdirSync(corpusDir, { recursive: true });
  }
  if (!fs.existsSync(sourcesDir)) {
    fs.mkdirSync(sourcesDir, { recursive: true });
  }
  
  // Create manifest
  const manifest = {
    version: version,
    created_at: new Date().toISOString(),
    source: 'OpenFDA FAERS',
    drug: drugName,
    total_events: data.results.length,
    total_available: data.meta.results.total,
    api_last_updated: data.meta.last_updated,
    disclaimer: data.meta.disclaimer,
    top_reactions: topReactions,
    root_hash: null, // Will be set by prove script
  };
  
  // Calculate root hash
  const allHashes = objects.map(o => o.content_hash).sort();
  manifest.root_hash = crypto.createHash('sha256')
    .update(allHashes.join(''))
    .digest('hex');
  
  // Save files
  const drugNameSafe = drugName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  // Save manifest
  fs.writeFileSync(
    path.join(corpusDir, `${drugNameSafe}_manifest.json`),
    JSON.stringify(manifest, null, 2)
  );
  
  // Save knowledge objects
  fs.writeFileSync(
    path.join(corpusDir, `${drugNameSafe}_objects.json`),
    JSON.stringify(objects, null, 2)
  );
  
  // Save raw data (for reference)
  fs.writeFileSync(
    path.join(sourcesDir, `${drugNameSafe}_raw_${today}.json`),
    JSON.stringify(data, null, 2)
  );
  
  // Print summary
  console.log('[5/5] Done!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  INGESTION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Version:     ${version}`);
  console.log(`  Objects:     ${objects.length}`);
  console.log(`  Root hash:   ${manifest.root_hash.slice(0, 16)}...`);
  console.log('');
  console.log('  Top 10 reported reactions:');
  topReactions.slice(0, 10).forEach((r, i) => {
    console.log(`    ${(i + 1).toString().padStart(2)}. ${r.reaction} (${r.count})`);
  });
  console.log('');
  console.log('  Files created:');
  console.log(`    - data/corpus/${version}/${drugNameSafe}_manifest.json`);
  console.log(`    - data/corpus/${version}/${drugNameSafe}_objects.json`);
  console.log(`    - data/sources/openfda/${drugNameSafe}_raw_${today}.json`);
  console.log('');
  console.log('  Next steps:');
  console.log('    node scripts/prove-corpus-runner.js');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  return { manifest, objects };
}

// ============================================
// CLI Entry Point
// ============================================

const drugName = process.argv[2] || 'metformin';
const limit = parseInt(process.argv[3] || '100', 10);

ingestDrug(drugName, limit)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('');
    console.error('❌ Ingestion failed:', err.message);
    console.error('');
    process.exit(1);
  });
