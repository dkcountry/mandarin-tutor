import { Router } from "express";
import { generateStructured, LEVEL_GUIDANCE, type ChatMessage } from "../claude.js";

export const conversationRouter = Router();

const SYSTEM = `You are 小李 (Xiǎo Lǐ), a warm, encouraging Mandarin conversation tutor. You chat with the learner in Mandarin and gently coach them as you go.

${LEVEL_GUIDANCE}

Rules for the conversation:
- Keep each spoken reply SHORT — 1 to 3 sentences — so the back-and-forth stays lively.
- Always end your reply with a question or prompt that keeps the learner talking.
- Stay on or near the chosen topic, but follow the learner's lead naturally.
- After the learner speaks, give brief, specific feedback in English on their grammar, word choice, and naturalness, and provide a corrected / more natural version of what they said in Hanzi. If what they said was already good, say so and rate it "excellent" or "good".
- On the very first turn (when the learner hasn't said anything substantive yet), open the conversation: leave "corrected_hanzi" empty, set "rating" to "good", and set "notes" to "".`;

const SCHEMA = {
  type: "object",
  properties: {
    reply: {
      type: "object",
      properties: {
        hanzi: { type: "string", description: "Your spoken reply in simplified Chinese" },
        pinyin: { type: "string", description: "Hanyu Pinyin with tone marks for the reply" },
        english: { type: "string", description: "Natural English translation of the reply" },
      },
      required: ["hanzi", "pinyin", "english"],
      additionalProperties: false,
    },
    feedback: {
      type: "object",
      properties: {
        corrected_hanzi: {
          type: "string",
          description: "A corrected / more natural version of what the learner just said, in Hanzi. Empty string on the opening turn.",
        },
        notes: {
          type: "string",
          description: "Brief English coaching on the learner's grammar, word choice, and naturalness. Empty string on the opening turn.",
        },
        rating: { type: "string", enum: ["excellent", "good", "needs_work"] },
      },
      required: ["corrected_hanzi", "notes", "rating"],
      additionalProperties: false,
    },
  },
  required: ["reply", "feedback"],
  additionalProperties: false,
};

interface TurnReply {
  reply: { hanzi: string; pinyin: string; english: string };
  feedback: { corrected_hanzi: string; notes: string; rating: string };
}

conversationRouter.post("/", async (req, res, next) => {
  try {
    const { topic, history } = req.body as {
      topic?: string;
      history?: ChatMessage[];
    };

    const messages: ChatMessage[] = (history ?? []).map((h) => ({
      role: h.role,
      content: h.content,
    }));

    // The Messages API requires the first message to be from the user.
    if (messages.length === 0 || messages[0].role !== "user") {
      messages.unshift({
        role: "user",
        content: `我们来用中文练习对话吧。主题：${topic || "自由聊天"}。请你先开始，问我一个问题。`,
      });
    }

    // Keep conversation snappy: skip thinking, low effort for short replies.
    const result = await generateStructured<TurnReply>({
      system: SYSTEM,
      messages,
      schema: SCHEMA,
      thinking: false,
      effort: "low",
      maxTokens: 2000,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});
