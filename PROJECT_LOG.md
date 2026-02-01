# EVE Medical Evidence — PROJECT LOG

**Project:** 005_medical_evidence  
**Started:** 2026-01-31  
**Status:** Active Development  
**Governance:** GOVERNANCE_v1 (locked)

---

## 2026-02-01

### Session 3: PDF Export & Hierarchy Fix
- [x] Rewrote `ExportPdfButton.tsx` — jsPDF + html2canvas for real PDF download
- [x] Fixed hierarchy: Substance as main heading, EVE as footer
- [x] Removed "VERIFIED" badge — replaced with "Verification Data" section
- [x] All colors neutral — no red for fatal, no green for OK
- [x] EVE Decision ID prominently displayed in verification section

**Key Changes (based on feedback):**
- ❌ "EVE Medical Evidence" as title → ✅ Substance name + "Adverse Event Summary"
- ❌ Green "VERIFIED" badge → ✅ Neutral verification panel
- ❌ Red for fatal outcomes → ✅ Same neutral color as other stats
- ❌ Print dialog → ✅ Direct PDF download (jsPDF + html2canvas)
- ✅ "Presented via EVE" in footer (instrument, not owner)

**Philosophy Applied:**
> "EVE ska kännas som ett instrument, inte en avsändare."

**File Changed:**
- `apps/eve-medical-web/components/ExportPdfButton.tsx`

---

### Session 2: Color Palette Update
- [x] Updated `globals.css` — Clinical Archive design system
- [x] Updated `tailwind.config.js` — Neutral palette
- [x] Updated `DrugDetail.tsx` — Removed AI-aesthetics (no glow, no neon)
- [x] Added EVE Decision ID display in verification panel

**Color Philosophy Applied:**
- Base: Neutral gray `#f5f6f8` (archive/library feel)
- Accent: Muted blue-gray `#5a7a94` (not AI-blue)
- No green=OK, red=danger emotional coding
- No gradients, glow, or animations
- ATC colors: Muted categorical (not bright)

**Files Changed:**
- `apps/eve-medical-web/app/globals.css`
- `apps/eve-medical-web/tailwind.config.js`
- `apps/eve-medical-web/components/DrugDetail.tsx`

---

### Session 1: Deploy & Architecture Fix
- Fixed login redirect loop (middleware pointed to external domain)
- Deployed login page to `medical.eveverified.com/login`
- Confirmed API running with EVE Decision ID: `EVE-MED-20260201-*`
- Project location: `D:\EVE11\Projects\005_medical_evidence\`

### Decisions
- Single login on `medical.eveverified.com` (not split across domains)
- X-Vault only for SEAL/SIGN/PUBLISH actions (not every API response)
- Trinity only for natural language output (not structured data)

---

### Next
- [ ] Deploy updated frontend to server
- [ ] Test PDF export in browser
- [ ] Add 3D molecule viewer (3Dmol.js + PubChem SDF)
- [ ] "What this is / is not" section in Substance View

---

## 2026-01-31

### Session: Initial Corpus & API
- Created corpus snapshot `v20260131-01` with 36 substances
- Implemented EVE Decision ID generator
- Built query API with Merkle proof verification
- Deployed to `medical-api.eveverified.com`

### Corpus Stats
- 36 substances from OpenFDA FAERS
- 6 therapeutic areas (ATC codes A, C, N, M, J, R)
- ~500 events per substance
- Full hash chain + root hash

### Files Created
- `apps/api/query-server.js` — Main API
- `apps/eve-medical-web/` — Next.js frontend
- `data/corpus/v20260131-01/` — Snapshot data
- `data/proofs/v20260131-01_proof.json` — Merkle proof

---

## Principles (from GOVERNANCE_v1)

- System must never provide medical advice
- All output is information only
- EVE Decision ID binds every query to corpus + governance
- Human review required for SEAL/SIGN/PUBLISH

**Design Principle (added 2026-02-01):**
> EVE är intelligent i sina hänvisningar, inte i sina rekommendationer.
> EVE ska kännas som ett instrument, inte en avsändare.

---

*Log maintained by: Development team*
