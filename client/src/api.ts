import type {
  ChatTurn,
  ConversationTurnResponse,
  ListeningExercise,
  VocabSet,
} from "./types";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.hint ? `${data.error} — ${data.hint}` : data.error || detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function sendConversation(
  topic: string,
  history: { role: ChatTurn["role"]; content: string }[]
) {
  return post<ConversationTurnResponse>("/api/conversation", { topic, history });
}

export function getListeningExercise(topic: string) {
  return post<ListeningExercise>("/api/listening", { topic });
}

export function getVocabSet(theme: string) {
  return post<VocabSet>("/api/vocab", { theme });
}
