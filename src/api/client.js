const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const USE_MOCK =
    (import.meta.env.VITE_USE_MOCK || "true").toLowerCase() === "true";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeRole = (role) => {
    if (!role || role === "plain") {
        return null;
    }

    return String(role).trim().toLowerCase();
};

const getMockTranslation = (term, role) => {
    const normalizedRole = normalizeRole(role);

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

async function apiGet(path) {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
        throw new Error(`GET ${path} failed (${response.status})`);
    }
    return response.json();
}

async function apiPost(path, body) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        throw new Error(`POST ${path} failed (${response.status})`);
    }
    return response.json();
}

// The backend is the single source of truth for the cache, History, and
// Saved list (see backend/src/storage.js) — this client just calls it.
// Mock mode is the one exception: it never touches the backend at all.
export async function translate({ term, role = null }) {
    const normalizedRole = normalizeRole(role);

    if (USE_MOCK) {
        await sleep(350);
        return {
            term,
            role: normalizedRole,
            cached: false,
            ...getMockTranslation(term, normalizedRole),
        };
    }

    try {
        return await apiPost("/translate", { term, role: normalizedRole });
    } catch {
        await sleep(200);
        return {
            term,
            role: normalizedRole,
            cached: false,
            ...getMockTranslation(term, normalizedRole),
            caution:
                "Backend unavailable. Showing fallback result. Verify the API at /translate.",
        };
    }
}

export async function getHistory() {
    try {
        return await apiGet("/history");
    } catch {
        return [];
    }
}

export async function getSaved() {
    try {
        return await apiGet("/saved");
    } catch {
        return [];
    }
}

export async function toggleSave(entry) {
    try {
        const { saved } = await apiPost("/saved/toggle", {
            term: entry.term,
            role: entry.role,
        });
        return saved;
    } catch {
        return false;
    }
}
