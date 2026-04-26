# Savvy SAT Quizzer

An SAT Math practice quiz built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **shadcn/ui**. It ships with a **local question bank**, merges in **optional AI-generated batches** from a tiny **Express** backend (OpenAI runs **only on the server**), and uses a **simple adaptive difficulty** mix based on your rolling accuracy.

## What it does

- Collects the learner’s **name** on a start screen, then runs a **25-question** timed session (25 minutes).
- Serves **multiple-choice** questions with **immediate feedback**, **explanations**, and a **results** screen with per-question review.
- Builds a **hybrid pool**: offline-safe local items in `src/data/questions.ts`, plus optional **deduplicated** AI questions when the API is available.
- **No repeats** within a full pass through the pool: used questions are tracked until every item has appeared once, then the cycle resets with a fresh shuffle.

## Tech stack

| Layer | Choice |
|--------|--------|
| UI | React 18, Tailwind, shadcn/ui |
| Build | Vite 5, TypeScript |
| State | React hooks (`useQuiz`) |
| API | Express (`server/index.js`) |
| AI | OpenAI Chat Completions (JSON), **server-side only** |
| DB | Not wired yet — see `server/db/mongoScaffold.js` |

## How questions work

1. **Local bank** — `src/data/questions.ts` is the offline source of truth (30 items).
2. **On quiz start**, the client calls `POST /api/generate-questions` (proxied in dev). If the server or key is missing, the app **continues with local questions only** and shows a notice.
3. **Merge + dedupe** — AI rows are merged with locals using normalized text + topic + difficulty (`src/utils/questionUtils.ts`).
4. **Adaptive selection** — the next question is chosen **without replacement** within a cycle, with **weights** favoring harder items when accuracy is high and easier items when it is low.

## Security: API keys

- **Do not** put `OPENAI_API_KEY` in frontend code or `VITE_*` variables that embed secrets in the bundle.
- Put the key in **`.env`** on the machine that runs `server/index.js` (see `.env.example`).

## Setup

**Requirements:** Node.js 18+ and npm.

```bash
cd savvy-sat-quizzer
npm install
```

### Run (UI only — local questions)

```bash
npm run dev
```

Open the URL shown (default **http://localhost:8080**). AI expansion will be skipped unless the API is running.

### Run (UI + API — hybrid pool with OpenAI)

1. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
2. Start both processes:

```bash
npm run dev:full
```

This runs Vite and the Express API (`server/index.js` on port **3001**). The Vite dev server **proxies** `/api` to that port.

### Build

```bash
npm run build
npm run preview
```

For production, deploy the static build behind a host that also runs the Express API (or another backend) and set `VITE_QUIZ_API_URL` to the public API origin if it differs from the static site.

## Environment variables

See `.env.example`. Summary:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Required on the **server** for AI batches |
| `OPENAI_MODEL` | Optional model id (default `gpt-4o-mini`) |
| `PORT` | API port (default `3001`) |
| `VITE_QUIZ_API_URL` | Optional frontend base URL for the API in production |

## Project layout (quiz-related)

| Path | Role |
|------|------|
| `src/data/questions.ts` | Local question bank |
| `src/types/question.ts` | Shared TypeScript types |
| `src/utils/questionUtils.ts` | Shuffle, dedupe, adaptive weights |
| `src/services/questionService.ts` | Hybrid pool loader + API call |
| `src/hooks/useQuiz.ts` | Quiz session state |
| `src/components/Quiz.tsx` | Quiz UI |
| `src/components/QuizResults.tsx` | Results + explanations |
| `server/index.js` | `/api/generate-questions`, `/api/health` |
| `server/db/mongoScaffold.js` | Placeholder for MongoDB |

## Audit notes

Developer-oriented notes from the initial audit live in `src/lib/auditNotes.ts`.

## Future improvements

- Persist users and scores in **MongoDB** using the scaffold in `server/db/mongoScaffold.js`.
- Harden AI output (e.g. re-validate math, filter broken items).
- Add topic filters and exam-style section timing presets.

## License

Private / portfolio use — adjust as needed for your repository.
