import { runSkill } from './skill.js';
import * as storage from './storage.js';

export async function translate({ term, role, direction }) {
  if (!term || !term.trim()) {
    throw Object.assign(new Error('term is required'), { status: 400 });
  }
  const dir = direction === 'output2jargon' ? 'output2jargon' : 'jargon2output';
  const cleanTerm = term.trim();
  const roleForSkill = role && storage.normalizeRole(role) !== 'plain' ? role : null;

  const cached = storage.getCached(cleanTerm, role, dir);
  if (cached) {
    return { ...cached, cached: true };
  }

  const result = await runSkill({ term: cleanTerm, role: roleForSkill, direction: dir });

  const entry = {
    term: cleanTerm,
    output: result.output,
    analogy: result.analogy,
    caution: result.caution,
    role: roleForSkill,
    direction: dir,
    ts: Date.now(),
  };

  storage.cacheTranslation(entry);
  return { ...entry, cached: false };
}
