import { useState } from "react";
import { ConversationMode } from "./components/ConversationMode";
import { ListeningMode } from "./components/ListeningMode";
import { VocabMode } from "./components/VocabMode";
import { VoicePicker } from "./components/VoicePicker";

type Mode = "conversation" | "listening" | "vocab";

const TABS: { id: Mode; label: string; sub: string }[] = [
  { id: "conversation", label: "对话", sub: "Conversation" },
  { id: "listening", label: "听力", sub: "Listening" },
  { id: "vocab", label: "词汇", sub: "Vocab & Idioms" },
];

export default function App() {
  const [mode, setMode] = useState<Mode>("conversation");

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="logo">说听</span>
          <div>
            <h1>Mandarin Tutor</h1>
            <p className="tagline">Level up your speaking &amp; listening · 4th grade → high school</p>
          </div>
        </div>
        <div className="header-controls">
          <nav className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab ${mode === t.id ? "active" : ""}`}
                onClick={() => setMode(t.id)}
              >
                <span className="tab-cn">{t.label}</span>
                <span className="tab-en">{t.sub}</span>
              </button>
            ))}
          </nav>
          <VoicePicker />
        </div>
      </header>

      <main className="main">
        {mode === "conversation" && <ConversationMode />}
        {mode === "listening" && <ListeningMode />}
        {mode === "vocab" && <VocabMode />}
      </main>

      <footer className="footer">
        Powered by Claude · speech via your browser. Best in Chrome or Edge.
      </footer>
    </div>
  );
}
