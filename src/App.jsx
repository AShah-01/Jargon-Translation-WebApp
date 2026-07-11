import { useEffect, useMemo, useState } from "react";
import { getHistory, getSaved, toggleSave, translate } from "./api/client";
import { rolePresets } from "./data/seedData";

function formatRoleLabel(role) {
    if (!role) {
        return "Plain English";
    }

    return role
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function App() {
    const [term, setTerm] = useState("race condition");
    const [selectedRole, setSelectedRole] = useState(null);
    const [customRole, setCustomRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [translation, setTranslation] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [dictionaryOpen, setDictionaryOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [saved, setSaved] = useState([]);

    useEffect(() => {
        getHistory().then(setHistory);
        getSaved().then(setSaved);
    }, []);

    const activeRole = selectedRole || null;

    const isSaved = useMemo(() => {
        if (!translation) {
            return false;
        }

        return saved.some(
            (item) =>
                item.term === translation.term &&
                (item.role || null) === (translation.role || null),
        );
    }, [saved, translation]);

    const targetLabel = activeRole
        ? `${formatRoleLabel(activeRole)} language`
        : "Plain English";

    const runTranslate = async (nextTerm, nextRole) => {
        const cleanTerm = nextTerm.trim();
        if (!cleanTerm) {
            setError("Enter a term or phrase to translate.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const result = await translate({ term: cleanTerm, role: nextRole });
            setTranslation(result);
            setHistory(await getHistory());
            setSaved(await getSaved());
        } catch {
            setError(
                "Translation failed. Try again or verify backend connectivity.",
            );
        } finally {
            setLoading(false);
        }
    };

    const onTranslateSubmit = async () => {
        await runTranslate(term, activeRole);
    };

    const onPresetRole = async (role) => {
        const nextRole = selectedRole === role ? null : role;
        setSelectedRole(nextRole);
        setCustomRole("");

        if (translation || term.trim()) {
            await runTranslate(term, nextRole);
        }
    };

    const onCustomRoleSubmit = async (event) => {
        event.preventDefault();
        const normalized = customRole.trim().toLowerCase();

        if (!normalized) {
            return;
        }

        setSelectedRole(normalized);
        await runTranslate(term, normalized);
    };

    const onToggleSave = async () => {
        if (!translation) {
            return;
        }

        await toggleSave(translation);
        setSaved(await getSaved());
    };

    const repopulateFromEntry = (entry) => {
        setTerm(entry.term);
        setSelectedRole(entry.role || null);
        setCustomRole(entry.role || "");
        setTranslation(entry);
        setHistoryOpen(false);
        setDictionaryOpen(false);
    };

    return (
        <div className="app-shell">
            <header className="topbar">
                <div className="brand">Jargon Translator</div>
                <nav className="tabs" aria-label="Main tabs">
                    <button type="button" className="tab active">
                        Text
                    </button>
                </nav>
            </header>

            <main className="translator-layout">
                <section className="panel input-panel">
                    <div className="panel-head">
                        <span className="pill">Jargon</span>
                        <button
                            type="button"
                            className="ghost"
                            onClick={onTranslateSubmit}
                        >
                            Translate
                        </button>
                    </div>
                    <textarea
                        className="term-input"
                        value={term}
                        onChange={(event) => setTerm(event.target.value)}
                        placeholder="Enter jargon..."
                    />
                </section>

                <div className="flow-arrow" aria-hidden="true">
                    →
                </div>

                <section className="panel output-panel">
                    <div className="panel-head">
                        <span className="pill accent">{targetLabel}</span>
                        <button
                            type="button"
                            className={`star ${isSaved ? "saved" : ""}`}
                            onClick={onToggleSave}
                            disabled={!translation}
                            title={
                                isSaved
                                    ? "Remove from Dictionary"
                                    : "Save to Dictionary"
                            }
                        >
                            {isSaved ? "★ Saved" : "☆ Save"}
                        </button>
                    </div>

                    {loading ? (
                        <div
                            className="shimmer"
                            aria-label="Loading translation"
                        />
                    ) : (
                        <div className="output-body">
                            <p className="output-main">
                                {translation?.output ||
                                    "Your translation appears here."}
                            </p>
                            <p className="meta">
                                <strong>Analogy:</strong>{" "}
                                {translation?.analogy || "None"}
                            </p>
                            <p
                                className={`meta caution ${translation?.caution ? "show" : ""}`}
                            >
                                <strong>Caution:</strong>{" "}
                                {translation?.caution || "No caution flags."}
                            </p>
                            {translation?.cached ? (
                                <span className="cache-tag">
                                    Cached result
                                </span>
                            ) : null}
                        </div>
                    )}
                    {error ? <p className="error-msg">{error}</p> : null}
                </section>
            </main>

            <section className="role-zone">
                <div className="chips" aria-label="Role presets">
                    <button
                        type="button"
                        className={`chip ${selectedRole === null ? "active" : ""}`}
                        onClick={() => onPresetRole(null)}
                    >
                        Plain
                    </button>
                    {rolePresets.map((role) => (
                        <button
                            type="button"
                            key={role}
                            className={`chip ${selectedRole === role ? "active" : ""}`}
                            onClick={() => onPresetRole(role)}
                        >
                            {formatRoleLabel(role)}
                        </button>
                    ))}
                </div>

                <form className="custom-role" onSubmit={onCustomRoleSubmit}>
                    <input
                        value={customRole}
                        onChange={(event) => setCustomRole(event.target.value)}
                        placeholder="Custom role (e.g. actuary, beekeeper)"
                        aria-label="Custom role"
                    />
                    <button type="submit">Apply Role</button>
                </form>
            </section>

            <footer className="dock">
                <button
                    type="button"
                    className={`dock-btn ${historyOpen ? "active" : ""}`}
                    onClick={() => {
                        setHistoryOpen((prev) => !prev);
                        setDictionaryOpen(false);
                    }}
                >
                    History
                </button>
                <button
                    type="button"
                    className={`dock-btn ${dictionaryOpen ? "active" : ""}`}
                    onClick={() => {
                        setDictionaryOpen((prev) => !prev);
                        setHistoryOpen(false);
                    }}
                >
                    Dictionary
                </button>
            </footer>

            {historyOpen ? (
                <aside className="drawer">
                    <h3>History</h3>
                    {history.length === 0 ? (
                        <p className="empty">No history yet.</p>
                    ) : null}
                    {history.map((item, index) => (
                        <button
                            key={`${item.term}-${item.ts}-${index}`}
                            type="button"
                            className="drawer-item"
                            onClick={() => repopulateFromEntry(item)}
                        >
                            <strong>{item.term}</strong>
                            <span>{item.role || "plain"}</span>
                        </button>
                    ))}
                </aside>
            ) : null}

            {dictionaryOpen ? (
                <aside className="drawer">
                    <h3>Dictionary</h3>
                    {saved.length === 0 ? (
                        <p className="empty">No saved terms yet.</p>
                    ) : null}
                    {saved.map((item, index) => (
                        <button
                            key={`${item.term}-saved-${index}`}
                            type="button"
                            className="drawer-item"
                            onClick={() => repopulateFromEntry(item)}
                        >
                            <strong>{item.term}</strong>
                            <span>{item.role || "plain"}</span>
                        </button>
                    ))}
                </aside>
            ) : null}
        </div>
    );
}

export default App;
