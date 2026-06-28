import { Router } from "express";
import { generateStructured, LEVEL_GUIDANCE } from "../claude.js";

export const vocabRouter = Router();

const SYSTEM = `You generate Mandarin VOCABULARY & IDIOM study sets for spaced-repetition review.

${LEVEL_GUIDANCE}

Produce 8 items around the given theme:
- A mix of useful intermediate→advanced words AND at least 2 common 成语 (four-character idioms).
- For each item: hanzi, pinyin (tone marks), a concise English meaning, its type ("word" or "idiom"), and ONE natural example sentence (with hanzi, pinyin, and English) of the kind a Chinese high-schooler might actually say or write.
- Avoid the most elementary words (你好, 谢谢, numbers, etc.) — this learner already knows those.`;

const SCHEMA = {
  type: "object",
  properties: {
    theme_english: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          hanzi: { type: "string" },
          pinyin: { type: "string" },
          english: { type: "string" },
          type: { type: "string", enum: ["word", "idiom"] },
          example: {
            type: "object",
            properties: {
              hanzi: { type: "string" },
              pinyin: { type: "string" },
              english: { type: "string" },
            },
            required: ["hanzi", "pinyin", "english"],
            additionalProperties: false,
          },
        },
        required: ["hanzi", "pinyin", "english", "type", "example"],
        additionalProperties: false,
      },
    },
  },
  required: ["theme_english", "items"],
  additionalProperties: false,
};

vocabRouter.post("/", async (req, res, next) => {
  try {
    const { theme } = req.body as { theme?: string };
    const result = await generateStructured({
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Create a vocabulary & idiom set. Theme: ${theme || "school and friendship"}.`,
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
