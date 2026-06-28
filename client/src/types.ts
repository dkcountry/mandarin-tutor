export interface CnText {
  hanzi: string;
  pinyin: string;
  english: string;
}

// ---- Conversation ----
export interface ConversationTurnResponse {
  reply: CnText;
  feedback: {
    corrected_hanzi: string;
    notes: string;
    rating: "excellent" | "good" | "needs_work";
  };
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string; // hanzi
  // Display extras (assistant turns carry pinyin/english; user turns carry feedback)
  pinyin?: string;
  english?: string;
  feedback?: ConversationTurnResponse["feedback"];
}

// ---- Listening ----
export interface ListeningExercise {
  title_hanzi: string;
  title_english: string;
  passage: CnText;
  questions: {
    question_english: string;
    options_english: string[];
    correct_index: number;
  }[];
}

// ---- Vocab ----
export interface VocabItem {
  hanzi: string;
  pinyin: string;
  english: string;
  type: "word" | "idiom";
  example: CnText;
}

export interface VocabSet {
  theme_english: string;
  items: VocabItem[];
}
