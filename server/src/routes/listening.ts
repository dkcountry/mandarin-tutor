import { Router } from "express";
import { generateStructured, LEVEL_GUIDANCE } from "../claude.js";

export const listeningRouter = Router();

const SYSTEM = `You generate Mandarin LISTENING-COMPREHENSION exercises for a learner who will hear the passage read aloud and then answer questions.

${LEVEL_GUIDANCE}

Produce:
- A short passage of 5 to 8 sentences on the given topic. It can be a little story, a dialogue, or an informational text. Make it flow naturally when read aloud, and make it stretch the learner.
- Exactly 3 multiple-choice comprehension questions, written in English, with 4 options each. Test real understanding (main idea, detail, inference) — not trivia. Exactly one option per question is correct.`;

const SCHEMA = {
  type: "object",
  properties: {
    title_hanzi: { type: "string" },
    title_english: { type: "string" },
    passage: {
      type: "object",
      properties: {
        hanzi: { type: "string", description: "The passage in simplified Chinese" },
        pinyin: { type: "string", description: "Hanyu Pinyin with tone marks" },
        english: { type: "string", description: "Natural English translation" },
      },
      required: ["hanzi", "pinyin", "english"],
      additionalProperties: false,
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question_english: { type: "string" },
          options_english: {
            type: "array",
            items: { type: "string" },
            description: "Exactly 4 answer choices in English",
          },
          correct_index: {
            type: "integer",
            enum: [0, 1, 2, 3],
            description: "Index of the correct option",
          },
        },
        required: ["question_english", "options_english", "correct_index"],
        additionalProperties: false,
      },
    },
  },
  required: ["title_hanzi", "title_english", "passage", "questions"],
  additionalProperties: false,
};

listeningRouter.post("/", async (req, res, next) => {
  try {
    const { topic } = req.body as { topic?: string };
    const result = await generateStructured({
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Create a listening exercise. Topic: ${topic || "the learner's daily life"}.`,
        },
      ],
      schema: SCHEMA,
      effort: "medium",
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
