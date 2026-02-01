/**
 * scripts/fetch-structures.js
 * 
 * Fetches molecular structures from PubChem and creates a deterministic corpus.
 * Run: node scripts/fetch-structures.js
 * 
 * Patent: EVE-PAT-2026-001
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const DRUG_CIDS = {
  'metformin': 4091,
  'insulin': 16129672,
  'glimepiride': 3476,
  'sitagliptin': 4369359,
  'empagliflozin': 11949646,
  'liraglutide': 16134956,
  'atorvastatin': 60823,
  'simvastatin': 54454,
  'warfarin': 54678486,
  'apixaban': 10182969,
  'metoprolol': 4171,
  'amlodipine': 2162,
  'lisinopril': 5362119,
  'sertraline': 68617,
  'fluoxetine': 3386,
  'escitalopram': 146570,
  'venlafaxine': 5656,
  'quetiapine': 5002,
  'risperidone': 5073,
  'diazepam': 3016,
  'ibuprofen': 3672,
  'aspirin': 2244,
  'paracetamol': 1983,
  'naproxen': 156391,
  'diclofenac': 3033,
  'tramadol': 33741,
  'amoxicillin': 33613,
  'ciprofloxacin': 2764,
  'doxycycline': 54671203,
  'azithromycin': 447043,
  'vancomycin': 14969,
  'salbutamol': 2083,
  'budesonide': 5281004,
  'fluticasone': 444036,
  'montelukast': 5281040,
  'cetirizine': 2678,
};

const CORPUS_VERSION = 'v20260131-01';
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'corpus', CORPUS_VERSION, 'structures');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function fetchSDF(drug, cid) {
  const url3d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`;
  const url2d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF`;
  
  try {
    console.log(`  Trying 3D...`);
    const sdf = await fetchUrl(url3d);
    return { sdf, type: '3d' };
  } catch (err) {
    console.log(`  3D not available, trying 2D...`);
    const sdf = await fetchUrl(url2d);
    return { sdf, type: '2d' };
  }
}

async function main() {
  console.log('EVE Structure Fetcher');
  console.log('Corpus:', CORPUS_VERSION);
  console.log('');
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created: ${OUTPUT_DIR}`);
  }
  
  const manifest = {
    corpus_version: CORPUS_VERSION,
    generated_at: new Date().toISOString(),
    source: 'PubChem',
    structures: []
  };
  
  const drugs = Object.entries(DRUG_CIDS);
  
  for (let i = 0; i < drugs.length; i++) {
    const [drug, cid] = drugs[i];
    console.log(`[${i + 1}/${drugs.length}] ${drug} (CID: ${cid})`);
    
    try {
      const { sdf, type } = await fetchSDF(drug, cid);
      const filename = `${drug}_${cid}.sdf`;
      const filepath = path.join(OUTPUT_DIR, filename);
      const hash = sha256(sdf);
      
      fs.writeFileSync(filepath, sdf);
      manifest.structures.push({ drug, cid, file: filename, structure_type: type, sha256: hash });
      console.log(`  OK: ${filename} (${type})`);
      
      await new Promise(r => setTimeout(r, 250));
    } catch (err) {
      console.log(`  FAILED: ${err.message}`);
    }
  }
  
  const manifestPath = path.join(OUTPUT_DIR, '..', 'structures_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest: ${manifestPath}`);
  console.log(`Total: ${manifest.structures.length} structures`);
}

main().catch(console.error);
