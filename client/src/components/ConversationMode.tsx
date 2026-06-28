import { useRef, useState } from "react";
import { sendConversation } from "../api";
import type { ChatTurn } from "../types";
import { useSpeechRecognition, useTextToSpeech } from "../hooks/useSpeech";

const TOPICS = [
  "我的学校生活",
  "周末计划",
  "最喜欢的电影",
  "中国的节日",
  "环境保护",
  "未来的梦想",
];

const RATING_LABEL: Record<string, string> = {
  excellent: "太棒了 Excellent",
  good: "不错 Good",
  needs_work: "继续加油 Keep working",
};

export function ConversationMode() {
  const [topic, setTopic] = useState("");
  const [started, setStarted] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [typed, setTyped] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const tts = useTextToSpeech();

  const historyForApi = (ts: ChatTurn[]) =>
    ts.map((t) => ({ role: t.role, content: t.content }));

  const scrollToBottom = () =>
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    );

  async function start(chosen: string) {
    setTopic(chosen);
    setStarted(true);
    setError("");
    setLoading(true);
    try {
      const res = await sendConversation(chosen, []);
      const assistantTurn: ChatTurn = {
        role: "assistant",
        content: res.reply.hanzi,
        pinyin: res.reply.pinyin,
        english: res.reply.english,
      };
      setTurns([assistantTurn]);
      tts.speak(res.reply.hanzi);
      scrollToBottom();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function sendUtterance(text: string) {
    if (!text.trim() || loading) return;
    const userTurn: ChatTurn = { role: "user", content: text.trim() };
    const next = [...turns, userTurn];
    setTurns(next);
    setTyped("");
    setLoading(true);
    setError("");
    scrollToBottom();
    try {
      const res = await sendConversation(topic, historyForApi(next));
      setTurns((prev) => {
        const updated = [...prev];
        // attach feedback to the user turn we just added
        const lastUserIdx = updated.map((t) => t.role).lastIndexOf("user");
        if (lastUserIdx >= 0) updated[lastUserIdx] = { ...updated[lastUserIdx], feedback: res.feedback };
        updated.push({
          role: "assistant",
          content: res.reply.hanzi,
          pinyin: res.reply.pinyin,
          english: res.reply.english,
        });
        return updated;
      });
      tts.speak(res.reply.hanzi);
      scrollToBottom();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const recognition = useSpeechRecognition(sendUtterance);

  if (!started) {
    return (
      <div className="panel">
        <h2>对话练习 · Conversation</h2>
        <p className="muted">
          Pick a topic and chat with your tutor 小李 in Mandarin. Speak with the mic (or type),
          and you'll get gentle corrections after each turn.
        </p>
        <div className="chips">
          {TOPICS.map((t) => (
            <button key={t} className="chip" onClick={() => start(t)} disabled={loading}>
              {t}
            </button>
          ))}
        </div>
        <div className="row">
          <input
            className="text-input"
            placeholder="…or type your own topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && topic.trim() && start(topic.trim())}
          />
          <button className="btn primary" onClick={() => topic.trim() && start(topic.trim())} disabled={loading}>
            Start
          </button>
        </div>
        {loading && <p className="muted">Starting…</p>}
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="row spread">
        <h2>对话练习 · {topic}</h2>
        <button className="btn ghost" onClick={() => { setStarted(false); setTurns([]); }}>
          New topic
        </button>
      </div>

      <div className="chat" ref={scrollRef}>
        {turns.map((t, i) => (
          <div key={i} className={`bubble ${t.role}`}>
            <div className="bubble-hanzi">
              {t.content}
              {t.role === "assistant" && (
                <button className="speaker" title="Play" onClick={() => tts.speak(t.content)}>
                  🔊
                </button>
              )}
            </div>
            {t.pinyin && <div className="bubble-pinyin">{t.pinyin}</div>}
            {t.english && <div className="bubble-english">{t.english}</div>}
            {t.feedback && t.feedback.notes && (
              <div className={`feedback ${t.feedback.rating}`}>
                <strong>{RATING_LABEL[t.feedback.rating] ?? t.feedback.rating}</strong>
                <div>{t.feedback.notes}</div>
                {t.feedback.corrected_hanzi && (
                  <div className="corrected">↳ {t.feedback.corrected_hanzi}</div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="bubble assistant typing">小李 is thinking…</div>}
      </div>

      {error && <p className="error">{error}</p>}

      <div className="composer">
        {recognition.supported ? (
          <button
            className={`btn mic ${recognition.listening ? "recording" : ""}`}
            onClick={() => (recognition.listening ? recognition.stop() : recognition.start())}
            disabled={loading}
          >
            {recognition.listening ? "● Listening… tap to stop" : "🎤 Speak"}
          </button>
        ) : (
          <span className="muted small">Mic not supported in this browser — type below.</span>
        )}
        <input
          className="text-input"
          placeholder={recognition.interim || "Type your reply in Chinese…"}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendUtterance(typed)}
          disabled={loading}
        />
        <button className="btn primary" onClick={() => sendUtterance(typed)} disabled={loading || !typed.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
