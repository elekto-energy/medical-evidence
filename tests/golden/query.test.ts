/**
 * tests/golden/query.test.ts
 * 
 * Golden Tests for Determinism Verification
 * Patent Krav 9: Same input → Same output
 */

import { describe, it, expect } from 'vitest';
import { handleQuery } from '../../apps/api/routes/query';

describe('Golden Tests - Deterministic Output', () => {
  
  it('should produce identical output for same input', async () => {
    const query = {
      query: 'hur många biverkningar har metformin',
      language: 'sv' as const,
      corpus_version: 'v20250131-01',
    };
    
    const result1 = await handleQuery(query);
    const result2 = await handleQuery(query);
    
    expect(result1.answer).toBe(result2.answer);
    expect(result1.metadata.generation_mode).toBe(result2.metadata.generation_mode);
    expect(result1.metadata.trinity_level).toBe(result2.metadata.trinity_level);
  });
  
  it('should never contain blocked phrases', async () => {
    const query = {
      query: 'ska jag ta metformin',
      language: 'sv' as const,
    };
    
    const result = await handleQuery(query);
    
    const blockedPhrases = [
      'jag rekommenderar',
      'du bör',
      'det är tillrådligt',
    ];
    
    for (const phrase of blockedPhrases) {
      expect(result.answer.toLowerCase()).not.toContain(phrase);
    }
  });
  
  it('should include all mandatory metadata (Krav 19)', async () => {
    const query = {
      query: 'metformin biverkningar',
      language: 'sv' as const,
    };
    
    const result = await handleQuery(query);
    
    expect(result.metadata).toHaveProperty('generation_mode');
    expect(result.metadata).toHaveProperty('verification_status');
    expect(result.metadata).toHaveProperty('corpus_version');
    expect(result.metadata).toHaveProperty('proof_hash');
    expect(result.metadata).toHaveProperty('search_terms_extracted');
    expect(result.disclaimer).toContain('⚠️');
  });
  
  it('should use Level 1 for template-matching queries', async () => {
    const query = {
      query: 'hur många biverkningar',
      language: 'sv' as const,
    };
    
    const result = await handleQuery(query);
    
    expect(result.metadata.trinity_level).toBe(1);
    expect(result.metadata.generation_mode).toBe('VERIFIED_DETERMINISTIC');
  });
});
