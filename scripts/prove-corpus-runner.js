/**
 * scripts/prove-corpus-runner.js
 * 
 * Generate Merkle proofs for corpus
 * Patent Krav 1d, 4: Offline verification
 * 
 * Run with: node scripts/prove-corpus-runner.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================
// Merkle Tree Functions
// ============================================

function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hashPair(left, right) {
  return hash(left + right);
}

function buildMerkleTree(items) {
  if (items.length === 0) {
    throw new Error('Cannot build Merkle tree from empty array');
  }
  
  // Create leaf hashes
  let level = items.map(item => hash(item));
  const layers = [level];
  
  // Build tree bottom-up
  while (level.length > 1) {
    const nextLevel = [];
    
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left;
      nextLevel.push(hashPair(left, right));
    }
    
    level = nextLevel;
    layers.push(level);
  }
  
  return {
    root: level[0],
    layers: layers,
    leafCount: items.length,
  };
}

// ============================================
// Main
// ============================================

function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  005 Medical Evidence - Proof Generation');
  console.log('  Patent Krav 1d, 4: Merkle Tree Verification');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  const corpusDir = path.join(__dirname, '..', 'data', 'corpus');
  const proofsDir = path.join(__dirname, '..', 'data', 'proofs');
  
  // Find versions
  if (!fs.existsSync(corpusDir)) {
    console.error('❌ No corpus directory found. Run ingest first.');
    process.exit(1);
  }
  
  const versions = fs.readdirSync(corpusDir)
    .filter(f => f.startsWith('v') && fs.statSync(path.join(corpusDir, f)).isDirectory())
    .sort()
    .reverse();
  
  if (versions.length === 0) {
    console.error('❌ No corpus versions found. Run ingest first.');
    process.exit(1);
  }
  
  const latestVersion = versions[0];
  console.log(`[1/4] Found ${versions.length} version(s)`);
  console.log(`      Latest: ${latestVersion}`);
  
  // Load all objects from latest version
  console.log('[2/4] Loading knowledge objects...');
  const versionDir = path.join(corpusDir, latestVersion);
  const objectFiles = fs.readdirSync(versionDir)
    .filter(f => f.endsWith('_objects.json'));
  
  const allHashes = [];
  const manifests = [];
  
  objectFiles.forEach(file => {
    const objects = JSON.parse(fs.readFileSync(path.join(versionDir, file), 'utf-8'));
    objects.forEach(obj => {
      allHashes.push(obj.content_hash);
    });
    
    // Load corresponding manifest
    const manifestFile = file.replace('_objects.json', '_manifest.json');
    if (fs.existsSync(path.join(versionDir, manifestFile))) {
      manifests.push(JSON.parse(fs.readFileSync(path.join(versionDir, manifestFile), 'utf-8')));
    }
  });
  
  console.log(`      Loaded ${allHashes.length} objects from ${objectFiles.length} file(s)`);
  
  if (allHashes.length === 0) {
    console.error('❌ No objects found in corpus');
    process.exit(1);
  }
  
  // Build Merkle tree
  console.log('[3/4] Building Merkle tree...');
  const tree = buildMerkleTree(allHashes);
  
  // Create proof record
  const proof = {
    version: latestVersion,
    created_at: new Date().toISOString(),
    root_hash: tree.root,
    leaf_count: tree.leafCount,
    tree_depth: tree.layers.length,
    algorithm: 'SHA-256',
    sources: manifests.map(m => ({
      drug: m.drug,
      events: m.total_events,
      source: m.source,
    })),
    verification_instructions: {
      description: 'To verify a single object offline:',
      steps: [
        '1. Hash the object content with SHA-256',
        '2. Find the leaf in the tree',
        '3. Follow the path to root, hashing pairs',
        '4. Compare final hash with root_hash',
      ],
    },
  };
  
  // Save proof
  console.log('[4/4] Saving proof...');
  if (!fs.existsSync(proofsDir)) {
    fs.mkdirSync(proofsDir, { recursive: true });
  }
  
  const proofPath = path.join(proofsDir, `${latestVersion}_proof.json`);
  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
  
  // Print summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PROOF GENERATED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Version:    ${proof.version}`);
  console.log(`  Root hash:  ${proof.root_hash.slice(0, 32)}...`);
  console.log(`  Objects:    ${proof.leaf_count}`);
  console.log(`  Tree depth: ${proof.tree_depth}`);
  console.log('');
  console.log('  Sources:');
  proof.sources.forEach(s => {
    console.log(`    - ${s.drug}: ${s.events} events from ${s.source}`);
  });
  console.log('');
  console.log(`  Proof saved: data/proofs/${latestVersion}_proof.json`);
  console.log('');
  console.log('  This proof enables offline verification (Patent Krav 1d)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
}

main();
