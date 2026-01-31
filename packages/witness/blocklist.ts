/**
 * packages/witness/blocklist.ts
 * 
 * Patent Krav 20: Blockera rekommendationsfraser
 * 
 * AI-komponenten är tekniskt förhindrad från att generera
 * output innehållande dessa fraser.
 */

export const BLOCKED_PHRASES_SV = [
  'jag rekommenderar',
  'du bör',
  'det är tillrådligt',
  'min rekommendation är',
  'jag föreslår att du',
  'ta detta läkemedel',
  'sluta ta',
  'öka dosen',
  'minska dosen',
  'byt till',
  'prova istället',
] as const;

export const BLOCKED_PHRASES_EN = [
  'i recommend',
  'you should',
  'it is advisable',
  'my recommendation is',
  'i suggest you',
  'take this medication',
  'stop taking',
  'increase the dose',
  'decrease the dose',
  'switch to',
  'try instead',
] as const;

export const ALL_BLOCKED_PHRASES = [
  ...BLOCKED_PHRASES_SV,
  ...BLOCKED_PHRASES_EN,
] as const;

/**
 * Check if text contains any blocked phrases
 * @returns Array of found blocked phrases, empty if clean
 */
export function findBlockedPhrases(text: string): string[] {
  const lowerText = text.toLowerCase();
  return ALL_BLOCKED_PHRASES.filter(phrase => 
    lowerText.includes(phrase.toLowerCase())
  );
}

/**
 * Validate output and throw if blocked phrases found
 * @throws Error with list of blocked phrases
 */
export function validateWitnessOutput(text: string): void {
  const blocked = findBlockedPhrases(text);
  if (blocked.length > 0) {
    throw new WitnessViolationError(
      `Output contains blocked phrases: ${blocked.join(', ')}`,
      blocked
    );
  }
}

export class WitnessViolationError extends Error {
  constructor(
    message: string,
    public readonly blockedPhrases: string[]
  ) {
    super(message);
    this.name = 'WitnessViolationError';
  }
}
