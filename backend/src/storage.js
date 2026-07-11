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

export function getCached(term, role) {
  const slug = normalizeSlug(term);
  const roleSlug = normalizeRole(role);
  return store.get(`glossary:${roleSlug}:${slug}`);
}

export function cacheTranslation(entry) {
  const slug = normalizeSlug(entry.term);
  const roleSlug = normalizeRole(entry.role);
  store.set(`glossary:${roleSlug}:${slug}`, entry);
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
  const savedKey = `saved:${roleSlug}:${slug}`;

  if (store.has(savedKey)) {
    store.delete(savedKey);
    return false;
  }

  const entry = store.get(`glossary:${roleSlug}:${slug}`);
  if (!entry) {
    throw Object.assign(
      new Error(`No translation cached for "${term}" (role: ${roleSlug}) — translate it before saving.`),
      { status: 404 },
    );
  }
  store.set(savedKey, entry);
  return true;
}

export function seedGlossary(entries) {
  for (const entry of entries) {
    const slug = normalizeSlug(entry.term);
    const glossaryKey = `glossary:plain:${slug}`;
    const full = {
      term: entry.term,
      output: entry.output,
      analogy: entry.analogy ?? null,
      caution: entry.caution ?? null,
      role: null,
      ts: entry.ts,
    };
    if (!store.has(glossaryKey)) store.set(glossaryKey, full);

    const savedKey = `saved:plain:${slug}`;
    if (!store.has(savedKey)) store.set(savedKey, full);
  }
}
