/**
 * PHASE 1 — AUDIT SUMMARY (developer reference)
 *
 * Current source of questions:
 * - Primary: `src/data/questions.ts` (local SAT Math bank, previously inlined in Quiz.tsx).
 * - Supplemental: optional batches from POST `/api/generate-questions` (OpenAI via Express server).
 *   The frontend never holds API keys; it only calls your backend.
 *
 * OpenAI currently used: previously **no**; after this refactor **yes**, when the API server runs
 * and `OPENAI_API_KEY` is set. Otherwise the app uses the local bank only.
 *
 * Main causes of repetition (historical, fixed in refactor):
 * - `Set` updates for “used” questions were asynchronous; exhaustion fell back to random picks
 *   without a clean cycle reset, so repeats could appear early.
 * - Tracking was per-difficulty only and keyed by raw question text inconsistently.
 *
 * Missing vs original intent (before refactor):
 * - No OpenAI wiring, no batch generation, no server-side key handling.
 * - No MongoDB persistence (still optional; see `server/db/mongoScaffold.js`).
 */

export const AUDIT = {
  sourceOfQuestions:
    "Local `questions.ts` + optional server-generated batches merged and deduplicated.",
  openAiStatus:
    "Used when backend is running and configured; never required for the app to function.",
} as const;
