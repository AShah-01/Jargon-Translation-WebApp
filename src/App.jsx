import { useMemo, useState } from "react";
import {
    getHistory,
    getQuizQuestion,
    getSaved,
    toggleSave,
    translate,
} from "./api/client";
import { rolePresets } from "./data/seedData";

const tabs = ["Text", "Quiz"];

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
    const [activeTab, setActiveTab] = useState("Text");
    const [term, setTerm] = useState("race condition");
    const [direction, setDirection] = useState("jargon2output");
    const [selectedRole, setSelectedRole] = useState(null);
    const [customRole, setCustomRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [translation, setTranslation] = useState(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [savedOpen, setSavedOpen] = useState(false);
    const [history, setHistory] = useState(() => getHistory());
    const [saved, setSaved] = useState(() => getSaved());

    const activeRole = selectedRole || null;

    const isSaved = useMemo(() => {
        if (!translation) {
            return false;
        }

        return saved.some(
            (item) =>
                item.term === translation.term &&
                (item.role || null) === (translation.role || null) &&
                item.direction === translation.direction,
        );
    }, [saved, translation]);

    const targetLabel =
        direction === "jargon2output"
            ? activeRole
                ? `${formatRoleLabel(activeRole)} language`
                : "Plain English"
            : activeRole
              ? `${formatRoleLabel(activeRole)} jargon`
              : "Domain jargon";

    const runTranslate = async (nextTerm, nextRole, nextDirection) => {
        const cleanTerm = nextTerm.trim();
        if (!cleanTerm) {
            setError("Enter a term or phrase to translate.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const result = await translate({
                term: cleanTerm,
                role: nextRole,
                direction: nextDirection,
            });
            setTranslation(result);
            setHistory(getHistory());
            setSaved(getSaved());
        } catch {
            setError(
                "Translation failed. Try again or verify backend connectivity.",
            );
        } finally {
            setLoading(false);
        }
    };

    const onTranslateSubmit = async () => {
        await runTranslate(term, activeRole, direction);
    };

    const onPresetRole = async (role) => {
        const nextRole = selectedRole === role ? null : role;
        setSelectedRole(nextRole);
        setCustomRole("");

        if (translation || term.trim()) {
            await runTranslate(term, nextRole, direction);
        }
    };

    const onCustomRoleSubmit = async (event) => {
        event.preventDefault();
        const normalized = customRole.trim().toLowerCase();

        if (!normalized) {
            return;
        }

        setSelectedRole(normalized);
        await runTranslate(term, normalized, direction);
    };

    const onSwapDirection = async () => {
        const nextDirection =
            direction === "jargon2output" ? "output2jargon" : "jargon2output";
        setDirection(nextDirection);

        if (translation || term.trim()) {
            await runTranslate(term, activeRole, nextDirection);
        }
    };

    const onToggleSave = () => {
        if (!translation) {
            return;
        }

        toggleSave(translation);
        setSaved(getSaved());
    };

    const repopulateFromEntry = async (entry) => {
        setTerm(entry.term);
        setSelectedRole(entry.role || null);
        setCustomRole(entry.role || "");
        setDirection(entry.direction);
        setTranslation(entry);
        setHistoryOpen(false);
        setSavedOpen(false);
    };

    const quiz = getQuizQuestion();

    return (
        <div className="app-shell">
            <header className="topbar">
                <div className="brand">Jargon Translator</div>
                <nav className="tabs" aria-label="Main tabs">
                    {tabs.map((tab) => (
                        <button
                            type="button"
                            key={tab}
                            className={`tab ${activeTab === tab ? "active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </header>

            {activeTab === "Text" ? (
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
                            placeholder="Enter jargon or plain description..."
                        />
                    </section>

                    <button
                        type="button"
                        className="swap-button"
                        onClick={onSwapDirection}
                        aria-label="Swap translation direction"
                        title="Swap direction"
                    >
                        ⇄
                    </button>

                    <section className="panel output-panel">
                        <div className="panel-head">
                            <span className="pill accent">{targetLabel}</span>
                            <button
                                type="button"
                                className={`star ${isSaved ? "saved" : ""}`}
                                onClick={onToggleSave}
                                aria-label="Toggle save"
                                title="Save translation"
                            >
                                ★
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
                                    {translation?.caution ||
                                        "No caution flags."}
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
            ) : (
                <section className="quiz-panel panel">
                    <div className="panel-head">
                        <span className="pill">Quiz</span>
                    </div>
                    {!quiz ? (
                        <p className="empty">
                            Save at least four items to start quiz mode.
                        </p>
                    ) : (
                        <div className="quiz-card">
                            <h2>Which output matches: {quiz.term}?</h2>
                            <div className="quiz-options">
                                {quiz.options.map((option) => (
                                    <button
                                        type="button"
                                        key={option}
                                        className="quiz-option"
                                        title={
                                            option === quiz.correct
                                                ? "Correct answer"
                                                : "Option"
                                        }
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

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
                        setSavedOpen(false);
                    }}
                >
                    History
                </button>
                <button
                    type="button"
                    className={`dock-btn ${savedOpen ? "active" : ""}`}
                    onClick={() => {
                        setSavedOpen((prev) => !prev);
                        setHistoryOpen(false);
                    }}
                >
                    Saved
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
                            <span>
                                {item.role || "plain"} · {item.direction}
                            </span>
                        </button>
                    ))}
                </aside>
            ) : null}

            {savedOpen ? (
                <aside className="drawer">
                    <h3>Saved</h3>
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
                            <span>
                                {item.role || "plain"} · {item.direction}
                            </span>
                        </button>
                    ))}
                </aside>
            ) : null}
        </div>
    );
}

export default App;
