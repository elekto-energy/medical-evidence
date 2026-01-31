/**
 * packages/shared/types.ts
 * 
 * Core types for Medical Evidence Platform
 * Patent Krav 19: Mandatory metadata structure
 */

// ============================================
// Generation Modes (Patent Krav 1e)
// ============================================

export type GenerationMode = 
  | 'VERIFIED_DETERMINISTIC'  // Level 1: Template-based
  | 'LOCAL_LLM_UNVERIFIED'    // Level 2: Local Qwen
  | 'EXTERNAL_LLM_UNVERIFIED' // Level 3: External Claude
  ;

export type VerificationStatus = 
  | 'VERIFIED'
  | 'UNVERIFIED'
  ;

// ============================================
// Knowledge Objects (Patent Krav 1a)
// ============================================

export interface KnowledgeObject {
  id: string;                    // UUID
  version: string;               // e.g., "v20250131-01"
  content: string;               // Actual content
  content_hash: string;          // SHA-256(content)
  source_uri: string;            // e.g., "https://api.fda.gov/..."
  timestamp: string;             // ISO-8601
  author_id: string;             // Who added this
  parent_version: string | null; // For versioning
  signature?: string;            // Ed25519 optional
}

// ============================================
// API Response (Patent Krav 19)
// ============================================

export interface Citation {
  source: string;        // e.g., "FDA FAERS"
  document_id: string;   // Reference to KnowledgeObject.id
  fragment: string;      // Cited text
  url?: string;          // Original source URL
}

export interface ResponseMetadata {
  generation_mode: GenerationMode;
  verification_status: VerificationStatus;
  corpus_version: string;
  proof_hash: string;              // SHA-256 of response
  search_terms_extracted: string[]; // From dual-LLM instance 1
  timestamp: string;               // ISO-8601
  trinity_level: 1 | 2 | 3;
  processing_time_ms: number;
}

export interface MedicalEvidenceResponse {
  answer: string;
  citations: Citation[];
  metadata: ResponseMetadata;
  disclaimer: string;
}

// ============================================
// Disclaimer (mandatory)
// ============================================

export const DISCLAIMER_SV = 
  '⚠️ Detta är rapporterad data, inte medicinsk rådgivning. ' +
  'Konsultera alltid kvalificerad vårdpersonal för medicinska beslut.';

export const DISCLAIMER_EN = 
  '⚠️ This is reported data, not medical advice. ' +
  'Always consult qualified healthcare professionals for medical decisions.';

// ============================================
// Query Request
// ============================================

export interface QueryRequest {
  query: string;
  language?: 'sv' | 'en';
  corpus_version?: string;  // Lock to specific version
  max_citations?: number;
}

// ============================================
// Proof Record (Patent Krav 1d)
// ============================================

export interface ProofRecord {
  id: string;
  timestamp: string;
  corpus_version: string;
  root_hash: string;           // Merkle root
  response_hash: string;
  query_hash: string;
  signature?: string;
}

// ============================================
// Authorization (Patent Krav 1c)
// ============================================

export interface AuthorizationRecord {
  action: 'corpus_update' | 'corpus_delete' | 'config_change';
  user_id: string;
  timestamp: string;
  change_hash: string;
  previous_version: string;
  new_version: string;
  authorization_method: 'manual_confirmation';
  details?: string;
}
