import type { QuizAnswerRecord } from "@/types/question";

function apiBase(): string {
  const v = import.meta.env.VITE_QUIZ_API_URL;
  return typeof v === "string" ? v.replace(/\/$/, "") : "";
}

export interface PerformanceFeedback {
  summary: string;
  weakAreas: string[];
  strongAreas: string[];
  studyTips: string[];
}

interface FeedbackRequestPayload {
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: Array<{
    topic: string;
    subtopic: string;
    difficulty: "easy" | "medium" | "hard";
    selected: number;
    correct: number;
    isCorrect: boolean;
  }>;
}

export async function generatePerformanceFeedback(input: {
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: QuizAnswerRecord[];
  signal?: AbortSignal;
}): Promise<PerformanceFeedback> {
  const payload: FeedbackRequestPayload = {
    score: input.score,
    totalQuestions: input.totalQuestions,
    percentage: input.percentage,
    answers: input.answers.map((a) => ({
      topic: a.topic,
      subtopic: a.subtopic,
      difficulty: a.difficulty,
      selected: a.selected,
      correct: a.correct,
      isCorrect: a.isCorrect,
    })),
  };

  const res = await fetch(`${apiBase()}/api/generate-feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: input.signal,
  });

  if (!res.ok) {
    throw new Error(`Feedback request failed (${res.status})`);
  }

  const data = (await res.json()) as Partial<PerformanceFeedback>;
  return {
    summary: typeof data.summary === "string" ? data.summary : "You completed the quiz.",
    weakAreas: Array.isArray(data.weakAreas) ? data.weakAreas : [],
    strongAreas: Array.isArray(data.strongAreas) ? data.strongAreas : [],
    studyTips: Array.isArray(data.studyTips) ? data.studyTips : [],
  };
}

