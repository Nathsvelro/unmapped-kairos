# Unmapped Kairos

> Open, localizable infrastructure that connects a young person's real skills to real economic opportunity in the age of AI.
>
> Built for the **World Bank × Hack-Nation Global AI Hackathon 2026** challenge.

Unmapped Kairos is **infrastructure, not a product**. Every country-specific input — labor market data, education taxonomy, language, currency, automation calibration — is a *configuration file*, never hardcoded. Switching from Ghana to Bangladesh to Mexico to Brazil is a JSON change. Adding a fifth country is four files and zero code.

The three modules from the brief, all built end-to-end:

| # | Module | Route |
|---|---|---|
| 01 | **Skills Signal Engine** — AI-assisted intake that maps your free-text experience to portable ESCO/ISCO skills. You confirm or reject every mapping. | `/[country]/intake` |
| 02 | **AI Readiness & Displacement Risk Lens** — Frey-Osborne automation probabilities, recalibrated for LMICs using ITU digital-infrastructure scores and ILO routine-task indices. | `/[country]/readiness` |
| 03 | **Opportunity Matching & Econometric Dashboard** — honest, reachable matches with real ILOSTAT wages and Data360 sector growth, plus a policymaker view. | `/[country]/opportunities`, `/[country]/dashboard` |

Plus two extras the brief inspires:

- **Durability Coach** at `/[country]/coach` — reads your profile + the country's α/β/digital-infra calibration, then asks the LLM for concrete actions, local resources, and an explicit "what this advice can't verify" block.
- **Nia** — a floating AI guide (bottom-right pill) on every country page. Knows your country context + profile.

---

## Quick demo (no install, 60 seconds)

If the project is already running locally, this is the path:

