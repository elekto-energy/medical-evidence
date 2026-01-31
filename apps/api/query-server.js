/**
 * apps/api/query-server.js
 * 
 * Minimal Query API for Medical Evidence
 * Patent Krav 5, 19: Evidensbaserad AI-assistans
 * 
 * Run: node apps/api/query-server.js
 * Test: curl -X POST http://localhost:3050/query -H "Content-Type: application/json" -d '{"query":"metformin"}'
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { processGuidedQuery } = require('./guided-query');
const { processNaturalQuery } = require('./natural-query');
const { processCompareQuery } = require('./compare-query');

// ============================================
// Configuration
// ============================================

const PORT = 3050;
const CORPUS_DIR = path.join(__dirname, '..', '..', 'data', 'corpus');
const PROOFS_DIR = path.join(__dirname, '..', '..', 'data', 'proofs');

// Patent Krav 20: Blockerade fraser
const BLOCKED_PHRASES = [
  'jag rekommenderar', 'du bör', 'det är tillrådligt',
  'i recommend', 'you should', 'it is advisable',
  'take this', 'stop taking', 'increase dose', 'decrease dose'
];

const DISCLAIMER = {
  sv: '⚠️ Detta är rapporterad data från FDA FAERS, inte medicinsk rådgivning. Konsultera alltid kvalificerad vårdpersonal.',
  en: '⚠️ This output reports adverse events from FDA FAERS. It does not constitute medical advice.'
};

// ============================================
// Corpus Functions
// ============================================

function getLatestVersion() {
  if (!fs.existsSync(CORPUS_DIR)) return null;
  
  const versions = fs.readdirSync(CORPUS_DIR)
    .filter(f => f.startsWith('v') && fs.statSync(path.join(CORPUS_DIR, f)).isDirectory())
    .sort()
    .reverse();
  
  return versions[0] || null;
}

function loadManifests(version) {
  const versionDir = path.join(CORPUS_DIR, version);
  if (!fs.existsSync(versionDir)) return [];
  
  return fs.readdirSync(versionDir)
    .filter(f => f.endsWith('_manifest.json'))
    .map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(versionDir, f), 'utf-8'));
      data._filename = f;
      return data;
    });
}

function loadObjects(version, drug) {
  const drugSafe = drug.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const objectsPath = path.join(CORPUS_DIR, version, `${drugSafe}_objects.json`);
  
  if (!fs.existsSync(objectsPath)) return [];
  
  return JSON.parse(fs.readFileSync(objectsPath, 'utf-8'));
}

function loadProof(version) {
  const proofPath = path.join(PROOFS_DIR, `${version}_proof.json`);
  
  if (!fs.existsSync(proofPath)) return null;
  
  return JSON.parse(fs.readFileSync(proofPath, 'utf-8'));
}

function loadStats(version, drug) {
  const drugSafe = drug.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const statsPath = path.join(CORPUS_DIR, version, `${drugSafe}_stats.json`);
  
  if (!fs.existsSync(statsPath)) return null;
  
  return JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
}

function loadRawEvents(drug) {
  const drugSafe = drug.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const version = getLatestVersion();
  
  if (!version) return [];
  
  // Load from corpus objects (already processed and verified)
  const objectsPath = path.join(CORPUS_DIR, version, `${drugSafe}_objects.json`);
  
  if (!fs.existsSync(objectsPath)) return [];
  
  const objects = JSON.parse(fs.readFileSync(objectsPath, 'utf-8'));
  
  // Extract the raw event data from each object
  return objects.map(obj => obj.content || obj).filter(Boolean);
}

// ============================================
// Reaction Filter (same snapshot, just filtered)
// ============================================

function filterByReaction(drugName, reactionName, requestedVersion) {
  const startTime = Date.now();
  
  const version = requestedVersion || getLatestVersion();
  if (!version) {
    return { status: 'ERROR', error: 'No corpus available' };
  }
  
  const proof = loadProof(version);
  if (!proof) {
    return { status: 'ERROR', error: `No proof found for version ${version}` };
  }
  
  // Load raw events
  const events = loadRawEvents(drugName);
  if (events.length === 0) {
    return { status: 'ERROR', error: `No data for drug: ${drugName}` };
  }
  
  // Filter by reaction
  const filtered = events.filter(event => {
    const reactions = event.patient?.reaction || [];
    return reactions.some(r => 
      r.reactionmeddrapt?.toLowerCase() === reactionName.toLowerCase()
    );
  });
  
  // Extract report details (no interpretation, just data)
  const reports = filtered.map(event => {
    const patient = event.patient || {};
    const reactions = patient.reaction || [];
    const matchedReaction = reactions.find(r => 
      r.reactionmeddrapt?.toLowerCase() === reactionName.toLowerCase()
    );
    
    return {
      report_id: event.safetyreportid,
      serious: event.serious === '1' ? 'Yes' : event.serious === '2' ? 'No' : 'Unknown',
      age: patient.patientonsetage || 'Unknown',
      sex: patient.patientsex === '1' ? 'Male' : patient.patientsex === '2' ? 'Female' : 'Unknown',
      outcome: matchedReaction?.reactionoutcome ? {
        '1': 'Recovered',
        '2': 'Recovering',
        '3': 'Not Recovered',
        '4': 'Recovered with Sequelae',
        '5': 'Fatal',
        '6': 'Unknown'
      }[matchedReaction.reactionoutcome] || 'Unknown' : 'Unknown',
      receive_date: event.receivedate || 'Unknown',
    };
  });
  
  return {
    status: 'VERIFIED',
    filter_type: 'REACTION',
    drug: drugName,
    reaction: reactionName,
    corpus_version: version,
    root_hash: proof.root_hash,
    
    total_events_in_corpus: events.length,
    filtered_count: filtered.length,
    
    reports: reports,
    
    generation_mode: 'VERIFIED_DETERMINISTIC',
    verification_status: 'VERIFIED',
    note: 'This view is filtered from the same verified snapshot. No new calculations.',
    
    processing_time_ms: Date.now() - startTime
  };
}

// ============================================
// Query Processing (Deterministic - No LLM)
// ============================================

function processQuery(query, requestedVersion) {
  const startTime = Date.now();
  
  // Get corpus version
  const version = requestedVersion || getLatestVersion();
  if (!version) {
    return {
      status: 'ERROR',
      error: 'No corpus available',
      generation_mode: 'NONE'
    };
  }
  
  // Load proof
  const proof = loadProof(version);
  if (!proof) {
    return {
      status: 'ERROR',
      error: `No proof found for version ${version}`,
      generation_mode: 'NONE'
    };
  }
  
  // Load manifests
  const manifests = loadManifests(version);
  
  // Parse query - extract drug name
  const queryLower = query.toLowerCase().trim();
  const knownDrugs = manifests.map(m => m.drug.toLowerCase());
  
  // Find matching drug
  let matchedDrug = null;
  for (const drug of knownDrugs) {
    if (queryLower.includes(drug)) {
      matchedDrug = drug;
      break;
    }
  }
  
  if (!matchedDrug) {
    // Return available drugs
    return {
      status: 'NO_MATCH',
      corpus_version: version,
      root_hash: proof.root_hash,
      message: `Query did not match any drug in corpus. Available: ${knownDrugs.join(', ')}`,
      available_drugs: knownDrugs,
      generation_mode: 'VERIFIED_DETERMINISTIC',
      verification_status: 'VERIFIED',
      disclaimer: DISCLAIMER.en,
      processing_time_ms: Date.now() - startTime
    };
  }
  
  // Load manifest for matched drug
  const manifest = manifests.find(m => m.drug.toLowerCase() === matchedDrug);
  
  // Load objects for citations
  const objects = loadObjects(version, matchedDrug);
  
  // Load stats (if available)
  const statsDoc = loadStats(version, matchedDrug);
  
  // Extract citations (first 10 object IDs)
  const citations = objects.slice(0, 10).map(obj => ({
    id: obj.id,
    hash: obj.content_hash.slice(0, 16) + '...',
    source: obj.source_type
  }));
  
  // Build response hash (for this specific query)
  const responseData = {
    query: query,
    drug: matchedDrug,
    version: version,
    timestamp: new Date().toISOString()
  };
  const response_hash = crypto.createHash('sha256')
    .update(JSON.stringify(responseData))
    .digest('hex');
  
  return {
    status: 'VERIFIED',
    corpus_version: version,
    root_hash: proof.root_hash,
    response_hash: response_hash,
    
    drug: matchedDrug,
    summary: {
      total_events: manifest.total_events,
      total_in_fda: manifest.total_available,
      source: manifest.source,
      api_last_updated: manifest.api_last_updated,
      top_reactions: manifest.top_reactions.slice(0, 10)
    },
    
    citations: citations,
    citation_count: objects.length,
    
    // Stats (verifiable, derived from same corpus)
    stats: statsDoc ? statsDoc.stats : null,
    stats_hash: statsDoc ? statsDoc.stats_hash : null,
    stats_disclaimer: statsDoc ? statsDoc.disclaimer : null,
    
    generation_mode: 'VERIFIED_DETERMINISTIC',
    verification_status: 'VERIFIED',
    trinity_level: 1,
    
    disclaimer: DISCLAIMER.en,
    processing_time_ms: Date.now() - startTime
  };
}

// ============================================
// HTTP Server
// ============================================

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Routes
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  try {
    // GET /health
    if (req.method === 'GET' && url.pathname === '/health') {
      const version = getLatestVersion();
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'OK',
        service: '005-medical-evidence',
        corpus_version: version,
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    // GET /corpus
    if (req.method === 'GET' && url.pathname === '/corpus') {
      const version = getLatestVersion();
      const manifests = version ? loadManifests(version) : [];
      const proof = version ? loadProof(version) : null;
      
      // Load stats for each drug
      const drugs = manifests.map(m => {
        const stats = loadStats(version, m.drug);
        return {
          drug: m.drug,
          events: m.total_events,
          total_in_fda: m.total_available,
          source: m.source,
          serious_percent: stats ? Math.round((stats.stats.seriousness.serious / stats.stats.total_reports) * 100) : null,
          fatal_count: stats ? (stats.stats.outcome_distribution['Fatal'] || 0) : null,
          top_reaction: m.top_reactions?.[0]?.reaction || null,
        };
      });
      
      // Group by therapeutic area
      const THERAPEUTIC_AREAS = {
        'A - Metabolism/Diabetes': ['metformin', 'insulin', 'glimepiride', 'sitagliptin', 'empagliflozin', 'liraglutide'],
        'C - Cardiovascular': ['atorvastatin', 'simvastatin', 'warfarin', 'apixaban', 'metoprolol', 'amlodipine', 'lisinopril'],
        'N - CNS/Psychiatry': ['sertraline', 'fluoxetine', 'escitalopram', 'venlafaxine', 'quetiapine', 'risperidone', 'diazepam'],
        'M - Pain/Inflammation': ['ibuprofen', 'aspirin', 'paracetamol', 'naproxen', 'diclofenac', 'tramadol'],
        'J - Anti-infectives': ['amoxicillin', 'ciprofloxacin', 'doxycycline', 'azithromycin', 'vancomycin'],
        'R - Respiratory/Allergy': ['salbutamol', 'budesonide', 'fluticasone', 'montelukast', 'cetirizine'],
      };
      
      // Add therapeutic area to each drug
      drugs.forEach(d => {
        for (const [area, list] of Object.entries(THERAPEUTIC_AREAS)) {
          if (list.includes(d.drug.toLowerCase())) {
            d.therapeutic_area = area;
            d.atc_code = area.charAt(0);
            break;
          }
        }
      });
      
      res.writeHead(200);
      res.end(JSON.stringify({
        version: version,
        root_hash: proof?.root_hash,
        total_events: drugs.reduce((sum, d) => sum + d.events, 0),
        total_substances: drugs.length,
        therapeutic_areas: Object.keys(THERAPEUTIC_AREAS).length,
        drugs: drugs,
        proof_available: !!proof,
        disclaimer: 'Derived from verified snapshot. Does not imply causality or risk.'
      }, null, 2));
      return;
    }
    
    // POST /query
    if (req.method === 'POST' && url.pathname === '/query') {
      const body = await parseBody(req);
      
      if (!body.query) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing "query" field' }));
        return;
      }
      
      const result = processQuery(body.query, body.version);
      
      res.writeHead(200);
      res.end(JSON.stringify(result, null, 2));
      return;
    }
    
    // POST /query/reaction - Filter events by reaction
    if (req.method === 'POST' && url.pathname === '/query/reaction') {
      const body = await parseBody(req);
      
      if (!body.drug || !body.reaction) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing "drug" or "reaction" field' }));
        return;
      }
      
      const result = filterByReaction(body.drug, body.reaction, body.version);
      
      res.writeHead(200);
      res.end(JSON.stringify(result, null, 2));
      return;
    }
    
    // POST /query/guided - Guided Evidence Query (GEQ)
    if (req.method === 'POST' && url.pathname === '/query/guided') {
      const body = await parseBody(req);
      
      if (!body.drug) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing required "drug" field' }));
        return;
      }
      
      const result = processGuidedQuery(body, {
        loadRawEvents,
        loadProof,
        getLatestVersion
      });
      
      res.writeHead(200);
      res.end(JSON.stringify(result, null, 2));
      return;
    }
    
    // POST /query/compare - Compare Evidence Query (Kontrafaktisk jämförelse)
    if (req.method === 'POST' && url.pathname === '/query/compare') {
      const body = await parseBody(req);
      
      if (!body.group_a || !body.group_b) {
        res.writeHead(400);
        res.end(JSON.stringify({ 
          error: 'Missing required fields: group_a and group_b',
          example: {
            group_a: { drug: 'metformin', sex: 'Female', age_group: '65-84' },
            group_b: { drug: 'metformin', sex: 'Female', age_group: '18-40' }
          }
        }));
        return;
      }
      
      const result = processCompareQuery(body.group_a, body.group_b, {
        loadRawEvents,
        loadProof,
        getLatestVersion
      });
      
      res.writeHead(200);
      res.end(JSON.stringify(result, null, 2));
      return;
    }
    
    // POST /query/natural - Natural Language Query (Trinity Pipeline)
    if (req.method === 'POST' && url.pathname === '/query/natural') {
      const body = await parseBody(req);
      
      if (!body.question) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing required "question" field' }));
        return;
      }
      
      const language = body.language || 'sv';
      
      // Get known drugs from manifests
      const version = getLatestVersion();
      const manifests = version ? loadManifests(version) : [];
      const knownDrugs = manifests.map(m => m.drug.toLowerCase());
      
      // Guided query function for pipeline
      const guidedQueryFn = (params) => processGuidedQuery(params, {
        loadRawEvents,
        loadProof,
        getLatestVersion
      });
      
      const result = await processNaturalQuery(
        body.question,
        language,
        guidedQueryFn,
        knownDrugs
      );
      
      res.writeHead(200);
      res.end(JSON.stringify(result, null, 2));
      return;
    }
    
    // GET /proof/:version
    if (req.method === 'GET' && url.pathname.startsWith('/proof/')) {
      const version = url.pathname.replace('/proof/', '');
      const proof = loadProof(version);
      
      if (!proof) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: `Proof not found for version: ${version}` }));
        return;
      }
      
      res.writeHead(200);
      res.end(JSON.stringify(proof, null, 2));
      return;
    }
    
    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
    
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

// ============================================
// Start Server
// ============================================

server.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  005 Medical Evidence - Query API');
  console.log('  Patent Krav 5, 19: Evidensbaserad AI-assistans');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Server:   http://localhost:${PORT}`);
  console.log(`  Corpus:   ${getLatestVersion() || 'NOT FOUND'}`);
  console.log('');
  console.log('  Endpoints:');
  console.log('    GET  /health    - Service status');
  console.log('    GET  /corpus    - Available drugs and proof');
  console.log('    POST /query     - Query adverse events');
  console.log('    GET  /proof/:v  - Get Merkle proof');
  console.log('');
  console.log('  Example:');
  console.log('    curl http://localhost:3050/corpus');
  console.log('    curl -X POST http://localhost:3050/query \\');
  console.log('         -H "Content-Type: application/json" \\');
  console.log('         -d \'{"query":"metformin adverse events"}\'');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});
