/**
 * packages/ingest/openfda.ts
 * 
 * OpenFDA Data Ingestion
 * First data source for Medical Evidence Platform
 */

import { KnowledgeObject } from '../shared/types';
import { createHash } from 'crypto';

// ============================================
// OpenFDA Endpoints
// ============================================

const OPENFDA_BASE = 'https://api.fda.gov';

export const ENDPOINTS = {
  DRUG_EVENT: `${OPENFDA_BASE}/drug/event.json`,      // FAERS adverse events
  DRUG_LABEL: `${OPENFDA_BASE}/drug/label.json`,      // Drug labels (SPL)
  DRUG_NDC: `${OPENFDA_BASE}/drug/ndc.json`,          // Product codes
  DEVICE_EVENT: `${OPENFDA_BASE}/device/event.json`,  // Device incidents
  FOOD_RECALL: `${OPENFDA_BASE}/food/recall.json`,    // Food recalls
} as const;

// ============================================
// Types
// ============================================

export interface OpenFDAResponse<T> {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: T[];
}

export interface DrugEvent {
  safetyreportid: string;
  receivedate: string;
  serious: string;
  patient: {
    drug: Array<{
      medicinalproduct: string;
      drugindication?: string;
    }>;
    reaction: Array<{
      reactionmeddrapt: string;
      reactionoutcome?: string;
    }>;
  };
}

// ============================================
// Ingestion Functions
// ============================================

export async function fetchDrugEvents(
  drugName: string,
  limit: number = 100
): Promise<DrugEvent[]> {
  const url = new URL(ENDPOINTS.DRUG_EVENT);
  url.searchParams.set('search', `patient.drug.medicinalproduct:"${drugName}"`);
  url.searchParams.set('limit', limit.toString());
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`OpenFDA API error: ${response.status}`);
  }
  
  const data: OpenFDAResponse<DrugEvent> = await response.json();
  return data.results;
}

/**
 * Transform OpenFDA data to KnowledgeObject
 */
export function transformToKnowledgeObject(
  event: DrugEvent,
  version: string,
  authorId: string
): KnowledgeObject {
  const content = JSON.stringify(event, null, 2);
  const contentHash = createHash('sha256').update(content).digest('hex');
  
  return {
    id: `openfda-${event.safetyreportid}`,
    version,
    content,
    content_hash: contentHash,
    source_uri: `${ENDPOINTS.DRUG_EVENT}?search=safetyreportid:${event.safetyreportid}`,
    timestamp: new Date().toISOString(),
    author_id: authorId,
    parent_version: null,
  };
}

/**
 * Full ingestion pipeline for a drug
 */
export async function ingestDrugData(
  drugName: string,
  version: string,
  authorId: string,
  limit: number = 1000
): Promise<{
  objects: KnowledgeObject[];
  summary: {
    drug: string;
    total_events: number;
    ingested_at: string;
    version: string;
  };
}> {
  console.log(`[ingest] Fetching ${drugName} from OpenFDA...`);
  
  const events = await fetchDrugEvents(drugName, limit);
  
  console.log(`[ingest] Found ${events.length} events`);
  
  const objects = events.map(event => 
    transformToKnowledgeObject(event, version, authorId)
  );
  
  return {
    objects,
    summary: {
      drug: drugName,
      total_events: events.length,
      ingested_at: new Date().toISOString(),
      version,
    },
  };
}

// ============================================
// CLI Entry Point
// ============================================

if (require.main === module) {
  const drug = process.argv[2] || 'metformin';
  const version = `v${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`;
  
  ingestDrugData(drug, version, 'cli-ingest')
    .then(result => {
      console.log(`\n✅ Ingested ${result.objects.length} records`);
      console.log(`Version: ${result.summary.version}`);
    })
    .catch(err => {
      console.error('❌ Ingestion failed:', err.message);
      process.exit(1);
    });
}
