# Git Setup och Taggning för Medical Evidence
# Kör dessa kommandon i PowerShell

# 1. Navigera till projektet
cd D:\EVE11\005_medical_evidence

# 2. Initiera git (om inte redan gjort)
git init

# 3. Lägg till remote (GitHub)
git remote add origin https://github.com/elekto-energy/medical-evidence.git

# 4. Lägg till alla filer
git add .

# 5. Commit med beskrivande meddelande
git commit -m "v0.9.0-medical-evidence: Trinity Pipeline verified

VERIFIED ENDPOINTS:
- GET /health ✓
- GET /corpus ✓  
- POST /query/guided ✓
- POST /query/compare ✓
- POST /query/natural ✓

TRINITY PIPELINE:
- L2 Parse (Claude) → L1 Query (EVE) → L2 Render (Claude)
- All responses hash-verified and reproducible

CORPUS:
- 36 substances, 18,000 events
- Root hash: ec5727564d1ed19be5b08b26d3866f446b12d3d388f5a8cd713332c6d97ad264

PATENT: EVE-PAT-2026-001
- Claim 5: Trinity Pipeline
- Claim 17: Witness Mode
- Claim 19: Evidence-based response
- Claim 20: Blocked phrases"

# 6. Skapa tagg
git tag -a v0.9.0-medical-evidence -m "Medical Evidence Platform - Verified Release

Trinity Pipeline fully operational.
All 5 endpoints tested and verified.
Ready for deployment.

Patent: EVE-PAT-2026-001"

# 7. Push till GitHub (när repo finns)
# git push -u origin main
# git push origin v0.9.0-medical-evidence
