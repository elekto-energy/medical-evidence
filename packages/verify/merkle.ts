/**
 * packages/verify/merkle.ts
 * 
 * Merkle Tree Verification
 * Patent Krav 1d, 4
 * 
 * Enables verification of individual objects without
 * accessing the entire knowledge core.
 */

import { createHash } from 'crypto';

// ============================================
// Types
// ============================================

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  data?: string;  // Only leaf nodes have data
}

export interface MerkleProof {
  leaf: string;           // Hash of the item being verified
  root: string;           // Root hash of the tree
  path: Array<{
    hash: string;
    position: 'left' | 'right';
  }>;
}

// ============================================
// Hash Function
// ============================================

function hash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function hashPair(left: string, right: string): string {
  return hash(left + right);
}

// ============================================
// Build Merkle Tree
// ============================================

export function buildMerkleTree(items: string[]): MerkleNode {
  if (items.length === 0) {
    throw new Error('Cannot build Merkle tree from empty array');
  }
  
  // Create leaf nodes
  let nodes: MerkleNode[] = items.map(item => ({
    hash: hash(item),
    data: item,
  }));
  
  // Build tree bottom-up
  while (nodes.length > 1) {
    const nextLevel: MerkleNode[] = [];
    
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1] || left; // Duplicate last if odd
      
      nextLevel.push({
        hash: hashPair(left.hash, right.hash),
        left,
        right: nodes[i + 1] ? right : undefined,
      });
    }
    
    nodes = nextLevel;
  }
  
  return nodes[0];
}

// ============================================
// Generate Proof
// ============================================

export function generateProof(
  tree: MerkleNode,
  itemHash: string
): MerkleProof | null {
  const path: MerkleProof['path'] = [];
  
  function findPath(node: MerkleNode): boolean {
    // Check if this is the leaf we're looking for
    if (node.data !== undefined && node.hash === itemHash) {
      return true;
    }
    
    // Search left subtree
    if (node.left && findPath(node.left)) {
      if (node.right) {
        path.push({ hash: node.right.hash, position: 'right' });
      }
      return true;
    }
    
    // Search right subtree
    if (node.right && findPath(node.right)) {
      if (node.left) {
        path.push({ hash: node.left.hash, position: 'left' });
      }
      return true;
    }
    
    return false;
  }
  
  if (!findPath(tree)) {
    return null;
  }
  
  return {
    leaf: itemHash,
    root: tree.hash,
    path: path.reverse(),
  };
}

// ============================================
// Verify Proof (Offline capable - Krav 1d)
// ============================================

export function verifyProof(proof: MerkleProof): boolean {
  let currentHash = proof.leaf;
  
  for (const step of proof.path) {
    if (step.position === 'left') {
      currentHash = hashPair(step.hash, currentHash);
    } else {
      currentHash = hashPair(currentHash, step.hash);
    }
  }
  
  return currentHash === proof.root;
}

// ============================================
// Corpus Verification
// ============================================

export interface CorpusProof {
  version: string;
  rootHash: string;
  itemCount: number;
  timestamp: string;
  signature?: string;
}

export function createCorpusProof(
  version: string,
  items: string[]
): CorpusProof {
  const tree = buildMerkleTree(items);
  
  return {
    version,
    rootHash: tree.hash,
    itemCount: items.length,
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// Example Usage
// ============================================

if (require.main === module) {
  // Demo
  const items = [
    'FDA FAERS report 1',
    'FDA FAERS report 2',
    'FDA FAERS report 3',
    'Drug label SPL-001',
  ];
  
  console.log('Building Merkle tree...');
  const tree = buildMerkleTree(items);
  console.log(`Root hash: ${tree.hash}`);
  
  console.log('\nGenerating proof for item 2...');
  const itemHash = hash(items[1]);
  const proof = generateProof(tree, itemHash);
  
  if (proof) {
    console.log(`Leaf: ${proof.leaf.slice(0, 16)}...`);
    console.log(`Root: ${proof.root.slice(0, 16)}...`);
    console.log(`Path length: ${proof.path.length}`);
    
    console.log('\nVerifying proof (offline)...');
    const valid = verifyProof(proof);
    console.log(`Valid: ${valid ? '✅' : '❌'}`);
  }
}
