# Architecture Overview

## Patent Implementation Map

```
EVE-PAT-2026-001 → 005_medical_evidence
═══════════════════════════════════════

Krav 1a  → packages/core/
Krav 1b  → packages/witness/
Krav 1c  → packages/auth/
Krav 1d  → packages/verify/
Krav 1e  → packages/trinity/
Krav 2   → packages/witness/channel/
Krav 4   → packages/verify/merkle/
Krav 13  → packages/templates/
Krav 17  → packages/dual-llm/
Krav 19  → All API responses
Krav 20  → packages/witness/blocklist/
```

## Data Flow

```
User Query
    │
    ▼
┌─────────────────────────────────────┐
│         apps/api                    │
│   POST /query                       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│      packages/dual-llm              │
│   Instance 1: Extract search terms  │
│   (CANNOT generate answers)         │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│      packages/core                  │
│   Retrieve from corpus              │
│   (Immutable, versioned)            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│      packages/trinity               │
│   Level 1: Template match?          │
│   Level 2: Local LLM?               │
│   Level 3: External LLM?            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│      packages/witness               │
│   Block forbidden phrases           │
│   Add mandatory metadata            │
│   Add disclaimer                    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│      packages/verify                │
│   Hash response                     │
│   Create proof record               │
└─────────────────────────────────────┘
    │
    ▼
Response with full audit trail
```

## Package Dependencies

```
shared (types, utils)
   ↑
core ← store
   ↑
witness ← verify
   ↑
trinity ← dual-llm
   ↑
ingest
   ↑
apps/api ← apps/web
```
