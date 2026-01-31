# EVE Medical Demo - Snapshot v20260131-01

## 📋 Overview

This is a frozen, verified snapshot of the EVE Medical Evidence platform demo.

**Snapshot ID:** `v20260131-01`  
**Created:** 2026-01-31  
**Root Hash:** `144c9441c7a812547010a63b442ef765...`  
**Total Events:** 3,600  
**Substances:** 36  
**Therapeutic Areas:** 6  

---

## 🏥 What's Included

### Data Source
- **FDA FAERS** (FDA Adverse Event Reporting System)
- Via OpenFDA public API
- Data as of: 2025-10-30 (FDA last update)

### Therapeutic Areas (ATC Classification)

| Code | Area | Substances | Events |
|------|------|------------|--------|
| A | Metabolism/Diabetes | 6 | 600 |
| C | Cardiovascular | 7 | 700 |
| N | CNS/Psychiatry | 7 | 700 |
| M | Pain/Inflammation | 6 | 600 |
| J | Anti-infectives | 5 | 500 |
| R | Respiratory/Allergy | 5 | 500 |

### Substances List

**A - Metabolism/Diabetes**
- metformin, insulin, glimepiride, sitagliptin, empagliflozin, liraglutide

**C - Cardiovascular**
- atorvastatin, simvastatin, warfarin, apixaban, metoprolol, amlodipine, lisinopril

**N - CNS/Psychiatry**
- sertraline, fluoxetine, escitalopram, venlafaxine, quetiapine, risperidone, diazepam

**M - Pain/Inflammation**
- ibuprofen, aspirin, paracetamol, naproxen, diclofenac, tramadol

**J - Anti-infectives**
- amoxicillin, ciprofloxacin, doxycycline, azithromycin, vancomycin

**R - Respiratory/Allergy**
- salbutamol, budesonide, fluticasone, montelukast, cetirizine

---

## 🔐 Verification

### Corpus Integrity
- **Version:** v20260131-01
- **Root Hash:** `144c9441c7a812547010a63b442ef765...`
- **Merkle Tree Depth:** 13
- **Objects:** 3,600

### How to Verify Offline
1. Load `data/proofs/v20260131-01_proof.json`
2. Hash any object with SHA-256
3. Follow Merkle path to root
4. Compare with root hash

---

## ❌ What's NOT Included

- Medical advice or recommendations
- Causal inference or risk assessment
- Treatment suggestions
- Dosage guidance
- Drug comparisons with conclusions
- Trend analysis or predictions

---

## ⚠️ Disclaimers

### Data Disclaimer
This output reports adverse events from FDA FAERS. It does not constitute medical advice. FAERS data has known limitations including underreporting, reporting bias, and lack of causal verification.

### Statistical Disclaimer
All visualizations are descriptive statistics derived from the verified corpus snapshot. They do not imply causality, risk levels, or comparative safety.

### Usage Disclaimer
This demo is for technology evaluation purposes only. Do not use for clinical decision-making.

---

## 📜 Patent Reference

**Patent Pending:** EVE-PAT-2026-001  
**Title:** System och metod för evidensbaserad AI-assistans med vittnesbegränsad arkitektur, hierarkisk LLM-eskalering och kryptografisk verifiering  
**Applicant:** Joakim Eklund / Organiq Sweden AB  
**Priority Date:** 2026-01-13

---

## 🏢 Contact

**Organiq Sweden AB**  
Stockholm, Sweden  
https://eveverified.com

---

*This snapshot is immutable. Any modification invalidates the root hash.*