1. Open **http://localhost:3000**
2. Click **"Seed demo profiles"** on the homepage card. Four country-appropriate personas land in your browser's `localStorage`:
   - **🇬🇭 Ghana** — Amara, 22, Madina (the brief's persona)
   - **🇧🇩 Bangladesh** — Rina, 24, Mirpur garments district
   - **🇲🇽 Mexico** — Diego, 23, Estado de México
   - **🇧🇷 Brazil** — Júlia, 25, São Paulo
3. Click any country tile, then walk through Build profile → My profile → AI readiness → Durability coach → Opportunities → Policy dashboard.
4. Use the **GH | BD | MX | BR** chips in the header to switch country mid-page — every screen reconfigures live (locale, currency, taxonomy, calibration).

---

## Run it locally

### Prerequisites

- **Node.js ≥ 20** ([nodejs.org](https://nodejs.org))
- **npm** (ships with Node)
- A modern browser — **Chrome, Safari, or Firefox** (do *not* use VS Code's Simple Browser; it can't handle modern web apps)

> **Full hardware + software + dependency list:** see **[REQUIREMENTS.md](REQUIREMENTS.md)** — versions, env vars, troubleshooting, the lot.

### 1 — Clone and install

```bash
git clone https://github.com/Nathsvelro/unmapped-kairos.git
cd unmapped-kairos
npm install
```

### 2 — (Optional) Add an LLM key

Without a key, the app runs in **offline mode**: a deterministic fuzzy matcher handles skill extraction; Nia and the Coach return rule-based fallback messages. Everything else (profile, readiness, opportunities, dashboard) works fully — they're powered by the local data snapshots, not the LLM.

To enable LLM-powered features, copy the example env file and add **one** of:

```bash
cp .env.example .env.local
# Then edit .env.local and set EITHER:
OPENAI_API_KEY=sk-...
# OR:
ANTHROPIC_API_KEY=sk-ant-...
```

If you set both, OpenAI wins by default (override with `UNMAPPED_LLM_PROVIDER=anthropic`).

Default models: `gpt-4o-mini` (OpenAI) or `claude-sonnet-4-6` (Anthropic). Override per-feature with `UNMAPPED_SKILL_MODEL`, `UNMAPPED_NIA_MODEL`, `UNMAPPED_COACH_MODEL`.

### 3 — Run the dev server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. Hard-reload (`Cmd+Shift+R` / `Ctrl+Shift+R`) on first load if a stale cache is showing.

### 4 — (Optional) Production build check

```bash
npx tsc --noEmit   # type-check
npm run build      # full Next.js build
npm start          # serve the production bundle on port 3000
```

---

## Test it yourself in 5 minutes

This is the demo flow that lets you confirm every brief requirement is actually wired up.

### Step 1 — Seed the personas

1. http://localhost:3000
2. Scroll past the country tiles to the **"Just exploring? Seed all four demo profiles"** card.
3. Click **Seed demo profiles**. The card expands with four "Open →" links.

### Step 2 — Walk Amara's flow (Ghana)

1. http://localhost:3000/gh/profile
   - **Persona card:** coral "AO" avatar + Amara Owusu, 22, Madina, Greater Accra + headline + bio
   - **Verified Passport badge:** "Local draft — export to sign" (amber). Click **Export JSON passport** → the badge flips to green **"✓ Verified passport"** with a SHA-256 checksum like `sha256: f2bc9b94…3f2c31`.
   - **Credentials:** WAEC Senior School Certificate (SSSCE/WASSCE) · ISCED 3 · 2020
   - **Languages:** tw · native, en · B2, ha · B1
   - **5 skills**, each with a *Source* line (e.g. "Source: Demo seed · pre-confirmed") and ✓ / × controls

2. http://localhost:3000/gh/readiness
   - 5 risk band chips (HIGH / MEDIUM / DURABLE) per skill
   - **Calibration block** stating: *"Frey-Osborne automation scores were dampened by 20% to reflect Ghana's digital infrastructure score of 0.42. Routine task share added 18% uplift."*
   - **Adjacent durable skills** with reachability windows
   - **Wittgenstein 2025–2035** education trajectory chart

3. http://localhost:3000/gh/coach
   - **At-risk summary** (1–2 sentences)
   - **Profile-wide risk %** + **α · β · digital infra** tiles (the two econometric signals the brief asks to be surfaced visibly)
   - **3–4 concrete actions** with horizon chips ("This week", "1–3 months", "3–12 months")
   - **3–4 local resources**
   - **Honest limits** block ("what this advice can't verify")
   - When the LLM key is set, the badge reads `via OpenAI · gpt-4o-mini` or `via Claude · claude-sonnet-4-6`. Without a key, it says `offline mode` and surfaces rule-based fallback content.

4. http://localhost:3000/gh/opportunities
   - 10 honest matches: *Software developers · ICT · ISIC J · formal* etc.
   - Each card shows median wage from **ILOSTAT** (currency follows country), sector growth from **Data360** (`+5.1% YoY`), and a reachability chip ("Available now" in coral).

5. http://localhost:3000/gh/dashboard
   - 8 econometric KPIs (NEET, informality, wage employment %, employment-to-population, GDP per-capita growth, GDP per-capita USD, mobile broadband, internet users)
   - Sector employment growth bar chart
   - Wittgenstein education-attainment projections to 2035

6. **Ask Nia** — click the floating coral pill in the bottom-right. Try:
   - *"What's the AI risk for phone repair here?"*
   - *"Show me the highest-paying sectors I can reach"*

### Step 3 — Cross-border passport (the protocol promise)

1. On `/gh/profile`, click **Export JSON passport**. A `kairos-passport-GH-<id>.json` downloads.
2. Click any **other country** chip in the header (e.g. **BD**).
3. On `/bd/profile`, click **Import a profile** and pick the JSON you just downloaded.
4. Watch:
   - The **persona card stays as Amara** (her bio is preserved)
   - The badge says **"✓ Verified passport · Issued in GH · viewing in BD · cross-border import"** with the same `sha256` it had on Ghana
   - The credential (WAEC SSSCE) survives intact
   - But the page now renders in Bangla, currency is BDT, sector classification is Bangladesh's

This is what *"portable across borders"* means in the brief — and the SHA-256 is what *"the user owns it"* means.

### Step 4 — Live country switching

Anywhere in the app:

1. Note the locale / currency / α-β / sector scheme on the current page.
2. Click another country chip in the header (top-right).
3. The **same page** re-renders under the new country: locale label changes, currency symbol changes, taxonomy strings change, calibration values change. **No page reload, no code change.**

### Step 5 — Honest about limits

http://localhost:3000 has four panels at the bottom of the homepage. Each one is **clickable** and lands on the page that proves the claim:

- **Show the data** → `/gh/opportunities` (real ILOSTAT + Data360 badges on every card)
- **Designed for constraint** → `/gh/intake` (no login required, profile lives in `localStorage`, system-font fallback)
- **Localizability — by evidence** → `/gh/profile` (then click chips to see the swap)
- **Honest about limits** → `/gh/coach` (which ends every render with what it can't verify)

---

## Architecture

```
unmapped/                            (this repo's root)
├── app/                             Next.js App Router (pages + API routes)
│   ├── page.tsx                     Country picker + Seed demo + 4 evidence panels
│   ├── [country]/
│   │   ├── intake/                  Module 01 · 4-step skill capture
│   │   ├── profile/                 Verified passport (export + import + sign)
│   │   ├── readiness/               Module 02 · LMIC-recalibrated risk
│   │   ├── coach/                   Durability Coach (LLM-driven)
│   │   ├── opportunities/           Module 03 · honest reachable matches
│   │   └── dashboard/               Policymaker dashboard
│   └── api/                         Route handlers
│       ├── extract-skills/          Free-text → ESCO mapping
│       ├── readiness/               Per-profile risk + adjacents
│       ├── opportunities/           Honest matching against ILOSTAT
│       ├── dashboard/               Aggregate signals
│       ├── coach/                   Structured advice (actions / resources / limits)
│       └── chat/                    Nia
│
├── packages/
│   ├── core/
│   │   ├── types/                   CountryContext, SkillsProfile (the protocol)
│   │   ├── i18n/                    Dictionary loader + Intl formatters + cookie locale
│   │   ├── scoring/                 automationRisk · matching · readiness
│   │   └── profile/                 encode (sign) + verify (Web Crypto SHA-256)
│   ├── adapters/                    One file per data source, uniform DataAdapter<T>
│   ├── llm/
│   │   ├── provider.ts              Unified chat() — routes to OpenAI or Anthropic
│   │   ├── skillExtraction.ts       Free-text → ESCO/ISCO + provenance
│   │   ├── nia.ts                   Conversational guide
│   │   └── coach.ts                 Structured durability advice
│   ├── ui/components/               LocaleSwitcher, CountrySwitcherChips,
│   │                                NiaLauncher, SeedDemoButton, SourceBadge,
│   │                                profileStorage (localStorage + demo seeds)
│   └── design/                      D1 design system: Logo, types, fixture, fonts
│
├── config/
│   ├── countries/                   GH/BD/MX/BR JSON — the protocol contracts
│   └── locales/{en,tw,bn,es,pt}/    UI dictionaries
│
└── data/snapshots/                  Versioned, cited data slices
    ├── manifest.json                Provenance + fetch dates + licenses
    ├── frey-osborne/                Automation probabilities by occupation
    ├── isco-08/                     Occupation backbone
    ├── esco/                        Skills + occupation taxonomy
    ├── ilostat/                     Wages by sector
    ├── wdi/                         NEET, employment, GDP
    ├── data360/                     Informality + sector employment growth
    ├── itu/                         Digital connectivity
    ├── wittgenstein/                Education projections to 2035
    └── ilo-task-content/            Routine-task share by sector
```

---

## How the LMIC recalibration works

Frey-Osborne 2017 estimates "probability of computerisation" assuming US task composition and US-level digital infrastructure. Both differ in LMICs. Unmapped Kairos applies a transparent two-step adjustment per country:

```
adjusted_risk = baseline · (1 − α · (1 − digitalInfraScore))
              + β · routineTaskShare
```

- **α** dampens raw risk where digital infrastructure is low (rollout lags estimates).
- **β** uplifts risk for routine-heavy work (it's structurally more exposed once infra catches up).
- **`digitalInfraScore`** comes from ITU.
- **`routineTaskShare`** comes from ILO Future of Work indices for that sector.

α and β live in `config/countries/*.json` — partners can recalibrate without touching code. The Readiness page and Coach page surface these parameters in plain text so users can see exactly what we did.

---

## Add a country (the protocol promise)

To onboard, say, Kenya:

1. **Author `config/countries/kenya.json`** following the `CountryContext` schema (see `packages/core/types/context.ts`). Set the locale, currency, ISCED education taxonomy, automation calibration (α, β, digital infra score), and opportunity types.
2. **Add data slices** to `data/snapshots/`:
   - `ilostat/wages-by-sector.json` — add `KE` block
   - `wdi/indicators.json` — add `KE` block
   - `data360/informality.json` and `sector-employment-growth.json` — add `KE` blocks
   - `itu/digital-connectivity.json` — add `KE` block
   - `wittgenstein/education-projection.json` — add `KE` block
   - `ilo-task-content/routine-share.json` — add `KE` block
3. **(If new locale)** Add `config/locales/sw/common.json` (or whichever language). Existing locale files are templates.
4. **Register the country** in `packages/core/load.ts` by adding `KE: "kenya.json"` to `COUNTRY_FILES` and `"KE"` to `SUPPORTED_COUNTRIES`.

That's it. No component changes. No business-logic changes. The `/ke`, `/ke/intake`, `/ke/coach`, etc. routes appear automatically.

---

## Data sources

Every dataset is cited in `data/snapshots/manifest.json` with source URL, year, license, and any imputation notes. Headlines:

- **ILO ILOSTAT** — wages and employment by sector
- **World Bank WDI** — NEET, employment-to-population, GDP per capita
- **World Bank Data360** — informality, sector employment growth
- **Frey & Osborne (2017)** — automation probabilities by occupation (recalibrated for LMICs)
- **ESCO** — multilingual skills/occupations taxonomy
- **ISCO-08** — occupation backbone
- **ILO Future of Work** — routine task content per sector
- **ITU Digital Development DataHub** — mobile broadband, internet penetration
- **Wittgenstein Centre** — education attainment projections to 2035

---

## Honest about limits

The brief rewards honesty. We surface, not hide:

- **Frey-Osborne is US-derived.** The LMIC formula is transparent but not validated against in-country labor outcomes. The Readiness and Coach pages expose α, β, and the digital-infrastructure score in plain text.
- **Skill mapping has a confidence floor.** Below it, profiles mark the skill "unconfirmed" — the user can still keep their words verbatim.
- **Wage data has lag.** Every figure shows source year via `<SourceBadge>`.
- **Snapshots are versioned, not live.** `data/snapshots/manifest.json` lists `fetched_at` for every dataset.
- **ESCO multilingual labels for Bangla and Twi were translated**, since ESCO doesn't natively cover those languages. Treat as drafts.
- **The sector-routine mapping is coarse** in this prototype — production deployments would refine it per-country.
- **The Durability Coach can't verify** employer hiring intent or guarantee a job; it only points where labor data and your skills overlap. The Coach prints this on every render.

---

## Privacy + portability

- **No login required.** No backend account.
- **Profile lives only in your browser's `localStorage`** under the key `unmapped:profile:<COUNTRY>`.
- **Export creates a portable JSON passport** — canonicalized + SHA-256-signed (Web Crypto). Anyone holding the file can re-hash and verify nothing was modified after export.
- **Importing into a different country** preserves `originCountryId` so the chain of custody survives.
- **Reset wipes local data** — there's a Reset button on the Profile page.

---

## Tech stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind 4**
- **Recharts** (the dashboard charts)
- **OpenAI SDK** + **Anthropic SDK**, behind a unified `chat()` provider abstraction in `packages/llm/provider.ts`
- **Zod** (request validation)
- **Web Crypto API** for SHA-256 signing of profile passports
- **No DB.** No server-side state. Profile state is browser-only.
- **No `next/font/google`** — Google Fonts loaded via `<link>` so the production build doesn't fail in offline / restricted environments. System-font stacks fall back when the CDN is unreachable.

---

## Demo personas

The seeded demo profiles are tied to ESCO/ISCO codes that exist in the bundled data snapshots, so risk + matching + dashboard all produce real (not synthetic) numbers.

| Country | Persona | Headline |
|---|---|---|
| 🇬🇭 GH | **Amara Owusu** · 22 · Madina | Phone-repair entrepreneur since 17, self-taught coder on shared mobile. *(The brief's persona, verbatim.)* |
| 🇧🇩 BD | **Rina Akter** · 24 · Mirpur, Dhaka | Garments-factory operator with informal admin and bookkeeping experience. |
| 🇲🇽 MX | **Diego Ramírez** · 23 · Estado de México | Vehicle mechanic with self-taught coding and family-shop operations. |
| 🇧🇷 BR | **Júlia Pereira** · 25 · São Paulo | Junior web developer + freelance social-media marketer. |

---

## Useful commands

```bash
npm run dev               # dev server on http://localhost:3000
npm run build             # production build
npm start                 # run the production bundle
npm run lint              # ESLint
npx tsc --noEmit          # type-check without emitting
npx next typegen          # regenerate Next route types
```

---

## What's intentionally missing

- **No employer-side posting flow.** Opportunities are read-only matches against existing labor data — no employer accounts, no posting UI. The brief doesn't ask for it; we'd add it as Module 04 in a future iteration.
- **No mobile native app.** The web is mobile-first and PWA-capable, but there's no React Native shell.
- **No real-time data feeds.** Snapshots are versioned and dated; ETL scripts in `scripts/etl/` document refresh procedures.
- **No "AI everywhere."** The LLM is used precisely where it adds value (free-text → taxonomy mapping, narration, durability coaching) and explicitly *not* in scoring (which must be auditable). When no LLM key is set, those features fall back to deterministic rule-based equivalents — the rest of the app behaves identically.

---

## License

Code: **MIT**.
Data: licenses per source — see [`data/snapshots/manifest.json`](data/snapshots/manifest.json).

---

## Acknowledgements

Built for the **World Bank × Hack-Nation Global AI Hackathon 2026**. Persona, framing, and many of the data-source recommendations come from the challenge brief.

The dot-grid mark and "discovered path" represent the unplotted territory of youth potential and the route from current skill to real opportunity — discovered, not assumed.
