# Jargon Translator

A Google-Translate-style web app that translates jargon from **any domain** (tech, legal,
medical, finance, trades, academia, ...) into plain English, or into the jargon of a chosen
job/role. See [PLAN.md](PLAN.md) for the full product spec and [the Skill](.claude/skills/jargon-translator/SKILL.md)
for the translation prompt itself.

## How it works

1. Enter a jargon term or phrase.
2. Optionally pick a role (preset chip or freeform text) — Client, Exec, PM, Nurse, Lawyer,
   Electrician, or anything you type.
3. Get back plain English (default) or that role's own framing of the term, plus an optional
   analogy and a caution flag if simplifying loses something the audience needs to know.

Every translation is cached, auto-logged to History, and can be starred into a personal
Dictionary — that's also the seed data, so the app isn't empty on first load.

## Tech stack

- **Frontend** (repo root): React + Vite, plain CSS.
- **Backend** (`backend/`): Node.js + Express, in-memory cache (no database).
- **Translation**: Anthropic Claude API, driven by the `jargon-translator` Skill
  (`.claude/skills/jargon-translator/SKILL.md`), which the backend loads as its system prompt.

## API contract

The frontend (`src/api/client.js`) talks to the backend over this contract:

```
POST /api/translate
  body: { term: string, role: string|null }
  -> { term, output, analogy, caution, role, ts, cached }

GET  /api/history        -> [{ term, output, role, ts }]
GET  /api/saved          -> [ same shape ]
POST /api/saved/toggle
  body: { term: string, role: string|null }
  -> { saved: boolean }
```

If the backend is unreachable, the frontend falls back to a local mock response and surfaces a
caution message instead of breaking.

## Run locally

Prerequisite: Node.js 18+.

**Backend**
```
cd backend
npm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY
npm start
```
Runs on `http://localhost:3001`.

**Frontend** (from the repo root, in a separate terminal)
```
npm install
npm run dev
```
Runs on `http://localhost:5173`. Copy `.env.example` to `.env` and set:
- `VITE_API_BASE_URL=http://127.0.0.1:3001/api`
- `VITE_USE_MOCK=false` (set to `true` to run the UI without a backend)

## Project structure

```
src/                        frontend (React + Vite)
  App.jsx                   translator UI (input, role picker, History/Dictionary)
  api/client.js              backend API client (+ mock fallback)
  data/seedData.js           role preset list
  styles.css
backend/                     backend (Node + Express)
  src/server.js               Express routes
  src/translateService.js     cache-first translate()
  src/storage.js               in-memory cache / History / Saved
  src/skill.js                 loads the Skill, calls the Anthropic API
  src/seed.js                  seeds ~12 terms across domains on first run
.claude/skills/jargon-translator/SKILL.md   the translation prompt itself
PLAN.md                       product spec / build plan
```

## Notes

- The backend is the single source of truth for the cache, History, and Saved/Dictionary data —
  the frontend doesn't maintain its own copy.
- `backend/.env` holds your API key and is gitignored; never commit it.
