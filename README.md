# 说听 · Mandarin Tutor

A user-friendly web app for **leveling up Mandarin speaking and listening** — built for someone who already reads/speaks at roughly a 4th-grade native level and wants to climb toward high-school fluency.

- **Conversation** — chat in Mandarin with an AI tutor (小李) using your voice; get gentle corrections after every turn.
- **Listening** — hear a short, level-appropriate passage read aloud, answer comprehension questions, then reveal the transcript with pinyin + translation. Adjustable playback speed.
- **Vocabulary & Idioms** — flip through themed decks of intermediate→advanced words and 成语, with audio and example sentences, and a lightweight spaced-repetition review.

## How it works

- **React + TypeScript** frontend (Vite).
- **Node + Express + TypeScript** backend.
- **Speech** runs in your browser via the free Web Speech API — text-to-speech for listening, speech-to-text for speaking. No audio keys needed. Works best in **Chrome or Edge**.
- **The tutoring brains** are powered by [Claude](https://www.anthropic.com) (`claude-opus-4-8`) — it generates leveled content, runs the conversation, and gives feedback. This needs an Anthropic API key.

```
mandarin-tutor/
├── server/   Express API → Claude (conversation, listening, vocab)
└── client/   React app → Web Speech API + the three practice modes
```

## Setup

You need **Node 18+**.

1. **Add your Anthropic API key.**
   ```bash
   cp server/.env.example server/.env
   # then edit server/.env and set ANTHROPIC_API_KEY=sk-ant-...
   ```
   Get a key at <https://console.anthropic.com/settings/keys>.

2. **Install dependencies** (root + server + client):
   ```bash
   npm run install:all
   ```

3. **Run both servers** (API on :3001, app on :5173):
   ```bash
   npm run dev
   ```

4. Open <http://localhost:5173> in **Chrome or Edge** and allow microphone access when prompted.

## Notes

- **Microphone / speaking practice** requires a Chromium-based browser (Chrome, Edge). Safari/Firefox support is partial; you can still type your replies as a fallback.
- **No Mandarin voice?** If listening playback is silent or uses the wrong accent, install a `zh-CN` voice in your operating system's speech settings — the browser uses the OS voices.
- Each request to the practice modes calls the Claude API, so usage is billed to your Anthropic account.

## Production build

```bash
npm run build          # builds server (dist/) and client (client/dist/)
npm start              # runs the API server
```
Serve `client/dist/` with any static host and point it at the API (the dev proxy is only for local development).
