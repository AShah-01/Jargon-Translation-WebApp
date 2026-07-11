import { seedHistory } from "../data/seedData";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const USE_MOCK =
    (import.meta.env.VITE_USE_MOCK || "true").toLowerCase() === "true";

const STORAGE_KEYS = {
    history: "jt.history.v1",
    saved: "jt.saved.v1",
    cache: "jt.cache.v1",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeRole = (role) => {
    if (!role || role === "plain") {
        return null;
    }

    return String(role).trim().toLowerCase();
};

const slugify = (text) =>
    String(text || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

const readJson = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) {
            return fallback;
        }

        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const writeJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

const seedIfEmpty = () => {
    const current = readJson(STORAGE_KEYS.history, []);
    if (current.length === 0) {
        writeJson(STORAGE_KEYS.history, seedHistory);
    }
};

const upsertHistory = (entry) => {
    const current = readJson(STORAGE_KEYS.history, []);
    writeJson(STORAGE_KEYS.history, [entry, ...current].slice(0, 200));
};

const makeCacheKey = (term, role, direction) => {
    const roleSlug = slugify(role || "plain");
    const termSlug = slugify(term);
    return `${roleSlug}:${direction}:${termSlug}`;
};

const getMockTranslation = (term, role, direction) => {
    const normalizedRole = normalizeRole(role);

    if (direction === "output2jargon") {
        return {
            output:
                term.length > 30
                    ? "Domain-specific term"
                    : `Likely jargon: ${term}`,
            analogy: null,
            caution:
                "This is mock mode. Connect the Python backend for accurate output.",
        };
    }

    if (!normalizedRole) {
        return {
            output: `Plain English: ${term} means the core idea explained without specialist wording.`,
            analogy:
                "Think of translating a recipe from chef shorthand into steps anyone can follow.",
            caution: null,
        };
    }

    return {
        output: `${normalizedRole} framing: ${term} described in terms this role uses every day.`,
        analogy: null,
        caution:
            "Role tone is mocked. Connect backend for model-generated role-accurate language.",
    };
};

const toEntry = (term, role, direction, result, cached = false) => ({
    term,
    output: result.output,
    analogy: result.analogy,
    caution: result.caution,
    role: normalizeRole(role),
    direction,
    cached,
    ts: new Date().toISOString(),
});

const callBackendTranslate = async ({ term, role, direction }) => {
    const response = await fetch(`${API_BASE_URL}/translate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ term, role, direction }),
    });

    if (!response.ok) {
        throw new Error(`Translate API failed (${response.status})`);
    }

    const payload = await response.json();
    return {
        output: payload.output,
        analogy: payload.analogy || null,
        caution: payload.caution || null,
    };
};

export async function translate({
    term,
    role = null,
    direction = "jargon2output",
}) {
    seedIfEmpty();

    const normalizedRole = normalizeRole(role);
    const cacheKey = makeCacheKey(term, normalizedRole, direction);
    const cache = readJson(STORAGE_KEYS.cache, {});

    if (cache[cacheKey]) {
        const hit = toEntry(
            term,
            normalizedRole,
            direction,
            cache[cacheKey],
            true,
        );
        upsertHistory(hit);
        return hit;
    }

    let result;

    if (USE_MOCK) {
        await sleep(350);
        result = getMockTranslation(term, normalizedRole, direction);
    } else {
        try {
            result = await callBackendTranslate({
                term,
                role: normalizedRole,
                direction,
            });
        } catch {
            await sleep(200);
            result = {
                ...getMockTranslation(term, normalizedRole, direction),
                caution:
                    "Backend unavailable. Showing fallback result. Verify Python API at /translate.",
            };
        }
    }

    cache[cacheKey] = result;
    writeJson(STORAGE_KEYS.cache, cache);

    const entry = toEntry(term, normalizedRole, direction, result, false);
    upsertHistory(entry);

    return entry;
}

export function getHistory() {
    seedIfEmpty();
    return readJson(STORAGE_KEYS.history, []);
}

export function getSaved() {
    return readJson(STORAGE_KEYS.saved, []);
}

export function toggleSave(entry) {
    const saved = readJson(STORAGE_KEYS.saved, []);
    const role = normalizeRole(entry.role);
    const key = `${slugify(entry.term)}:${slugify(role || "plain")}:${entry.direction}`;
    const idx = saved.findIndex((item) => {
        const itemKey = `${slugify(item.term)}:${slugify(item.role || "plain")}:${item.direction}`;
        return itemKey === key;
    });

    if (idx >= 0) {
        saved.splice(idx, 1);
        writeJson(STORAGE_KEYS.saved, saved);
        return false;
    }

    saved.unshift(entry);
    writeJson(STORAGE_KEYS.saved, saved.slice(0, 200));
    return true;
}

export function getQuizQuestion() {
    const saved = getSaved();
    const source = saved.length >= 4 ? saved : getHistory();

    if (source.length < 4) {
        return null;
    }

    const shuffled = [...source].sort(() => Math.random() - 0.5);
    const correct = shuffled[0];
    const options = shuffled.slice(0, 4).map((item) => item.output);

    return {
        term: correct.term,
        correct: correct.output,
        options: options.sort(() => Math.random() - 0.5),
    };
}
