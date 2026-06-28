import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Text-to-speech for Mandarin (listening practice).
 * Picks a zh-CN voice if available and lets you tune the speaking rate.
 */
export function useTextToSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
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

  const zhVoice = voices.find((v) => v.lang.toLowerCase().startsWith("zh"));

  const speak = useCallback(
    (text: string, rate = 0.9) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "zh-CN";
      if (zhVoice) utter.voice = zhVoice;
      utter.rate = rate;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
    },
    [supported, zhVoice]
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { speak, stop, speaking, supported, hasMandarinVoice: Boolean(zhVoice) };
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
