#!/usr/bin/env npx ts-node
/**
 * scripts/ingest-openfda.ts
 * 
 * CLI script to ingest data from OpenFDA
 * 
 * Usage:
 *   pnpm run ingest:openfda metformin
 *   pnpm run ingest:openfda ibuprofen 500
 */

import { ingestDrugData } from '../packages/ingest/openfda';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

async function main() {
  const drugName = process.argv[2] || 'metformin';
  const limit = parseInt(process.argv[3] || '100', 10);
  
  // Generate version ID
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const version = `v${today}-01`;
  
  console.log('═══════════════════════════════════════════════');
  console.log('  005 Medical Evidence - OpenFDA Ingestion');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Drug: ${drugName}`);
  console.log(`  Limit: ${limit}`);
  console.log(`  Version: ${version}`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
  
  try {
    // Run ingestion
    const result = await ingestDrugData(drugName, version, 'cli-ingest', limit);
    
    // Create corpus directory
    const corpusDir = join(__dirname, '..', 'data', 'corpus', version);
    if (!existsSync(corpusDir)) {
      mkdirSync(corpusDir, { recursive: true });
    }
    
    // Save objects
    const outputPath = join(corpusDir, `${drugName}.json`);
    writeFileSync(outputPath, JSON.stringify({
      summary: result.summary,
      objects: result.objects,
    }, null, 2));
    
    console.log('');
    console.log('✅ Ingestion complete!');
    console.log(`   Records: ${result.objects.length}`);
    console.log(`   Output: ${outputPath}`);
    console.log('');
    
    // Next steps
    console.log('Next steps:');
    console.log('  1. pnpm run prove:latest    # Generate proofs');
    console.log('  2. pnpm run dev:api         # Start API server');
    console.log('');
    
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  }
}

main();
