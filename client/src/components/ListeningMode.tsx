import { useState } from "react";
import { getListeningExercise } from "../api";
import type { ListeningExercise } from "../types";
import { useTextToSpeech } from "../hooks/useSpeech";

const TOPICS = [
  "一次旅行",
  "校园新闻",
  "中国历史小故事",
  "科技与生活",
  "一段朋友间的对话",
  "环保话题",
];

export function ListeningMode() {
  const [topic, setTopic] = useState("");
  const [exercise, setExercise] = useState<ListeningExercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showTranscript, setShowTranscript] = useState(false);
  const [rate, setRate] = useState(0.9);

  const tts = useTextToSpeech();

  async function load(chosen: string) {
    setLoading(true);
    setError("");
    setExercise(null);
    setAnswers({});
    setShowTranscript(false);
    try {
      const ex = await getListeningExercise(chosen);
      setExercise(ex);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const allAnswered =
    exercise != null && exercise.questions.every((_, i) => answers[i] !== undefined);
  const score =
    exercise?.questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0),
      0
    ) ?? 0;

  return (
    <div className="panel">
      <h2>听力练习 · Listening</h2>
      <p className="muted">
        Listen to a short passage (no peeking!), answer the questions, then reveal the transcript
        with pinyin and translation.
      </p>

      <div className="chips">
        {TOPICS.map((t) => (
          <button key={t} className="chip" onClick={() => load(t)} disabled={loading}>
            {t}
          </button>
        ))}
      </div>
      <div className="row">
        <input
          className="text-input"
          placeholder="…or your own topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && topic.trim() && load(topic.trim())}
        />
        <button className="btn primary" onClick={() => topic.trim() && load(topic.trim())} disabled={loading}>
          Generate
        </button>
      </div>

      {loading && <p className="muted">Generating a fresh passage…</p>}
      {error && <p className="error">{error}</p>}

      {exercise && (
        <div className="exercise">
          <h3>{exercise.title_hanzi}</h3>

          <div className="player">
            <button className="btn primary" onClick={() => tts.speak(exercise.passage.hanzi, rate)}>
              {tts.speaking ? "▶︎ Playing…" : "🔊 Play passage"}
            </button>
            <button className="btn ghost" onClick={() => tts.stop()}>
              Stop
            </button>
            <label className="rate">
              Speed
              <input
                type="range"
                min={0.5}
                max={1.1}
                step={0.05}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
              <span>{rate.toFixed(2)}×</span>
            </label>
          </div>
          {!tts.hasMandarinVoice && (
            <p className="muted small">
              No Mandarin voice detected in your browser. On Chrome/Edge you may need to install a
              zh-CN voice in your OS speech settings.
            </p>
          )}

          <div className="questions">
            {exercise.questions.map((q, qi) => (
              <div key={qi} className="question">
                <div className="q-text">
                  {qi + 1}. {q.question_english}
                </div>
                <div className="options">
                  {q.options_english.map((opt, oi) => {
                    const chosen = answers[qi] === oi;
                    const reveal = answers[qi] !== undefined;
                    const correct = oi === q.correct_index;
                    const cls = reveal
                      ? correct
                        ? "correct"
                        : chosen
                          ? "wrong"
                          : ""
                      : chosen
                        ? "chosen"
                        : "";
                    return (
                      <button
                        key={oi}
                        className={`option ${cls}`}
                        disabled={answers[qi] !== undefined}
                        onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                      >
                        {String.fromCharCode(65 + oi)}. {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {allAnswered && (
            <div className="score">
              Score: {score} / {exercise.questions.length}
            </div>
          )}

          <button className="btn ghost" onClick={() => setShowTranscript((s) => !s)}>
            {showTranscript ? "Hide transcript" : "Show transcript"}
          </button>
          {showTranscript && (
            <div className="transcript">
              <p className="t-hanzi">{exercise.passage.hanzi}</p>
              <p className="t-pinyin">{exercise.passage.pinyin}</p>
              <p className="t-english">{exercise.passage.english}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
