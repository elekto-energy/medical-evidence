# 005 Medical Evidence

## EVE-Powered Medical Evidence Platform

**Patent Pending:** EVE-PAT-2026-001 (PRV 2026-01-13)

---

## 🎯 Vision

AI-powered medical evidence lookup with **zero hallucination guarantee**.

Every response is:
- Traceable to FDA/EMA sources
- Cryptographically verified
- Version-locked to corpus snapshot
- Marked with generation mode (DETERMINISTIC / LLM_UNVERIFIED)

**This is NOT medical advice. This is verified evidence.**

---

## 🏗️ Architecture (Patent Implementation)

```
┌─────────────────────────────────────────────────────────┐
│                    User Query                           │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│              TRINITY PIPELINE (Krav 1e)                 │
│  ┌─────────────┬─────────────┬─────────────┐           │
│  │   Level 1   │   Level 2   │   Level 3   │           │
│  │ Deterministic│  Local LLM  │ External LLM│           │
│  │   Factory   │   (Qwen)    │  (Claude)   │           │
│  │   ~0.1ms    │   ~500ms    │  ~2000ms    │           │
│  │  VERIFIED   │ UNVERIFIED  │ UNVERIFIED  │           │
│  └─────────────┴─────────────┴─────────────┘           │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│              WITNESS LAYER (Krav 1b, 2)                 │
│  • AI can ONLY observe, cite, summarize                 │
│  • AI CANNOT recommend, decide, create                  │
│  • Blocked phrases: "jag rekommenderar", "du bör"       │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│         DETERMINISTIC KNOWLEDGE CORE (Krav 1a)          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Corpus: FDA FAERS, Drug Labels, EMA Data       │   │
│  │  Version: v20250131-01                          │   │
│  │  Root Hash: SHA-256(...)                        │   │
│  │  Immutable: Yes                                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│           VERIFICATION LAYER (Krav 1d, 4)               │
│  • Merkle tree for individual object verification       │
│  • Offline verification package                         │
│  • Proof chain for audit                                │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
005_medical_evidence/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Fastify API server
│
├── packages/
│   ├── core/                # Deterministic knowledge core (Krav 1a)
│   ├── witness/             # Witness-mode layer (Krav 1b)
│   ├── auth/                # Authorization module (Krav 1c)
│   ├── verify/              # Verification layer (Krav 1d)
│   ├── trinity/             # Hierarchical pipeline (Krav 1e)
│   ├── templates/           # Deterministic factories (Krav 13)
│   ├── dual-llm/            # Two-instance LLM (Krav 17)
│   ├── ingest/              # Data ingestion (OpenFDA, EMA)
│   ├── store/               # Storage adapters
│   └── shared/              # Types, utils, constants
│
├── data/
│   ├── corpus/              # Immutable versioned snapshots
│   ├── proofs/              # Cryptographic proofs
│   ├── sources/             # Raw data cache
│   └── lineage/             # Data transformation audit
│
├── scripts/                 # CLI tools
├── tests/                   # Golden tests + regression
└── docs/                    # Specifications
```

---

## 🔒 Patent Claims Implemented

| Claim | Description | Package |
|-------|-------------|---------|
| 1a | Deterministic knowledge core | `packages/core/` |
| 1b | AI in witness mode | `packages/witness/` |
| 1c | Authorization module | `packages/auth/` |
| 1d | Verification layer | `packages/verify/` |
| 1e | Trinity pipeline | `packages/trinity/` |
| 2 | One-way data channel | `packages/witness/channel/` |
| 4 | Merkle tree verification | `packages/verify/merkle/` |
| 13 | Template-based generation | `packages/templates/` |
| 17-18 | Dual-LLM isolation | `packages/dual-llm/` |
| 19 | Mandatory metadata | All API responses |
| 20 | Blocked recommendation phrases | `packages/witness/blocklist/` |

---

## 🚀 Quick Start

```bash
# Ingest OpenFDA data
pnpm run ingest:openfda

# Build corpus snapshot
pnpm run corpus:build

# Generate proofs
pnpm run prove:latest

# Start API
pnpm run dev:api

# Start Web
pnpm run dev:web
```

---

## 📋 API Response Format (Krav 19)

Every response includes mandatory metadata:

```json
{
  "answer": "Metformin har 12,345 rapporterade biverkningar i FAERS...",
  "citations": [
    {
      "source": "FDA FAERS",
      "document_id": "faers-2024-q4-metformin",
      "fragment": "..."
    }
  ],
  "metadata": {
    "generation_mode": "DETERMINISTIC",
    "verification_status": "VERIFIED",
    "corpus_version": "v20250131-01",
    "proof_hash": "sha256:abc123...",
    "search_terms_extracted": ["metformin", "adverse events"],
    "timestamp": "2025-01-31T12:00:00Z"
  },
  "disclaimer": "⚠️ Detta är rapporterad data från FDA FAERS, inte medicinsk rådgivning. Konsultera alltid kvalificerad vårdpersonal."
}
```

---

## ⚖️ Legal

**Patent Pending:** System och metod för evidensbaserad AI-assistans med vittnesbegränsad arkitektur, hierarkisk LLM-eskalering och kryptografisk verifiering

**Applicant:** Joakim Eklund / Organiq Sweden AB  
**Filing Date:** 2026-01-13  
**Reference:** EVE-PAT-2026-001

---

© 2025-2026 Organiq Sweden AB. All rights reserved.
