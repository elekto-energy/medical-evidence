# 005 Medical Evidence - Handover Document
> Skapad: 2026-01-31  
> Uppdaterad: 2026-01-31  
> Version: **v0.9.0-medical-evidence** (LOCKED)  
> Patent: EVE-PAT-2026-001

## ✅ VERIFIED STATUS (2026-01-31)

Alla endpoints testade och verifierade:

| Test | Endpoint | Status |
|------|----------|--------|
| Health | `GET /health` | ✅ PASS |
| Corpus | `GET /corpus` | ✅ PASS |
| Guided Query | `POST /query/guided` | ✅ PASS |
| Compare Query | `POST /query/compare` | ✅ PASS |
| Natural Query | `POST /query/natural` | ✅ PASS |

**Trinity Pipeline verified:** L2 Parse → L1 Query → L2 Render

Se: `TECH_NOTE_v0.9.0.md` för fullständig teknisk dokumentation.

## Översikt

Medical Evidence är en verifierbar läkemedelsbiverkningsplattform baserad på FDA FAERS-data. Implementerar Trinity Pipeline där AI endast tolkar språk medan EVE hanterar all data deterministiskt.

---

## Arkitektur

```
┌─────────────────────────────────────┐
│  eveverified.com/medical            │  ← Login (Supabase Auth)
│  003_determinism_se                 │
└──────────────┬──────────────────────┘
               │ redirect efter login
               ▼
┌─────────────────────────────────────┐
│  medical.eveverified.com            │  ← Fristående App
│  005_medical_evidence               │
│  (Light mode default)               │
└──────────────┬──────────────────────┘
               │ API calls
               ▼
┌─────────────────────────────────────┐
│  API Server (port 3050)             │
│  Trinity Pipeline:                  │
│  L2 Parse → L1 Query → L2 Render    │
└─────────────────────────────────────┘
```

---

## Lokala Adresser

| Tjänst | Port | URL |
|--------|------|-----|
| Medical API | 3050 | http://localhost:3050 |
| Medical Frontend | 3051 | http://localhost:3051/medical |
| EVE Verified (login) | 3000 | http://localhost:3000/medical |

---

## Mappar och Filer

### 005_medical_evidence (Huvudprojekt)

```
D:\EVE11\005_medical_evidence\
├── apps/
│   ├── api/
│   │   ├── query-server.js      # Huvud-API (port 3050)
│   │   ├── natural-query.js     # Trinity Pipeline (Claude + EVE)
│   │   └── guided-query.js      # Deterministisk query
│   │
│   └── eve-medical-web/         # Frontend (Next.js)
│       ├── app/
│       │   ├── globals.css      # Light mode default
│       │   ├── layout.tsx       # Root layout med AuthHeader
│       │   └── medical/
│       │       ├── page.tsx     # Huvudsida
│       │       ├── ask/page.tsx # "Fråga EVE" - Natural Query
│       │       └── query/page.tsx # Query Builder
│       ├── components/
│       │   ├── AuthHeader.tsx   # Login/logout + theme toggle
│       │   └── ThemeToggle.tsx  # Light/dark mode
│       ├── middleware.ts        # Supabase auth-skydd
│       ├── .env.local           # Supabase + API config
│       └── package.json
│
├── corpus/
│   └── v20260131-01/            # Fruset dataset
│       ├── manifest.json
│       ├── drugs/               # 36 substanser
│       └── merkle_tree.json     # Verifieringsträd
│
└── HANDOVER.md                  # Denna fil
```

### 003_determinism_se (EVE Verified - Login)

```
D:\EVE11\Projects\003_determinism_se\
├── app/
│   └── medical/
│       └── page.tsx             # Login-sida (mörk design)
├── .env.local                   # Supabase + redirect URL
└── next.config.js               # output: 'export' avstängd
```

---

## Konfiguration

### 005 - Medical Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://vbgrxhjfvbisrmjbkahp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:3050
NEXT_PUBLIC_LOGIN_URL=http://localhost:3000/medical
```

### 003 - EVE Verified (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://vbgrxhjfvbisrmjbkahp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_MEDICAL_API_URL=http://localhost:3050
NEXT_PUBLIC_MEDICAL_APP_URL=http://localhost:3051/medical
```

### API - Environment Variable (PowerShell)
```powershell
$env:ANTHROPIC_API_KEY = 'sk-ant-api03-...'
```

---

## Startkommandon

### Terminal 1 - API
```powershell
cd D:\EVE11\005_medical_evidence
$env:ANTHROPIC_API_KEY = 'sk-ant-api03-6GeXpOsTLapccmhwn4zsjAUiRhMo0B6DSPU2XKuyU-Dg0c8s2WRxmzuyaZduv7stWXCMGeCKA0wP2ofmPw-W5I7zwAA'
node apps/api/query-server.js
```

