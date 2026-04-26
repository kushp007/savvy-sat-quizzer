import { LOCAL_QUESTIONS } from "@/data/questions";
import type { SatQuestion } from "@/types/question";
import { AI_BATCH_SIZE } from "@/lib/quizConstants";
import { mergeAndDedupeQuestions } from "@/utils/questionUtils";

function apiBase(): string {
  const v = import.meta.env.VITE_QUIZ_API_URL;
  return typeof v === "string" ? v.replace(/\/$/, "") : "";
}

export type AiPoolResult =
  | { kind: "merged"; added: number }
  /** Expected when the API is not running or OpenAI is not configured — no UI warning. */
  | { kind: "local_only" }
  /** The API responded but generation failed — show a short message. */
  | { kind: "error"; message: string };

export interface BuildPoolOptions {
  /** Recent question stems to discourage near-duplicates in the AI prompt. */
  recentStems?: string[];
  signal?: AbortSignal;
}

function isLikelyNoServer(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed") ||
    m.includes("network request failed")
  );
}

/**
 * Loads local questions and optionally merges a batch from POST /api/generate-questions.
 * Never throws — falls back to the local bank.
 */
export async function buildHybridQuestionPool(options: BuildPoolOptions = {}): Promise<{
  pool: SatQuestion[];
  ai: AiPoolResult;
}> {
  const { recentStems = [], signal } = options;
  let additions: SatQuestion[] = [];
  let ai: AiPoolResult = { kind: "local_only" };

  try {
    const res = await fetch(`${apiBase()}/api/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recentQuestionStems: recentStems.slice(-12),
        batchSize: AI_BATCH_SIZE,
      }),
      signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      let parsedMsg = errBody;
      try {
        const j = JSON.parse(errBody) as { error?: string };
        if (typeof j.error === "string") parsedMsg = j.error;
      } catch {
        /* keep text */
      }

      // No key / AI disabled on server — normal for local-only play.
      if (res.status === 503) {
        ai = { kind: "local_only" };
      } else {
        ai = { kind: "error", message: parsedMsg || `Request failed (${res.status})` };
      }
      additions = [];
    } else {
      const data = (await res.json()) as { questions?: SatQuestion[] };
      additions = Array.isArray(data.questions) ? data.questions : [];
      if (additions.length > 0) {
        ai = { kind: "merged", added: additions.length };
      } else {
        ai = { kind: "local_only" };
      }
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return {
        pool: mergeAndDedupeQuestions(LOCAL_QUESTIONS, []),
        ai: { kind: "local_only" },
      };
    }
    // Browser can't reach the API (server not started, wrong URL, offline, etc.)
    if (isLikelyNoServer(e)) {
      ai = { kind: "local_only" };
    } else {
      ai = {
        kind: "error",
        message: e instanceof Error ? e.message : "Network error",
      };
    }
    additions = [];
  }

  const pool = mergeAndDedupeQuestions(LOCAL_QUESTIONS, additions);
  return { pool, ai };
}

export { LOCAL_QUESTIONS };
