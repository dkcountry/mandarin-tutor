import { useTextToSpeech } from "../hooks/useSpeech";

const SAMPLE = "你好，我是你的中文老师小李。我们一起练习说话吧！";

/**
 * Lets the user pick which installed Mandarin voice the tutor uses, with a
 * preview button. The choice is shared across all modes and persisted.
 */
export function VoicePicker() {
  const tts = useTextToSpeech();

  if (!tts.supported || tts.voices.length === 0) return null;

  return (
    <div className="voice-picker" title="Tutor voice (from your browser/OS)">
      <span className="voice-picker-label">声音</span>
      <select
        value={tts.voiceURI}
        onChange={(e) => tts.setVoiceURI(e.target.value)}
        aria-label="Tutor voice"
      >
        {tts.voices.map((v) => (
          <option key={v.voiceURI} value={v.voiceURI}>
            {v.name} ({v.lang.replace("_", "-")})
          </option>
        ))}
      </select>
      <button
        className="voice-preview"
        title="Preview voice"
        onClick={() => (tts.speaking ? tts.stop() : tts.speak(SAMPLE))}
      >
        {tts.speaking ? "■" : "▶"}
      </button>
    </div>
  );
}
