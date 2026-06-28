import "dotenv/config";
import express from "express";
import cors from "cors";
import { conversationRouter } from "./routes/conversation.js";
import { listeningRouter } from "./routes/listening.js";
import { vocabRouter } from "./routes/vocab.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "\n⚠️  ANTHROPIC_API_KEY is not set. Copy server/.env.example to server/.env and add your key.\n"
  );
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.use("/api/conversation", conversationRouter);
app.use("/api/listening", listeningRouter);
app.use("/api/vocab", vocabRouter);

// Centralized error handling — turns SDK/auth errors into readable JSON.
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Request failed:", message);
    const status =
      typeof (err as { status?: number })?.status === "number"
        ? (err as { status: number }).status
        : 500;
    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: message,
      hint: !process.env.ANTHROPIC_API_KEY
        ? "The server has no ANTHROPIC_API_KEY. Add it to server/.env and restart."
        : undefined,
    });
  }
);

app.listen(PORT, () => {
  console.log(`🀄  Mandarin Tutor API listening on http://localhost:${PORT}`);
});
