# Medical Evidence Platform — Technical Note

**Version:** v0.9.0-medical-evidence  
**Date:** 2026-01-31  
**Status:** VERIFIED & LOCKED  
**Patent:** EVE-PAT-2026-001 (Witness Mode AI Architecture)

---

## What This System Does

Medical Evidence is a **verifiable adverse event query platform** built on FDA FAERS data.

It allows users to:
- Query adverse event reports by drug, demographics, and seriousness
- Compare populations (e.g., women 65+ vs women 18-40)
- Ask natural language questions and receive cited, reproducible answers

**All responses are deterministic, hash-verified, and reproducible.**

---

## What This System Does NOT Do

| Blocked | Reason |
|---------|--------|
| ❌ Risk assessment | Requires clinical judgment |
| ❌ Safety conclusions | Requires causal inference |
| ❌ Medical recommendations | Requires licensed expertise |
| ❌ Causal inference | Data is observational |
| ❌ Words: "safer", "more dangerous", "risk" | Policy-blocked |

**The system shows DELTA, not CONCLUSIONS.**

---

## Trinity Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  USER QUESTION                                              │
│  "Vilka biverkningar är vanligast för metformin hos        │
│   kvinnor över 65?"                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  CLAUDE L2 — PARSER                                         │
│                                                             │
│  Input:  Natural language question                          │
│  Output: { drug: "metformin", sex: "Female",               │
│            age_group: "65-84" }                             │
│                                                             │
│  ✅ Translates language → parameters                        │
│  ❌ Does NOT interpret medical meaning                      │
│  ❌ Does NOT generate answers                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  EVE L1 — DETERMINISTIC QUERY ENGINE                        │
│                                                             │
│  • Filters verified corpus                                  │
│  • Counts, aggregates, computes percentages                 │
│  • Generates SHA-256 hashes for reproducibility             │
│  • Returns structured evidence with proof reference         │
│                                                             │
│  ✅ 100% deterministic                                      │
│  ✅ Same input → same output (always)                       │
│  ✅ Hash-verified and auditable                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  CLAUDE L2 — RENDERER                                       │
│                                                             │
│  Input:  EVE's verified results (numbers, percentages)     │
│  Output: Human-readable text with citations                 │
│                                                             │
│  ✅ Formats EVE data → readable Swedish/English             │
│  ✅ Includes hash references and disclaimers                │
│  ❌ Does NOT add external knowledge                         │
│  ❌ Does NOT interpret or recommend                         │
└─────────────────────────────────────────────────────────────┘
```

**Core Principle:** Claude is a TRANSLATOR, never an EXPERT.

---

## API Endpoints

| Endpoint | Level | Description |
|----------|-------|-------------|
| `GET /health` | L1 | Service status |
| `GET /corpus` | L1 | List all substances + metadata |
| `POST /query/guided` | L1 | Deterministic query with parameters |
| `POST /query/compare` | L1 | Compare two populations (delta) |
| `POST /query/natural` | L2 | Natural language → Trinity Pipeline |
| `GET /proof/:version` | L1 | Merkle proof for verification |

---

## Corpus Statistics (v20260131-01)

| Metric | Value |
|--------|-------|
| Total events | 18,000 |
| Substances | 36 |
| Therapeutic areas | 6 |
| Root hash | `ec5727564d1ed19be5b08b26d3866f446b12d3d388f5a8cd713332c6d97ad264` |

---

## Verification Model

Every response includes:

```json
{
  "verification": {
    "query_hash": "ddd8af82...",
    "result_hash": "a22cf62c...",
    "reproducible": true,
    "note": "Same query parameters will always produce same results from same corpus version"
  }
}
```

**Reproducibility guarantee:** Anyone with the same corpus version and query parameters will get identical results.

---

## Regulatory Alignment

This system is designed for:
- **Pharmacovigilance screening** (signal exploration)
- **Internal QA** (compliance teams)
- **Regulatory preparation** (audit trails)
- **Medical affairs** (internal research)

It is NOT designed for:
- Clinical decision support
- Patient-facing advice
- Risk quantification
- Regulatory submissions (without human review)

---

## Patent Claims Implemented

| Claim | Implementation |
|-------|----------------|
| 5 | Trinity Pipeline (L2 → L1 → L2) |
| 17 | Witness Mode (AI observes, never decides) |
| 19 | Evidence-based response with citations |
| 20 | Blocked phrases enforcement |

---

## Security Model

```
Claude does:
  ✅ Parse language → parameters
  ✅ Format data → readable text
  ✅ Cite sources and hashes

Claude does NOT:
  ❌ Interpret medical risk
  ❌ Give advice or recommendations
  ❌ Use external knowledge
  ❌ Make decisions
```

**"AI may propose and challenge — never decide."**

---

## Contact

**Company:** Organiq Sweden AB  
**Founder & Chief Architect:** Joakim Eklund  
**Email:** joakim@organiq.se  
**Patent:** EVE-PAT-2026-001 (PRV 2026-01-13)

---

*This document is part of the v0.9.0-medical-evidence release.*
