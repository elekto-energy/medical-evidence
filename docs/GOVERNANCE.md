# GOVERNANCE.md - Medical Evidence Platform

## ⚖️ Witness Mode Governance (Patent Krav 1b, 2, 20)

### Grundprincip

AI-komponenten i detta system opererar i **vittnesläge** (witness mode).

Detta innebär att AI:n är **arkitektoniskt begränsad** till att:
- ✅ Söka i kunskapskärnan
- ✅ Citera passager från godkända källor
- ✅ Sammanfatta innehåll
- ✅ Förklara och kontextualisera

AI:n är **tekniskt förhindrad** från att:
- ❌ Generera medicinska rekommendationer
- ❌ Fatta beslut
- ❌ Skapa innehåll utanför kunskapskärnan
- ❌ Modifiera kunskapskärnan

---

## 🚫 Blockerade fraser (Krav 20)

### Svenska
- "jag rekommenderar"
- "du bör"
- "det är tillrådligt"
- "min rekommendation är"
- "ta detta läkemedel"
- "sluta ta"
- "öka dosen"
- "minska dosen"

### Engelska
- "I recommend"
- "you should"
- "it is advisable"
- "take this medication"
- "stop taking"
- "increase/decrease the dose"

---

## 📋 Obligatorisk metadata (Krav 19)

Varje svar MÅSTE inkludera:

1. **Söktermer** - extraherade av första LLM-instansen
2. **Källhänvisningar** - explicita referenser till använda fragment
3. **Kryptografisk hash** - SHA-256 av svar + källhänvisningar
4. **Disclaimer** - "Detta utgör ej medicinsk rådgivning"

---

## 🔐 Auktorisation (Krav 1c)

Ändringar i kunskapskärnan kräver:
1. Identifierad användare
2. Explicit godkännande
3. Loggning med tidsstämpel
4. Ej delegerbart till AI

---

## 📊 Trinity Pipeline (Krav 1e, 5)

| Nivå | Typ | Output | Latens |
|------|-----|--------|--------|
| 1 | Deterministisk fabrik | VERIFIED_DETERMINISTIC | ~0.1ms |
| 2 | Lokal LLM (Qwen) | LOCAL_LLM_UNVERIFIED | ~500ms |
| 3 | Extern LLM (Claude) | EXTERNAL_LLM_UNVERIFIED | ~2000ms |

---

## 🔍 Dual-LLM Isolation (Krav 17-18)

**Instans 1:** Sökterm-extraktor (får EJ generera svar)
**Instans 2:** Svarssyntetiserare (får EJ se ursprunglig fråga)

---

## 📜 Referens

**Patent:** EVE-PAT-2026-001  
**Sökande:** Joakim Eklund / Organiq Sweden AB  
**Prioritetsdatum:** 2026-01-13
