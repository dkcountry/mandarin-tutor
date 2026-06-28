import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-4-8";

// A single shared client. Reads ANTHROPIC_API_KEY from the environment.
export const client = new Anthropic();

/**
 * Shared coaching context, injected into every system prompt. This is what
 * pins the difficulty to the learner's level: a ~4th-grade native reader who
 * is climbing toward high-school fluency.
 */
export const LEVEL_GUIDANCE = `The learner reads and speaks Mandarin at roughly a 4th-grade native level and is working toward a high-school level of fluency. Calibrate everything to push them just past their comfort zone — this is NOT a beginner phrasebook.

- Use simplified Chinese characters.
- Reach beyond basics: richer everyday vocabulary, common 成语 (idioms), and more complex sentence patterns (把/被 sentences, 虽然…但是, 不但…而且, 因为…所以, 的-relative clauses, 了/过/着 aspect).
- Keep individual sentences understandable but genuinely challenging; favor natural, native-sounding phrasing over textbook simplicity.
- Always provide accurate Hanyu Pinyin WITH tone marks (e.g. "nǐ hǎo", never "ni3 hao3").
- Keep English translations natural and idiomatic, not word-for-word.`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

interface StructuredOptions {
  system: string;
  messages: ChatMessage[];
  schema: Record<string, unknown>;
  /** Enable adaptive thinking (better quality, a little slower). Default true. */
  thinking?: boolean;
  /** "low" | "medium" | "high" — token/quality tradeoff. Default "medium". */
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}

/**
 * Calls Claude and returns the parsed JSON object validated against `schema`.
 * Structured outputs guarantee the first text block is schema-valid JSON.
 */
export async function generateStructured<T>({
  system,
  messages,
  schema,
  thinking = true,
  effort = "medium",
  maxTokens = 8000,
}: StructuredOptions): Promise<T> {
  // Cast the params: output_config / effort / adaptive thinking are recent
  // additions, so the exact typing varies by installed SDK version. The fields
  // are correct per the current API; the cast keeps this compiling either way.
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    ...(thinking ? { thinking: { type: "adaptive" } } : {}),
    output_config: {
      effort,
      format: { type: "json_schema", schema },
    },
    system,
    messages,
  } as unknown as Anthropic.MessageCreateParamsNonStreaming);

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Model returned no text content");
  }
  return JSON.parse(textBlock.text) as T;
}
