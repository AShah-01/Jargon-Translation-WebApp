const store = new Map();

export function normalizeSlug(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

export function normalizeRole(role) {
  const slug = normalizeSlug(role);
  return slug === '' || slug === 'plain' ? 'plain' : slug;
}

export function isEmpty() {
  return store.size === 0;
}

function list(prefix) {
  const out = [];
  for (const [key, value] of store.entries()) {
    if (key.startsWith(prefix)) out.push(value);
  }
  return out;
}

function findGlossaryEntry(roleSlug, slug) {
  const prefix = `glossary:${roleSlug}:`;
  let best = null;
  for (const [key, value] of store.entries()) {
    if (key.startsWith(prefix) && key.endsWith(`:${slug}`)) {
      if (!best || value.ts > best.ts) best = value;
    }
  }
  return best;
}

export function getCached(term, role, direction) {
  const slug = normalizeSlug(term);
  const roleSlug = normalizeRole(role);
  return store.get(`glossary:${roleSlug}:${direction}:${slug}`);
}

export function cacheTranslation(entry) {
  const slug = normalizeSlug(entry.term);
  const roleSlug = normalizeRole(entry.role);
  store.set(`glossary:${roleSlug}:${entry.direction}:${slug}`, entry);
}

export function getHistory() {
  return list('glossary:').sort((a, b) => b.ts - a.ts);
}

export function getSaved() {
  return list('saved:').sort((a, b) => b.ts - a.ts);
}

export function toggleSave(term, role) {
  if (!term || !term.trim()) {
    throw Object.assign(new Error('term is required'), { status: 400 });
  }
  const slug = normalizeSlug(term);
  const roleSlug = normalizeRole(role);
  const key = `saved:${roleSlug}:${slug}`;

  if (store.has(key)) {
    store.delete(key);
    return false;
  }

  const entry = findGlossaryEntry(roleSlug, slug);
  if (!entry) {
    throw Object.assign(
      new Error(`No translation cached for "${term}" (role: ${roleSlug}) — translate it before saving.`),
      { status: 404 },
    );
  }
  store.set(key, entry);
  return true;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getQuizQuestion() {
  const saved = getSaved();
  if (saved.length === 0) return null;

  const correctEntry = saved[Math.floor(Math.random() * saved.length)];

  const pool = [...saved, ...getHistory()].reduce((acc, entry) => {
    const isDupe =
      entry.term.toLowerCase() === correctEntry.term.toLowerCase() ||
      acc.some((e) => e.term.toLowerCase() === entry.term.toLowerCase());
    if (!isDupe) acc.push(entry);
    return acc;
  }, []);

  if (pool.length === 0) return null; // need at least one distractor

  const distractors = shuffle(pool)
    .slice(0, 3)
    .map((e) => e.term);
  const options = shuffle([correctEntry.term, ...distractors]);

  return {
    term: correctEntry.output,
    correct: correctEntry.term,
    options,
  };
}

export function seedGlossary(entries) {
  for (const entry of entries) {
    const slug = normalizeSlug(entry.term);
    const glossaryKey = `glossary:plain:jargon2output:${slug}`;
    const full = {
      term: entry.term,
      output: entry.output,
      analogy: entry.analogy ?? null,
      caution: entry.caution ?? null,
      role: null,
      direction: 'jargon2output',
      ts: entry.ts,
    };
    if (!store.has(glossaryKey)) store.set(glossaryKey, full);

    const savedKey = `saved:plain:${slug}`;
    if (!store.has(savedKey)) store.set(savedKey, full);
  }
}
