import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VOICE_STORAGE_KEY = "mt.voiceURI";
const VOICE_CHANGE_EVENT = "mt:voicechange";

/**
 * Score a Mandarin voice by how natural it tends to sound. Higher is better.
 * The browser exposes whatever the OS/browser installs, and quality varies a
 * lot: networked "Google 普通话" (Chrome) and Apple's enhanced/premium voices
 * sound far more human than the basic built-in default (e.g. Tingting).
 */
function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase().replace("_", "-");
  let score = 0;

  // Networked voices (Chrome's Google voices) are the most natural available.
  if (!v.localService) score += 100;
  if (name.includes("google")) score += 80;

  // Apple's higher-quality tiers.
  if (name.includes("premium")) score += 60;
  if (name.includes("enhanced")) score += 40;
  if (name.includes("siri")) score += 30;

  // Mainland Mandarin first (this learner is targeting 普通话).
  if (lang === "zh-cn") score += 20;
  else if (lang.startsWith("zh-cn")) score += 18;
  else if (lang.startsWith("zh")) score += 5;

  // The old built-in default is intelligible but robotic — keep as a fallback.
  if (name.includes("ting-ting") || name.includes("tingting")) score -= 15;

  return score;
}

function readStoredVoiceURI(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(VOICE_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Text-to-speech for Mandarin (listening & speaking practice).
 * Ranks the available zh voices by naturalness, picks the best by default, and
 * lets the user override the choice (persisted across modes and reloads).
 */
export function useTextToSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [voiceURI, setVoiceURIState] = useState<string>(readStoredVoiceURI);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  // Keep every hook instance (one per mode) in sync when the voice changes.
  useEffect(() => {
    const sync = () => setVoiceURIState(readStoredVoiceURI());
    window.addEventListener(VOICE_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(VOICE_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // zh voices, best-sounding first.
  const zhVoices = useMemo(
    () =>
      voices
        .filter((v) => v.lang.toLowerCase().startsWith("zh"))
        .sort((a, b) => scoreVoice(b) - scoreVoice(a)),
    [voices]
  );

  const activeVoice =
    zhVoices.find((v) => v.voiceURI === voiceURI) ?? zhVoices[0];

  const setVoiceURI = useCallback((uri: string) => {
    try {
      if (uri) window.localStorage.setItem(VOICE_STORAGE_KEY, uri);
      else window.localStorage.removeItem(VOICE_STORAGE_KEY);
    } catch {
      /* storage may be unavailable; selection still applies this session */
    }
    setVoiceURIState(uri);
    window.dispatchEvent(new Event(VOICE_CHANGE_EVENT));
  }, []);

  const speak = useCallback(
    (text: string, rate = 0.95) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = activeVoice?.lang || "zh-CN";
      if (activeVoice) utter.voice = activeVoice;
      utter.rate = rate;
      utter.pitch = 1;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
    },
    [supported, activeVoice]
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return {
    speak,
    stop,
    speaking,
    supported,
    hasMandarinVoice: zhVoices.length > 0,
    voices: zhVoices,
    activeVoice,
    voiceURI: activeVoice?.voiceURI ?? "",
    setVoiceURI,
  };
}

/**
 * Speech-to-text for Mandarin (speaking practice). Returns the recognized
 * transcript via onResult when the user finishes speaking.
 */
export function useSpeechRecognition(onResult: (transcript: string) => void) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const Ctor =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined;
  const supported = Boolean(Ctor);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "zh-CN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let finalText = "";
    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      setInterim(interimText);
    };
    recognition.onerror = () => setListening(false);
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      setListening(false);
      setInterim("");
      if (finalText.trim()) onResultRef.current(finalText.trim());
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [Ctor]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { start, stop, listening, interim, supported };
}
