import { useState } from "react";
import { getVocabSet } from "../api";
import type { VocabItem, VocabSet } from "../types";
import { useTextToSpeech } from "../hooks/useSpeech";

const THEMES = [
  "学校与学习",
  "情绪与性格",
  "科技与网络",
  "健康与运动",
  "环境与自然",
  "成语故事",
];

export function VocabMode() {
  const [theme, setTheme] = useState("");
  const [set, setSet] = useState<VocabSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // Spaced-repetition-lite: items the learner marked "still learning" get re-queued.
  const [queue, setQueue] = useState<number[]>([]);
  const [known, setKnown] = useState<Set<number>>(new Set());

  const tts = useTextToSpeech();

  async function load(chosen: string) {
    setLoading(true);
    setError("");
    setSet(null);
    try {
      const data = await getVocabSet(chosen);
      setSet(data);
      setQueue(data.items.map((_, i) => i));
      setKnown(new Set());
      setIndex(0);
      setFlipped(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function grade(gotIt: boolean) {
    if (!set) return;
    const current = queue[index];
    setKnown((prev) => {
      const next = new Set(prev);
      if (gotIt) next.add(current);
      else next.delete(current);
      return next;
    });
    // If not known, push it to the back of the queue to see again.
    setQueue((prev) => {
      const rest = prev.slice(index + 1);
      const reviewed = prev.slice(0, index + 1);
      const requeue = gotIt ? [] : [current];
      return [...reviewed, ...rest, ...requeue];
    });
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  const item: VocabItem | undefined = set && queue[index] !== undefined ? set.items[queue[index]] : undefined;
  const done = set != null && index >= queue.length;

  return (
    <div className="panel">
      <h2>词汇与成语 · Vocabulary & Idioms</h2>
      <p className="muted">
        Flip through a themed deck of intermediate→advanced words and 成语. Tap the card to reveal
        the meaning and an example sentence; mark each one to focus your review.
      </p>

      <div className="chips">
        {THEMES.map((t) => (
          <button key={t} className="chip" onClick={() => load(t)} disabled={loading}>
            {t}
          </button>
        ))}
      </div>
      <div className="row">
        <input
          className="text-input"
          placeholder="…or your own theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && theme.trim() && load(theme.trim())}
        />
        <button className="btn primary" onClick={() => theme.trim() && load(theme.trim())} disabled={loading}>
          Generate deck
        </button>
      </div>

      {loading && <p className="muted">Building your deck…</p>}
      {error && <p className="error">{error}</p>}

      {set && !done && item && (
        <>
          <div className="progress">
            Card {index + 1} of {queue.length} · {known.size}/{set.items.length} mastered
          </div>
          <div className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
            {!flipped ? (
              <div className="card-front">
                {item.type === "idiom" && <span className="badge">成语</span>}
                <div className="card-hanzi">{item.hanzi}</div>
                <button
                  className="speaker big"
                  title="Play"
                  onClick={(e) => {
                    e.stopPropagation();
                    tts.speak(item.hanzi);
                  }}
                >
                  🔊
                </button>
                <div className="hint">Tap to reveal</div>
              </div>
            ) : (
              <div className="card-back">
                <div className="card-pinyin">{item.pinyin}</div>
                <div className="card-english">{item.english}</div>
                <div className="example">
                  <div className="ex-hanzi">
                    {item.example.hanzi}
                    <button
                      className="speaker"
                      onClick={(e) => {
                        e.stopPropagation();
                        tts.speak(item.example.hanzi);
                      }}
                    >
                      🔊
                    </button>
                  </div>
                  <div className="ex-pinyin">{item.example.pinyin}</div>
                  <div className="ex-english">{item.example.english}</div>
                </div>
              </div>
            )}
          </div>
          <div className="grade-row">
            <button className="btn ghost" onClick={() => grade(false)}>
              Still learning ↻
            </button>
            <button className="btn primary" onClick={() => grade(true)}>
              Got it ✓
            </button>
          </div>
        </>
      )}

      {done && set && (
        <div className="done">
          <h3>复习完成！Deck complete 🎉</h3>
          <p>
            You mastered {known.size} of {set.items.length} items.
          </p>
          <button className="btn primary" onClick={() => load(set.theme_english)}>
            New deck on this theme
          </button>
        </div>
      )}
    </div>
  );
}
