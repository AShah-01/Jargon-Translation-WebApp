---
name: jargon-translator
description: Translates a jargon term or phrase from any domain (tech, legal, medical, finance, trades, academia, etc.) into plain English, or into a specific job/role's own jargon, and can also go the other way (plain description -> jargon term). Use when given a `term`, an optional `role`, and an optional `direction`, and a strict-JSON translation is needed. Trigger phrases: "translate this jargon", "explain this term for a [role]", "what would a [role] call this", "/jargon-translator".
---

# Jargon Translator

Reshape one piece of language for one audience. This skill is the core "engine" behind the Jargon
Translator app (see `PLAN.md` at the repo root) — it does not talk to storage, caching, or the UI.
Given an input, it returns one clean JSON object. That's the whole job.

## Input

You will be given, either as an explicit JSON object or as a natural-language request:

- `term` (required) — the jargon term/phrase, or (if `direction` is `output2jargon`) a plain
  description to convert into jargon. Can be from **any** domain — do not assume tech.
- `role` (optional) — the target job/role to translate into (e.g. `"nurse"`, `"lawyer"`,
  `"electrician"`, or any freeform job title the user types). **Omitted, `null`, or `"plain"` means
  the target is plain English**, not any particular role's jargon.
- `direction` (optional, default `"jargon2output"`):
  - `"jargon2output"` — `term` is jargon; produce plain English (no `role`) or that role's own
    jargon (`role` set).
  - `"output2jargon"` — `term` is a plain-English description; produce the jargon term/phrase for
    it, expressed in the target role's world if `role` is set.

Examples of natural-language requests you should be able to parse without an explicit JSON input:
- "translate 'race condition' for a nurse"
- "explain 'force majeure' in plain English"
- "what would an electrician call 'a device that stops working when overloaded'"

## Output

Respond with **JSON only** — no prose, no markdown code fences, nothing before or after the
object. Exactly these three keys:

```json
{
  "output": "string",
  "analogy": "string or null",
  "caution": "string or null"
}
```

- `output` — the translated result itself:
  - `jargon2output` + no role: plain English, zero jargon, 1-3 sentences.
  - `jargon2output` + role: the same meaning re-expressed using that role's own vocabulary and
    concerns — not just "simpler," genuinely reframed for what that role cares about.
  - `output2jargon`: the jargon term or short phrase itself (not a definition), in the target
    role's terminology if `role` is set, otherwise the term's own native domain jargon.
- `analogy` — one short, optional everyday comparison that makes an abstract term click. Use
  `null` if the term doesn't need one (don't force it).
- `caution` — a short flag if simplifying loses something the target audience actually needs to
  know (a security caveat, a liability/legal nuance, a clinical risk, a financial exposure). Use
  `null` if nothing is lost. This field is what keeps the skill from being a dumb thesaurus.

## Rules

1. JSON only. No markdown fences, no leading/trailing text.
2. Respect `role` literally, including roles you've never seen before (freeform input) — infer
   plausible vocabulary and priorities for that job rather than refusing or defaulting to plain
   English.
3. Keep `output` concise: 1-3 sentences. `analogy` and `caution` are one sentence each, or `null`.
4. Never assume the domain is tech. `term` can be legal, medical, financial, a trade, academic, or
   anything else — read it for what it actually is.
5. `output2jargon` returns a term/short phrase, not a paragraph explaining the term.
6. If `term` is empty, nonsense, or not actually jargon, still return valid JSON — put a best
   effort in `output` and explain the ambiguity in `caution` rather than erroring out.

## Examples

**Input:** `{ "term": "race condition", "role": null, "direction": "jargon2output" }`
**Output:**
```json
{"output": "A bug where the outcome depends on which of two things happens first, and that order isn't guaranteed — so it works most of the time and then randomly doesn't.", "analogy": "Like two people grabbing for the last seat at the same time — who gets it depends on timing, not rules.", "caution": null}
```

**Input:** `{ "term": "race condition", "role": "nurse", "direction": "jargon2output" }`
**Output:**
```json
{"output": "It's like two staff members both adjusting the same patient's medication dose at the same time without checking each other's chart first — whichever update lands last wins, even if it's wrong.", "analogy": null, "caution": "The underlying software bug is a system reliability issue, not a clinical one — don't let this analogy imply a patient-safety process is broken."}
```

**Input:** `{ "term": "force majeure", "role": "pm", "direction": "jargon2output" }`
**Output:**
```json
{"output": "A contract clause that excuses missed deadlines or obligations when something outside anyone's control happens — natural disaster, war, that kind of thing.", "analogy": null, "caution": "Doesn't cover ordinary delays like vendor slippage or scope creep — only genuinely unforeseeable, uncontrollable events. Don't lean on it as a general schedule excuse."}
```

**Input:** `{ "term": "the system stopped responding because two processes were both waiting on each other", "role": "developer", "direction": "output2jargon" }`
**Output:**
```json
{"output": "Deadlock", "analogy": null, "caution": null}
```
