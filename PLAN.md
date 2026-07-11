# Jargon Translator — 1-Hour Build Plan

A Google-Translate-style web app that translates **any jargon → plain English, or into the jargon
of a chosen job/role**. Not just tech — legal, medical, finance, trades, academia, whatever the
user types. The user enters a jargon term/phrase, then optionally selects (or types) a **job/role**
to translate it for. Default output is plain English; picking a role re-pitches the same input in
that role's own vocabulary. Two people: one frontend, one backend. Realistic to ship in one hour.

---

## The core idea

Every translation quietly saves an entry. That saved set is, at the same time:

- the **cache** (repeat term+role pairs never re-hit the API),
- the **History** (everything, auto-logged),
- the **Saved** list (the subset you star), and
- the **quiz bank**.

Translator and quiz are not two features — they are the same data viewed two ways. Building around
this keeps the whole thing hour-sized.

---

## Phase 0 — Build the Skill first (0 → 10 min)

Before any frontend or backend scaffolding, write and validate the **Skill** standalone. This is
the one piece of real "product" risk (does the model reliably do the reshaping we want?), so prove
it cheaply before wiring a UI or storage around it.

1. Create `SKILL.md` (name + description frontmatter, then instructions) that takes a jargon
   term/phrase, an optional **source domain**, and a **target role** (or "plain English" as the
   default target), and returns the JSON shape below. No app code yet.
2. Test it live in Claude Code against a spread of sample inputs — a tech term, a legal term, a
   medical term, a finance term — each translated to plain English *and* to 2-3 different roles
   (e.g. "nurse," "electrician," a freeform one you make up on the spot). Confirm the JSON is
   clean and the role-jargon output actually sounds like that role, not just simpler English.
3. Lock the finalized instructions. This is what gets pasted into the backend's real API call in
   the Backend track — the backend doesn't re-derive the prompt, it reuses what Phase 0 validated.

Both people should be in the room for this — it's the 10 minutes that determines whether the rest
of the hour is building on solid ground.

---

## UI mapping (based on the Google Translate layout)

| Google Translate element      | Our app                                                                 |
| ----------------------------- | ------------------------------------------------------------------------ |
| Right-side language tabs      | **Role picker: preset chips (Client, Exec, PM, Nurse, Lawyer, …) + a freeform text field** |
| Left-side language row        | A single **"Jargon"** label (source is always jargon, any domain)      |
| Swap arrows                   | **Flip direction**: jargon→output or plain-description→jargon           |
| Left pane                     | Jargon input (mono font)                                                |
| Right "Translation" pane      | **One output at a time** — plain English by default, or the selected role's jargon once a role is picked — plus analogy and caution |
| History (clock)               | Every translation, auto-logged                                          |
| Saved (star)                  | Starred subset — the quiz pulls from here                               |
| Top tabs (Text/Images/…)      | Keep **Text** active; relabel one as **Quiz**                           |

### Roles
- **Default: Plain English** — no role selected, zero jargon, just what it means.
- **Preset chips** for a fast, reliable demo — a handful covering different worlds, e.g. **Client,
  Exec, PM, Nurse, Lawyer, Electrician**.
- **Freeform field** — type any job/role not in the presets ("beekeeper," "actuary," whatever).
  Normalize it the same way as a preset (lowercase, trim) when building cache keys.

Selecting a role re-runs the translation live, swapping the output pane from plain English to that
role's own jargon for the same input — that live re-pitch is the product's "wow" moment (the
equivalent of Google swapping languages instantly).

---

## The contract (agree by minute 15, then never block each other)

Frontend calls only these. It never touches storage or the API directly.

```
translate({ term, role, direction })
  -> { output, analogy, caution, cached }

role:      null (= plain English) | preset slug ('client' | 'exec' | 'pm' | 'nurse' | ...) | freeform string
direction: 'jargon2output' | 'output2jargon'
  - jargon2output: input is a jargon term/phrase -> output is plain English or the selected role's jargon
  - output2jargon: input is a plain description -> output is the jargon term (optionally in the selected role's world)

getHistory()          -> [{ term, output, role, direction, ts }]
getSaved()             -> [ same shape ]
toggleSave(term, role) -> boolean (now saved?)
getQuizQuestion()      -> { term, correct, options[4] }
```

**Backend's first move:** hand frontend a 5-line **mock `translate()`** that returns fake JSON
instantly, so nobody waits on the real API.

**Set the integration alarm for 50:00.**

