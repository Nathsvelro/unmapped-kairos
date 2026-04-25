# Requirements

Everything you need to run **Unmapped Kairos** locally.

---

## System

| What | Minimum | Recommended | Notes |
|---|---|---|---|
| **Operating system** | macOS 12+ / Linux / Windows 10+ | macOS or Linux | Windows works fine — use PowerShell or WSL |
| **Node.js** | **20.0** | 22 LTS or 24+ | Project tested on Node 25; install from [nodejs.org](https://nodejs.org) |
| **npm** | 10.0 | 11+ | Ships with Node — no separate install |
| **Disk space** | ~600 MB | 1 GB | `node_modules` is ~450 MB after `npm install` |
| **RAM** | 2 GB free | 4 GB free | Next.js dev server uses ~500 MB |
| **Browser** | Chrome 110+ / Safari 16+ / Firefox 110+ | Chrome or Safari | **Do NOT use VS Code's "Simple Browser"** — it can't handle modern web apps. Open the URL in a real browser. |
| **Internet** | required for first `npm install` | — | Subsequent runs work fully offline |

Verify your versions:

```bash
node --version    # should print v20.x.x or higher
npm --version     # should print 10.x.x or higher
git --version     # any recent git is fine
```

If `node --version` says you have something older than v20, install the latest LTS from [nodejs.org](https://nodejs.org) before continuing.

---

## Optional — LLM provider

The app **fully works without an LLM key** — Skill extraction falls back to a deterministic fuzzy matcher, Nia and the Coach return rule-based fallback messages. Profile / Readiness / Opportunities / Dashboard pages don't need an LLM at all.

Set **one** of the following in `.env.local` to enable LLM features:

| Provider | Env var | Default model | Where to get it |
|---|---|---|---|
| **OpenAI** | `OPENAI_API_KEY` | `gpt-4o-mini` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Anthropic** | `ANTHROPIC_API_KEY` | `claude-sonnet-4-6` | [console.anthropic.com](https://console.anthropic.com) |

If both are set, OpenAI wins by default. Override with `UNMAPPED_LLM_PROVIDER=anthropic`.

Per-feature model overrides (all optional):

```env
UNMAPPED_SKILL_MODEL=gpt-4o-mini
UNMAPPED_NIA_MODEL=gpt-4o-mini
UNMAPPED_COACH_MODEL=gpt-4o
```

---

## npm dependencies (auto-installed)

Listed for transparency — `npm install` reads `package.json` and installs them all automatically.

### Runtime

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.4 | App Router framework |
| `react`, `react-dom` | 19.2.4 | UI runtime |
| `typescript` | ^5 | Type system |
| `tailwindcss` | ^4 | Styling |
| `@anthropic-ai/sdk` | ^0.91 | Claude SDK (used when `ANTHROPIC_API_KEY` is set) |
| `openai` | ^6.34 | OpenAI SDK (used when `OPENAI_API_KEY` is set) |
| `recharts` | ^3.8 | Dashboard charts |
| `zod` | ^4.3 | API request validation |
| `clsx`, `tailwind-merge` | ^2.1, ^3.5 | className utilities |

### Dev

ESLint, Tailwind PostCSS plugin, TypeScript types for Node + React.

---

## Data

The repo ships with **versioned, cited data snapshots** in `data/snapshots/` — no external API access needed at runtime. Sources include ILOSTAT, World Bank WDI / Data360, Frey-Osborne, ESCO, ISCO-08, ITU, and Wittgenstein Centre. See [`data/snapshots/manifest.json`](data/snapshots/manifest.json) for per-dataset citations and licenses.

---

## What you do NOT need

- ❌ A database (no DB — profiles live in browser `localStorage`)
- ❌ A backend account or login
- ❌ Docker
- ❌ Python or any non-Node runtime
- ❌ Vercel, AWS, or any cloud account (unless you want to deploy)
- ❌ The Anthropic / OpenAI key — the app runs fully offline without it

---

## First-run checklist

```bash
# 1. Confirm prerequisites
node --version    # v20+ ?
npm --version     # 10+  ?

# 2. Clone + install
git clone https://github.com/<your-username>/unmapped-kairos.git
cd unmapped-kairos
npm install

# 3. (Optional) Add an LLM key
cp .env.example .env.local
# edit .env.local and set OPENAI_API_KEY=sk-... or ANTHROPIC_API_KEY=sk-ant-...

# 4. Run the dev server
npm run dev

# 5. Open in a real browser (NOT VS Code's Simple Browser)
#    http://localhost:3000
```

If `npm install` finishes without errors and `npm run dev` prints "Ready in …ms", you're set.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Pages stuck on "Loading…", no demo profiles persist | You're in **VS Code's Simple Browser** | Open `http://localhost:3000` in **Chrome, Safari, or Firefox** instead |
| `npm install` fails with `EACCES` / permission errors | Bad Node permissions | Reinstall Node from [nodejs.org](https://nodejs.org) — don't use the system version |
| `npm run dev` says port 3000 is in use | Another app already on 3000 | `npm run dev -- --port 3001` and use `http://localhost:3001` |
| Build fails on `next/font/google` | Network can't reach Google Fonts | Already handled — we use `<link>` with system-font fallback. If you still see this, hard-reload with cache disabled. |
| Header looks unstyled / no fonts | Hard-reload needed | `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Win/Linux) |
| Nia / Coach show "offline mode" | No LLM key set | Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to `.env.local` and restart the dev server |
