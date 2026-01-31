# EVE Learning Model — Offline-Safe Knowledge Accumulation

**Version:** v0.9.0-medical-evidence  
**Date:** 2026-01-31  
**Status:** GOVERNANCE DOCUMENT  
**Patent:** EVE-PAT-2026-001

---

## Core Principle

> **"EVE tränar inte modeller. EVE ackumulerar verifierad kunskap."**

This makes the system stable, traceable, and offline-compatible.

---

## What "Learning" Does NOT Mean in EVE

| Blocked | Reason |
|---------|--------|
| ❌ Update models autonomously | Breaks determinism |
| ❌ Change behavior based on users | Breaks governance |
| ❌ Draw own conclusions | Breaks witness mode |
| ❌ "Understand better" implicitly | Breaks auditability |

**EVE does not learn like traditional AI.**

---

## What "Learning" DOES Mean in EVE

EVE learns by **creating new verified artifacts**, not by changing its intelligence.

This is a fundamental difference from traditional AI.

---

## EVE's Learning Mechanisms

### 1. Snapshot Learning (Already Implemented)

Each time you:
- Ingest more data
- Run `build-stats`
- Run `prove-corpus`

...a new knowledge state is created:

```
Snapshot v20260131-01
Snapshot v20260301-01  (future)
Snapshot v20260415-01  (future)
```

EVE "learns" by:
- Having more snapshots to compare
- Seeing change over time

✅ **Perfectly offline-compatible.**

---

### 2. Evidence Artifact Learning (The Key)

When you run:
- `/query/compare`
- `/query/natural`
- Future diffs

...the result can be saved as an Evidence Artifact:

```json
{
  "type": "EVIDENCE_COMPARE",
  "snapshot": "v20260131-01",
  "A": { "drug": "metformin", "age_group": "65-84" },
  "B": { "drug": "metformin", "age_group": "18-40" },
  "delta": { "reactions": [...] },
  "hash": "8641eac93a68...",
  "approved_by": "Joakim",
  "timestamp": "2026-01-31"
}
```

This means:
- The system "knows" this comparison exists
- It can be reused
- It can be verified
- It can be referenced offline

✅ **EVE learns which questions are important, not the answers.**

---

### 3. Pattern Library (Offline Intelligence)

Over time, build a library of approved patterns:

| Pattern | Example |
|---------|---------|
| Age comparison | "Age > 65 compared against 18-40" |
| Seriousness filter | "Almost always relevant" |
| Outcome usage | "Used in regulatory prep" |

This is:
- Metadata
- Not statistics
- Not conclusions

**Claude (online):** Can suggest new patterns  
**EVE (offline):** Can use already approved patterns

---

### 4. Trinity Offline Mode

| Component | Offline |
|-----------|---------|
| Guided Query | ✅ |
| Compare Query | ✅ |
| Snapshot Diff | ✅ |
| Evidence Artifacts | ✅ |
| Hash verification | ✅ |
| Claude / LLM | ❌ |

But:
- Previously approved prompts
- Previously approved artifacts
- Previously approved comparisons

...are still available.

✅ **Offline = replay + compare, not generate new.**

---

## Legal & Technical Compliance

EVE can always state:

> "I used knowledge that was approved at timestamp X."

This is:
- Gold for regulators
- Gold for QA
- Gold for legal proceedings

**No black box learning. No unclear evolution.**

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  ONLINE MODE                                                │
│                                                             │
│  Claude L2 ───► Suggest patterns, parse questions           │
│       │                                                     │
│       ▼                                                     │
│  EVE L1 ─────► Execute queries, create artifacts            │
│       │                                                     │
│       ▼                                                     │
│  X-Vault ────► Seal, hash, approve                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ARTIFACT STORE (Persistent, Offline-Safe)                  │
│                                                             │
│  ├── snapshots/                                             │
│  │   ├── v20260131-01/                                      │
│  │   └── v20260301-01/                                      │
│  │                                                          │
│  ├── artifacts/                                             │
│  │   ├── compare_001.json                                   │
│  │   ├── compare_002.json                                   │
│  │   └── ...                                                │
│  │                                                          │
│  └── patterns/                                              │
│      ├── approved_patterns.json                             │
│      └── pattern_index.json                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  OFFLINE MODE                                               │
│                                                             │
│  ✅ Replay approved artifacts                               │
│  ✅ Compare snapshots                                       │
│  ✅ Verify hashes                                           │
│  ✅ Use approved patterns                                   │
│  ❌ Generate new LLM responses                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Meeting-Friendly Summary

> "EVE doesn't train models. EVE accumulates verified knowledge.  
> That makes the system stable, traceable, and offline-compatible."

**This is a killer sentence for investors and regulators.**

---

## What We're Building (Not Traditional AI)

| Traditional AI | EVE |
|----------------|-----|
| Learns implicitly | Learns through artifacts |
| Black box | Fully auditable |
| Requires connectivity | Works offline |
| Evolves unpredictably | Evolves through governance |
| "Gets smarter" | "Accumulates knowledge" |

---

## Implementation Roadmap

| Priority | Task | Status |
|----------|------|--------|
| 1 | Document EVE Learning Model | ✅ This document |
| 2 | Evidence Artifact Store (JSON + index) | 🔲 Next |
| 3 | Offline Mode flag in API | 🔲 Future |
| 4 | Pattern Library structure | 🔲 Future |

---

## Conclusion

> **"A system that becomes smarter without becoming more dangerous."**

This is exactly what the market lacks.

---

**Patent:** EVE-PAT-2026-001  
**Company:** Organiq Sweden AB  
**Author:** Joakim Eklund

*This document is part of the v0.9.0-medical-evidence release.*
