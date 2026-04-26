import type { Difficulty, SatQuestion } from "@/types/question";

/** Normalize for deduplication (exact text after normalization). */
export function normalizeQuestionText(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/["""'']/g, '"')
    .trim();
}

/** Stable key: normalized stem + topic + difficulty (avoids near-duplicate topics). */
export function dedupeKey(q: Pick<SatQuestion, "question" | "topic" | "difficulty">): string {
  return `${normalizeQuestionText(q.question)}|${normalizeQuestionText(q.topic)}|${q.difficulty}`;
}

export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function cloneShuffle<T>(items: T[]): T[] {
  return shuffleInPlace([...items]);
}

/**
 * Merge lists and drop duplicates (normalized stem + topic + difficulty).
 * Order: primary first, then additions.
 */
export function mergeAndDedupeQuestions(primary: SatQuestion[], additions: SatQuestion[]): SatQuestion[] {
  const seen = new Set<string>();
  const out: SatQuestion[] = [];
  for (const q of [...primary, ...additions]) {
    const k = dedupeKey(q);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(q);
  }
  return out;
}

/**
 * Adaptive difficulty weights from rolling accuracy (answered questions only).
 * Doing well → more medium/hard; struggling → more easy/medium.
 */
export function getDifficultyWeights(accuracy: number): Record<Difficulty, number> {
  if (accuracy >= 0.82) return { easy: 0.08, medium: 0.32, hard: 0.6 };
  if (accuracy >= 0.65) return { easy: 0.18, medium: 0.42, hard: 0.4 };
  if (accuracy >= 0.45) return { easy: 0.32, medium: 0.43, hard: 0.25 };
  return { easy: 0.48, medium: 0.37, hard: 0.15 };
}

/** Weighted random choice over `unused` using per-question difficulty weights. */
export function weightedPickQuestion(unused: SatQuestion[], accuracy: number): SatQuestion {
  if (unused.length === 1) return unused[0];
  const wmap = getDifficultyWeights(accuracy);
  const weights = unused.map((q) => wmap[q.difficulty]);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < unused.length; i++) {
    r -= weights[i];
    if (r <= 0) return unused[i];
  }
  return unused[unused.length - 1];
}

/** Unused = pool items whose keys are not in `usedKeys` for this cycle. */
export function filterUnused(pool: SatQuestion[], usedKeys: Set<string>): SatQuestion[] {
  return pool.filter((q) => !usedKeys.has(dedupeKey(q)));
}