---

## The Skill (recap — built and validated in Phase 0)

Return JSON only (no prose, no markdown fences). Keys:

- `output` — the jargon rewritten as plain English (role is `null`) or in the selected role's own
  vocabulary (role is set).
- `analogy` — one optional everyday comparison (great for abstract terms).
- `caution` — a short flag if simplifying loses something the target needs (e.g. a security or
  liability caveat). This is what keeps it from being a dumb thesaurus.

The prompt must respect `role` (including arbitrary freeform roles it's never seen) and
`direction`.

---

## Storage design

- Cache key: `glossary:{role-slug}:{direction}:{slug}` — `role-slug` is `plain` by default, or the
  normalized preset/freeform role (lowercase, trim, hyphenate spaces). Normalize the term the same
  way. **Role must be in the key**, or a client gets served the electrician version.
- Value: `{ term, output, analogy, caution, role, direction, ts }`
- Saved key: `saved:{role-slug}:{slug}`
- Before calling the API: check the key. Hit -> render from storage (`cached: true`).
  Miss -> call API, parse, save, return.
- Quiz bank = `storage.list('saved:')`. No separate structure needed.
- **Seed ~12 terms spanning domains** on first run — a few tech (API, latency, race condition), a
  few legal (indemnify, force majeure), a couple medical (contraindication, prognosis), a couple
  finance (amortize, liquidity) — each seeded with a plain-English entry so History / Saved / Quiz
  aren't empty at launch and immediately demonstrate "not just tech jargon."

---

## Frontend track (15 → 50 min) — rebuild the screenshot, against the mock

1. **Shell (~12 min):** tab row with Text as the active blue pill; two rounded panes (white left,
   grey right); center swap arrows; "Jargon" label left; role chips + freeform field on the right
   with an active state showing which is selected (or none, for plain English); two circular
   History + Saved buttons below. Static, no logic.
2. **Wire the mock (~10 min):** typing left fills the right "Translation" area with `output`
   (default plain English); `analogy` and `caution` beneath it (caution in a warning tint). Add
   loading (right-pane shimmer) and error states.
3. **Interactions (~7 min):** picking a role chip or submitting the freeform field re-calls
   `translate` with the new `role` and swaps the output pane live; swap arrows flip `direction`;
   star calls `toggleSave`.
4. **History & Saved (~6 min):** clicking either opens a list; clicking an item repopulates both
   panes (input + role + output).

## Backend track (15 → 50 min) — fill the functions

1. **Wire in the Skill (~5 min):** paste the finalized Phase 0 prompt into the real API call — no
   re-deriving it, Phase 0 already proved it works.
2. **`translate()` (~14 min):** normalize term + role, build cache key, `storage.get` first (hit
   returns cached), miss calls API, strips code fences, parses, saves, returns. try/catch for API +
   parse failures. Must handle an arbitrary freeform role it's never seen.
3. **History & Saved (~8 min):** auto-append every successful translate to history; `toggleSave`
   writes/removes `saved:` key; `getHistory` / `getSaved` read them back.
4. **Seed + quiz (~8 min):** `seedIfEmpty()` across domains; `getQuizQuestion()` pulls one saved
   term as the answer + three others as distractors.

---

## Integration (50 → 58 min) — one person drives

Paste backend in, swap the mock for the real `translate()`. Test the four things that matter:

1. A real translation renders with analogy + caution, for both a preset role and a freeform-typed
   role.
2. **Repeating a term+role is instant, no spinner** (cache proof).
3. A fresh load shows seeded History spanning more than one domain.
4. The quiz pulls real terms.

Most bugs here are key-name mismatches between the two halves — fix those first.

## Last 2 minutes — both

Click through at mobile width, check empty states, an obviously junk term, and a silly freeform
role. Ship.

---

## Descope order (if behind)

Cut in this order — a working plain-English + role translator with History and Saved is a
complete, demoable app on its own. Phase 0 (the Skill) is not optional — everything downstream
depends on it, so protect that 10 minutes above all else.

1. Quiz (it's the "extend," not the core)
2. Freeform role input (fall back to presets only)
3. Swap direction
4. `analogy` / `caution`

---

## Stretch / MCP (later)

Push the glossary to a **Notion database** so it becomes a shared team dictionary — devs,
stakeholders, and other roles reading the same definitions across domains. That's the workflow
piece (input -> skill reshapes -> MCP stores), and it turns a personal toy into something a whole
team, not just engineers, actually uses.
