#!/usr/bin/env npx ts-node
/**
 * scripts/prove-corpus.ts
 * 
 * Generate Merkle proofs for corpus
 * Patent Krav 1d, 4
 */

import { buildMerkleTree, createCorpusProof } from '../packages/verify/merkle';
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

function main() {
  const corpusDir = join(__dirname, '..', 'data', 'corpus');
  const proofsDir = join(__dirname, '..', 'data', 'proofs');
  
  console.log('═══════════════════════════════════════════════');
  console.log('  005 Medical Evidence - Proof Generation');
  console.log('═══════════════════════════════════════════════');
  
  // Ensure proofs directory exists
  if (!existsSync(proofsDir)) {
    mkdirSync(proofsDir, { recursive: true });
  }
  
  // Find latest corpus version
  const versions = readdirSync(corpusDir).filter(f => f.startsWith('v'));
  if (versions.length === 0) {
    console.log('❌ No corpus versions found. Run ingest first.');
    process.exit(1);
  }
  
  const latestVersion = versions.sort().reverse()[0];
  console.log(`  Latest version: ${latestVersion}`);
  
  // Load all items from corpus
  const versionDir = join(corpusDir, latestVersion);
  const files = readdirSync(versionDir).filter(f => f.endsWith('.json'));
  
  const allItems: string[] = [];
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(versionDir, file), 'utf-8'));
    if (data.objects) {
      for (const obj of data.objects) {
        allItems.push(obj.content_hash);
      }
    }
  }
  
  console.log(`  Items found: ${allItems.length}`);
  
  if (allItems.length === 0) {
    console.log('❌ No items in corpus');
    process.exit(1);
  }
  
  // Build Merkle tree and create proof
  console.log('  Building Merkle tree...');
  const proof = createCorpusProof(latestVersion, allItems);
  
  // Save proof
  const proofPath = join(proofsDir, `${latestVersion}.json`);
  writeFileSync(proofPath, JSON.stringify(proof, null, 2));
  
  console.log('');
  console.log('✅ Proof generated!');
  console.log(`   Version: ${proof.version}`);
  console.log(`   Root hash: ${proof.rootHash.slice(0, 16)}...`);
  console.log(`   Items: ${proof.itemCount}`);
  console.log(`   Output: ${proofPath}`);
  console.log('');
}

main();
