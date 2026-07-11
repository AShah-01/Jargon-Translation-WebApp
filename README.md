# Jargon-Translation-WebApp

Modern React frontend for translating jargon into:

- Plain English (default)
- Role-specific language (preset and freeform roles)

The UI follows the product flow in PLAN.md and is built to connect to a Python backend without frontend crashes.

## Tech Stack

- React (Vite)
- HTML/CSS/JavaScript
- Local mock + API adapter for backend readiness

## Features Implemented

- Google-Translate-style two-pane layout
- Direction swap (jargon to output / output to jargon)
- Role chips: Client, Exec, PM, Nurse, Lawyer, Electrician
- Freeform role input
- Translation output with analogy and caution sections
- Loading shimmer and error/fallback handling
- Auto history logging
- Saved terms toggle
- Quiz tab sourced from saved/history entries
- Seeded starter data across multiple domains

## Python Backend Ready Contract

Frontend expects this endpoint:

- POST /translate

Request JSON:

- term: string
- role: null or string
- direction: jargon2output or output2jargon

Response JSON:

- output: string
- analogy: string or null
- caution: string or null

If backend is unavailable, frontend falls back to a mock response and surfaces a caution message instead of breaking.

## Environment

Copy .env.example to .env and set:

- VITE_API_BASE_URL=http://127.0.0.1:8000
- VITE_USE_MOCK=true (default for frontend-only)
- VITE_USE_MOCK=false (when Python backend is live)

## Run Locally

Prerequisite: install Node.js 18+ (includes npm).

Then run:

1. npm install
2. npm run dev

## Project Structure

- index.html
- src/main.jsx
- src/App.jsx
- src/styles.css
- src/api/client.js
- src/data/seedData.js
- .env.example

## Notes

- Frontend is designed so backend integration can be done incrementally.
- API communication is isolated in src/api/client.js for easy swap to real Python services.
- PLAN.md remains the product specification source.