### Terminal 2 - Medical Frontend
```powershell
cd D:\EVE11\005_medical_evidence\apps\eve-medical-web
npm run dev
```

### Terminal 3 - EVE Verified (login) - valfritt för lokalt
```powershell
cd D:\EVE11\Projects\003_determinism_se
npm run dev
```

---

## API Endpoints

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| GET | /health | Service status |
| GET | /corpus | Lista alla substanser + metadata |
| POST | /query/guided | Deterministisk query med parametrar |
| POST | /query/natural | Natural Language Query (Trinity) |
| GET | /proof/:version | Merkle-bevis för verifiering |

### Exempel - Natural Query
```bash
POST /query/natural
{
  "question": "Vilka biverkningar är vanligast för metformin hos kvinnor över 65?",
  "language": "sv"
}
```

### Response
```json
{
  "status": "VERIFIED",
  "trinity": {
    "parse": { "model": "CLAUDE_L2", "status": "complete", "time_ms": 234 },
    "query": { "model": "EVE_L1", "status": "complete", "time_ms": 12 },
    "render": { "model": "CLAUDE_L2", "status": "complete", "time_ms": 456 }
  },
  "answer": { "language": "sv", "text": "..." },
  "evidence": { "total_matching": 142, "top_reactions": [...] },
  "verification": { "query_hash": "...", "reproducible": true }
}
```

---

## Trinity Pipeline - Säkerhetsmodell

```
User Question (Swedish) 
  → Claude L2 (Parser): Översätter till parametrar ENDAST
  → EVE L1 (Query): Deterministisk query med verifiering
  → Claude L2 (Renderer): Formaterar EVE-resultat på svenska ENDAST
```

**Claude gör:**
- Tolkar fråga → strukturerade parametrar
- Formaterar data → läsbar text
- Hänvisar till källor och hash

**Claude gör INTE:**
- Tolkar medicinsk risk
- Ger råd eller rekommendationer
- Använder extern kunskap

---

## Design

### Light Mode (default)
- Bakgrund: `#f0f4f8`
- Kort: `#ffffff`
- Accent: `#00b8a0` (teal)
- Verify: `#7c3aed` (lila)

### Dark Mode
- Bakgrund: `#0a0f1a`
- Kort: `#0f1628`
- Accent: `#00e5c7` (cyan)
- Verify: `#a78bfa` (lila)

CSS-variabler i `globals.css` - toggle via `document.documentElement.classList.add('dark')`

---

## Supabase

- **Projekt**: vbgrxhjfvbisrmjbkahp
- **Dashboard**: https://supabase.com/dashboard/project/vbgrxhjfvbisrmjbkahp
- **Auth Users**: Skapa manuellt med "Auto Confirm User"

---

## Corpus Data

- **Version**: v20260131-01
- **Substanser**: 36
- **Händelser**: 18,000 (500 per substans)
- **Terapiområden**: 6
- **Root Hash**: `ec5727564d1ed19be5b08b26d3866f446b12d3d388f5a8cd713332c6d97ad264`

---

## Kända Problem & Fixar

### 1. "invalid x-api-key" fel
**Orsak**: ANTHROPIC_API_KEY sätts inte korrekt
**Fix**: natural-query.js rad 15-18 måste vara:
```javascript
const anthropic = new Anthropic.default({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

### 2. Port already in use
**Fix**: 
```powershell
taskkill /F /IM node.exe
```

### 3. Light mode input-fält vita
**Fix**: Använd `bg-[#0d0d0d]` istället för `bg-white/[0.02]` i login-sidan

---

## Deployment TODO

1. **API på Oderland Cloud**
   - Node.js miljö
   - ANTHROPIC_API_KEY som env var
   - CORS för eveverified.com

2. **Frontend på Oderland**
   - `npm run build && npm run start`
   - Eller statisk export om möjligt

3. **DNS**
   - medical.eveverified.com → Frontend
   - api.eveverified.com/medical → API (eller subdomain)

4. **Environment URLs**
   - Uppdatera .env.local med production URLs

---

## Patent

**EVE-PAT-2026-001** - Witness Mode AI Architecture
- Alla 20 claims mappade till kod
- Trinity Pipeline = Claims 5, 19
- Merkle verification = Claims 3, 8, 12

---

## Kontakt

- **Projekt**: Organiq Sweden AB
- **Founder**: Joakim Eklund
- **Email**: joakim@organiq.se
