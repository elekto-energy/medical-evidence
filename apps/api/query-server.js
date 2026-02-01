/**
 * apps/api/query-server.js
 * 
 * EVE - Evidence & Verification Engine
 * Medical Evidence Query API
 * 
 * Patent: EVE-PAT-2026-001
 * Governance: GOVERNANCE_v1
 * 
 * Run: node apps/api/query-server.js
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

// Governance v1: System must never provide medical advice
const GOVERNANCE_VERSION = 'GOVERNANCE_v1';
const POLICY_VERSION = 'NO_MEDICAL_ADVICE_v1';

// Patent Krav 20: Blockerade fraser
const BLOCKED_PHRASES = [
  'jag rekommenderar', 'du bör', 'det är tillrådligt',
  'i recommend', 'you should', 'it is advisable',
  'take this', 'stop taking', 'increase dose', 'decrease dose'
];

const DISCLAIMER = {
  sv: 'Detta är rapporterad data från FDA FAERS, inte medicinsk rådgivning. Konsultera alltid kvalificerad vårdpersonal.',
  en: 'This output reports adverse events from FDA FAERS. It does not constitute medical advice.'
};

// ============================================
// EVE Decision ID Generator
// ============================================

function generateEVEDecisionID(decisionType, queryHash, resultHash, corpusVersion) {
  const timestamp = new Date();
  const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Create decision context hash
  const decisionContext = {
    domain: 'medical',
    decision_type: decisionType,
    query_hash: queryHash,
    result_hash: resultHash,
    corpus_version: corpusVersion,
    policy: POLICY_VERSION,
    governance: GOVERNANCE_VERSION,
    timestamp: timestamp.toISOString()
  };
  
  const contextHash = crypto.createHash('sha256')
    .update(JSON.stringify(decisionContext))
    .digest('hex');
  
  // EVE-MED-YYYYMMDD-{short hash}
  const shortHash = contextHash.slice(0, 6);
  const eveId = `EVE-MED-${dateStr}-${shortHash}`;
  
  return {
    eve_decision_id: eveId,
    decision_context: decisionContext,
    context_hash: contextHash
  };
}

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

function loadDrugsMetadata(version) {
  const metadataPath = path.join(CORPUS_DIR, version, 'drugs_metadata.json');
  
  if (!fs.existsSync(metadataPath)) return null;
  
  return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
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
  
  const objectsPath = path.join(CORPUS_DIR, version, `${drugSafe}_objects.json`);
  
  if (!fs.existsSync(objectsPath)) return [];
  
  const objects = JSON.parse(fs.readFileSync(objectsPath, 'utf-8'));
  
  // Extract raw event data, parsing JSON strings if needed
  return objects.map(obj => {
    if (!obj.content) return null;
    if (typeof obj.content === 'string') {
      try {
        return JSON.parse(obj.content);
      } catch (e) {
        return null;
      }
    }
    return obj.content;
  }).filter(Boolean);
}

// ============================================
// Reaction Filter
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
  
  const events = loadRawEvents(drugName);
  if (events.length === 0) {
    return { status: 'ERROR', error: `No data for drug: ${drugName}` };
  }
  
  const filtered = events.filter(event => {
    const reactions = event.patient?.reaction || [];
    return reactions.some(r => 
      r.reactionmeddrapt?.toLowerCase() === reactionName.toLowerCase()
    );
  });
  
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
  
  const queryHash = crypto.createHash('sha256')
    .update(JSON.stringify({ drug: drugName, reaction: reactionName, version }))
    .digest('hex');
  
  const resultHash = crypto.createHash('sha256')
    .update(JSON.stringify({ filtered_count: filtered.length, reports: reports.slice(0, 10) }))
    .digest('hex');
  
  const decision = generateEVEDecisionID('EvidenceFilterDecision', queryHash, resultHash, version);
  
  return {
    status: 'VERIFIED',
    eve_decision_id: decision.eve_decision_id,
    filter_type: 'REACTION',
    drug: drugName,
    reaction: reactionName,
    corpus: {
      version: version,
      root_hash: proof.root_hash
    },
    results: {
      total_events_in_corpus: events.length,
      filtered_count: filtered.length,
      reports: reports
    },
    verification: {
      query_hash: queryHash,
      result_hash: resultHash,
      context_hash: decision.context_hash,
      governance: GOVERNANCE_VERSION,
      policy: POLICY_VERSION,
      reproducible: true
    },
    generation_mode: 'VERIFIED_DETERMINISTIC',
    disclaimer: DISCLAIMER.en,
    processing_time_ms: Date.now() - startTime
  };
}

// ============================================
// Query Processing
// ============================================

function processQuery(query, requestedVersion) {
  const startTime = Date.now();
  
  const version = requestedVersion || getLatestVersion();
  if (!version) {
    return { status: 'ERROR', error: 'No corpus available', generation_mode: 'NONE' };
  }
  
  const proof = loadProof(version);
  if (!proof) {
    return { status: 'ERROR', error: `No proof found for version ${version}`, generation_mode: 'NONE' };
  }
  
  const manifests = loadManifests(version);
  const queryLower = query.toLowerCase().trim();
  const knownDrugs = manifests.map(m => m.drug.toLowerCase());
  
  let matchedDrug = null;
  for (const drug of knownDrugs) {
    if (queryLower.includes(drug)) {
      matchedDrug = drug;
      break;
    }
  }
  
  if (!matchedDrug) {
    return {
      status: 'NO_MATCH',
      corpus_version: version,
      root_hash: proof.root_hash,
      message: `Query did not match any drug in corpus. Available: ${knownDrugs.join(', ')}`,
      available_drugs: knownDrugs,
      generation_mode: 'VERIFIED_DETERMINISTIC',
      disclaimer: DISCLAIMER.en,
      processing_time_ms: Date.now() - startTime
    };
  }
  
  const manifest = manifests.find(m => m.drug.toLowerCase() === matchedDrug);
  const objects = loadObjects(version, matchedDrug);
  const statsDoc = loadStats(version, matchedDrug);
  const metadata = loadDrugsMetadata(version);
  const drugMeta = metadata?.drugs?.[matchedDrug] || null;
  
  const citations = objects.slice(0, 10).map(obj => ({
    id: obj.id,
    hash: obj.content_hash.slice(0, 16) + '...',
    source: obj.source_type
  }));
  
  const queryHash = crypto.createHash('sha256')
    .update(JSON.stringify({ query: query, drug: matchedDrug, version: version }))
    .digest('hex');
  
  const resultHash = crypto.createHash('sha256')
    .update(JSON.stringify({ drug: matchedDrug, events: manifest.total_events, top_reactions: manifest.top_reactions }))
    .digest('hex');
  
  const decision = generateEVEDecisionID('EvidenceQueryDecision', queryHash, resultHash, version);
  
  return {
    status: 'VERIFIED',
    eve_decision_id: decision.eve_decision_id,
    drug: matchedDrug,
    atc_code: drugMeta?.atc_code || null,
    atc_name: drugMeta?.atc_name || null,
    corpus: {
      version: version,
      root_hash: proof.root_hash
    },
    summary: {
      total_events: manifest.total_events,
      total_in_fda: manifest.total_available,
      source: manifest.source,
      api_last_updated: manifest.api_last_updated,
      top_reactions: manifest.top_reactions.slice(0, 10)
    },
    citations: citations,
    citation_count: objects.length,
    stats: statsDoc ? statsDoc.stats : null,
    verification: {
      query_hash: queryHash,
      result_hash: resultHash,
      context_hash: decision.context_hash,
      governance: GOVERNANCE_VERSION,
      policy: POLICY_VERSION,
      reproducible: true
    },
    generation_mode: 'VERIFIED_DETERMINISTIC',
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  try {
    // GET /health
    if (req.method === 'GET' && url.pathname === '/health') {
      const version = getLatestVersion();
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'OK',
        service: 'EVE Medical Evidence',
        governance: GOVERNANCE_VERSION,
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
      
      const THERAPEUTIC_AREAS = {
        'A - Metabolism/Diabetes': ['metformin', 'insulin', 'glimepiride', 'sitagliptin', 'empagliflozin', 'liraglutide'],
        'C - Cardiovascular': ['atorvastatin', 'simvastatin', 'warfarin', 'apixaban', 'metoprolol', 'amlodipine', 'lisinopril'],
        'N - CNS/Psychiatry': ['sertraline', 'fluoxetine', 'escitalopram', 'venlafaxine', 'quetiapine', 'risperidone', 'diazepam'],
        'M - Pain/Inflammation': ['ibuprofen', 'aspirin', 'paracetamol', 'naproxen', 'diclofenac', 'tramadol'],
        'J - Anti-infectives': ['amoxicillin', 'ciprofloxacin', 'doxycycline', 'azithromycin', 'vancomycin'],
        'R - Respiratory/Allergy': ['salbutamol', 'budesonide', 'fluticasone', 'montelukast', 'cetirizine'],
      };
      
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
        governance: GOVERNANCE_VERSION,
        total_events: drugs.reduce((sum, d) => sum + d.events, 0),
        total_substances: drugs.length,
        therapeutic_areas: Object.keys(THERAPEUTIC_AREAS).length,
        drugs: drugs,
        proof_available: !!proof,
        disclaimer: DISCLAIMER.en
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
    
    // POST /query/reaction
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
    
    // POST /query/guided
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
      
      if (result.status === 'VERIFIED') {
        const decision = generateEVEDecisionID(
          'EvidenceQueryDecision',
          result.verification.query_hash,
          result.verification.result_hash,
          result.corpus_version
        );
        result.eve_decision_id = decision.eve_decision_id;
        result.verification.context_hash = decision.context_hash;
        result.verification.governance = GOVERNANCE_VERSION;
        result.verification.policy = POLICY_VERSION;
      }
      
      res.writeHead(200);
      res.end(JSON.stringify(result, null, 2));
      return;
    }
    
    // POST /query/compare
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
      
      if (result.status === 'VERIFIED') {
        const decision = generateEVEDecisionID(
          'EvidenceComparisonDecision',
          result.verification.comparison_hash,
          result.verification.diff_hash,
          result.corpus_version
        );
        result.eve_decision_id = decision.eve_decision_id;
        result.verification.context_hash = decision.context_hash;
        result.verification.governance = GOVERNANCE_VERSION;
        result.verification.policy = POLICY_VERSION;
      }
      
      res.writeHead(200);
      res.end(JSON.stringify(result, null, 2));
      return;
    }
    
    // POST /query/natural
    if (req.method === 'POST' && url.pathname === '/query/natural') {
      const body = await parseBody(req);
      if (!body.question) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing required "question" field' }));
        return;
      }
      
      // Language: 'auto' (default) = LLM classifier, or explicit ISO code
      const language = body.lang || body.language || 'auto';
      const version = getLatestVersion();
      const manifests = version ? loadManifests(version) : [];
      const knownDrugs = manifests.map(m => m.drug.toLowerCase());
      
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
      
      if (result.status === 'VERIFIED') {
        const decision = generateEVEDecisionID(
          'EvidenceNarrativeDecision',
          result.verification.query_hash,
          result.verification.result_hash,
          result.corpus.version
        );
        result.eve_decision_id = decision.eve_decision_id;
        result.verification.context_hash = decision.context_hash;
        result.verification.governance = GOVERNANCE_VERSION;
        result.verification.policy = POLICY_VERSION;
        result.verification.trinity_levels = ['L2_parse', 'L1_query', 'L2_render'];
      }
      
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
  console.log('  EVE - Evidence & Verification Engine');
  console.log('  Medical Evidence API');
  console.log('  Patent: EVE-PAT-2026-001 | Governance: ' + GOVERNANCE_VERSION);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Server:   http://localhost:${PORT}`);
  console.log(`  Corpus:   ${getLatestVersion() || 'NOT FOUND'}`);
  console.log('');
  console.log('  Endpoints:');
  console.log('    GET  /health         - Service status');
  console.log('    GET  /corpus         - Available substances');
  console.log('    POST /query          - Basic query');
  console.log('    POST /query/guided   - Guided Evidence Query');
  console.log('    POST /query/natural  - Natural Language (Trinity)');
  console.log('    POST /query/compare  - Comparison Query');
  console.log('    GET  /proof/:v       - Merkle proof');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});
