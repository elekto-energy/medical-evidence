# EVE Medical Web

Next.js 14 frontend for EVE Medical Evidence demo.

## Quick Start

```bash
# 1. Start API (in another terminal)
cd D:\EVE11\005_medical_evidence
node apps/api/query-server.js

# 2. Start frontend
cd apps/eve-medical-web
npm install
npm run dev
```

Opens at **http://localhost:3051**

## Features

- ✅ **Landing Page** - Explains what EVE is
- ✅ **Master View** - All 36 substances in clean table
- ✅ **Detail View** - Stats, charts, reactions for each drug
- ✅ **Reaction Drawer** - Drill-down to individual reports
- ✅ **PDF Export** - Printable report with hash verification
- ✅ **Light/Dark Mode** - Toggle in top-right corner
- ✅ **Supabase Auth Ready** - Optional invite-only access

## Scale Data (Optional)

To increase from 3,600 to 18,000 events:

```bash
cd D:\EVE11\005_medical_evidence
node scripts/batch-ingest.js 500    # 500 events per drug
node scripts/build-stats.js          # Rebuild stats
node scripts/prove-corpus-runner.js  # New Merkle proof
```

## Enable Auth (Optional)

1. Create project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local`
3. Add your Supabase URL and anon key
4. Install: `npm install @supabase/supabase-js`
5. Restart dev server

When configured, `/login` will be active and `/medical` protected.

## Architecture

```
app/
├── page.tsx              # Landing page
├── login/page.tsx        # Login (when auth enabled)
└── medical/
    ├── page.tsx          # Master View
    └── [drug]/page.tsx   # Detail View

components/
├── MasterTable.tsx       # Substance list
├── DrugDetail.tsx        # Full analysis
├── ReactionDrawer.tsx    # Report drill-down
├── ExportPdfButton.tsx   # PDF generation
├── ThemeToggle.tsx       # Dark/light mode
└── charts/BarChart.tsx   # Visualizations

lib/
├── api.ts                # EVE API client
├── auth.ts               # Supabase client
└── types.ts              # TypeScript types
```

## EVE Rules

- ❌ No server-side analysis
- ❌ No caching that changes behavior
- ✅ All fetches use `cache: 'no-store'`
- ✅ Show `corpus_version` + `root_hash` clearly
- ✅ Everything is read-only

---

**Patent Pending:** EVE-PAT-2026-001  
© 2026 Organiq Sweden AB
