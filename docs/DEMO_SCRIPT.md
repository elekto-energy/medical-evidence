# EVE Medical Evidence - Demo Script

**Målgrupp:** Farmaceut / Apotekare  
**Tid:** 10-12 minuter  
**Version:** v20260131-01  

---

## 🎯 Kärnbudskap (memorera detta)

> "Det här är inte ett beslutsstöd och inte rådgivning. Det är ett verifierbart sätt att navigera rapporterad läkemedelssäkerhetsdata."

---

## 0️⃣ Före mötet (checklista)

- [ ] API körs: `node apps/api/query-server.js` (port 3050)
- [ ] Frontend körs: `npm run dev` i eve-medical-web (port 3051)
- [ ] Öppna http://localhost:3051/medical i webbläsaren
- [ ] Testa ett klick på Metformin → fungerar?
- [ ] Testa ett klick på en reaction → drawer öppnas?
- [ ] Ha backup: screenshots i en mapp om allt strular

---

## 1️⃣ Inledning (30 sek)

**Säg:**
> "Innan jag visar något vill jag vara tydlig: det här är inte ett system som ger råd eller rekommendationer. Det visar rapporterad data från FDA:s biverkningsdatabas – och gör det på ett sätt som går att verifiera i efterhand."

**Viktigt:** Etablera detta FÖRST. Det sätter rätt förväntningar.

---

## 2️⃣ Master View - Översikten (2 min)

**Visa:** http://localhost:3051/medical

**Peka på:**
- "36 verified substances" (stats-bar)
- "3,600 events" 
- "6 Therapeutic Areas"
- Root hash (kortfattat)

**Säg:**
> "Här ser ni alla substanser vi har i den här demon. 36 stycken, fördelade över 6 terapiområden. Allt kommer från samma låsta snapshot av FAERS-data."

**Peka på VERIFIED-badge:**
> "Varje rad är markerad VERIFIED – det betyder att datan är oförändrad sedan vi hämtade den."

**Om de frågar om urvalet:**
> "Vi har valt välkända substanser som ni känner igen – metformin, atorvastatin, sertraline, ibuprofen, och så vidare. Syftet är att visa arkitekturen, inte att täcka allt."

---

## 3️⃣ Detail View - Metformin (3 min)

**Klicka på:** Metformin

**Vänta tills sidan laddar.**

**Peka på stats:**
- Events in Corpus: 100
- Total in FDA: ~413,000
- % Serious
- Fatal Outcomes

**Säg:**
> "Här ser vi metformin. Vi har 100 rapporter i vårt corpus, av totalt över 400,000 i FDA:s databas. Det viktiga är inte mängden – det viktiga är att vi vet exakt vilka 100 det är."

**Peka på diagrammen:**
> "Det här är beskrivande statistik. Könsfördelning, åldersfördelning, allvarlighetsgrad, utfall. Systemet drar inga slutsatser – det visar bara vad som finns i rapporterna."

**Om de frågar om allvarlighetsgrad:**
> "Serious/Non-serious kommer direkt från FAERS-klassificeringen. Vi tolkar inte – vi visar."

---

## 4️⃣ Reaction Drill-down (2 min)

**Peka på:** "Top Reported Reactions"

**Säg:**
> "Här är de vanligaste rapporterade reaktionerna för metformin i vårt dataset."

**Klicka på:** Fatigue (eller annan med bra antal)

**Drawer öppnas från höger.**

**Säg:**
> "Nu filtrerar vi på just den reaktionen. Samma data – bara en annan vy. Ingen ny beräkning, ingen ny tolkning."

**Peka på tabellen:**
> "Varje rad är en rapport. Ni ser allvarlighet, ålder, kön, utfall. Allt kommer från samma snapshot."

**Peka på footer:**
> "Och här nere ser ni igen: VERIFIED, samma root hash. Inget har ändrats."

**Stäng drawer.**

---

## 5️⃣ Verifiering - Det som skiljer EVE (2 min)

**Scrolla ner till:** "🔐 Verification Data"

**Säg:**
> "Det här är kärnan i EVE. Varje svar har tre saker: corpus-version, root hash, och stats hash."

**Peka på varje:**
- **Corpus Version:** "Vilken version av datan vi använder"
- **Root Hash:** "En kryptografisk signatur av hela datasetet"
- **Stats Hash:** "En signatur av just den här statistiken"

**Säg:**
> "Det här gör att vi kan bevisa exakt vad systemet visste vid en given tidpunkt. Om någon ifrågasätter ett resultat kan vi gå tillbaka och verifiera – utan att lita på att någon minns rätt."

**Om de verkar intresserade:**
> "Det här är samma princip som används i blockchain och juridiska beviskedjor. Men här applicerat på läkemedelsdata."

---

## 6️⃣ Disclaimer - Varför det finns (1 min)

**Peka på:** Den gula disclaimer-rutan

**Säg:**
> "Den här texten finns på varje sida. 'Does not constitute medical advice.' Det är inte en juridisk formalitet – det är en designprincip."

> "EVE är byggt för att INTE kunna ge råd. Systemet kan visa, filtrera och verifiera – men det kan aldrig säga 'du bör göra X'. Det är en medveten begränsning."

---

## 7️⃣ Avslut (1 min)

**Gå tillbaka till:** Master View

**Säg:**
> "Sammanfattningsvis: det här är inte ett verktyg som ersätter expertis. Det är ett verktyg som gör expertisen tryggare – genom att ge er verifierbar tillgång till underliggande data."

> "Frågor?"

---

## 🚨 Om något strular

### API svarar inte
> "Jag har tekniska problem just nu, men låt mig visa er screenshots av hur det ser ut."

*(Ha screenshots redo i en mapp)*

### Sidan laddar långsamt
> "Systemet hämtar data från API:t... där kommer det."

*(Prata om arkitekturen medan det laddar)*

### De frågar något du inte vet
> "Bra fråga. Jag vill inte gissa – kan jag återkomma med ett korrekt svar?"

*(Skriv ner frågan)*

---

## 🅿️ Parking Lot (vanliga frågor)

### "Kan man lita på FAERS-data?"
> "FAERS har kända begränsningar – underrapportering, bias, ingen kausalitet. Det är därför vi visar datan som den är, utan att dra slutsatser. EVE gör datan tillgänglig och verifierbar – inte mer."

### "Varför bara 100 rapporter per substans?"
> "Det här är en demo. Systemet kan hantera mycket mer. Poängen är att visa att oavsett volym så är allt verifierbart på samma sätt."

### "Kan det här användas i produktion?"
> "Arkitekturen är produktionsklar. Det som återstår är att utöka datasetet och sätta upp säker åtkomst."

### "Hur skiljer sig det här från [annan tjänst]?"
> "De flesta system visar aggregerad statistik. EVE visar spårbara, verifierbara svar där varje datapunkt kan följas tillbaka till källan."

### "Vad betyder 'patent pending'?"
> "Vi har en patentansökan inne på arkitekturen – specifikt hur AI-komponenter begränsas till 'vittnesläge' och hur verifieringen fungerar."

---

## ✅ Efter mötet

- [ ] Skicka tack-mejl inom 24h
- [ ] Bifoga: länk till demo (om de vill testa själva)
- [ ] Notera: vilka frågor kom upp?
- [ ] Nästa steg: boka uppföljning?

---

*EVE Medical Evidence · Patent Pending EVE-PAT-2026-001*  
*© 2026 Organiq Sweden AB*
