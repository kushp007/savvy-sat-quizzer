/**
 * Shared SAT Math question model for local bank + AI-generated items.
 */
export type Difficulty = "easy" | "medium" | "hard";

export type QuestionSource = "local" | "ai";

/** Multiple-choice index 0–3 (SAT-style four options). */
export type CorrectAnswerIndex = 0 | 1 | 2 | 3;

export interface SatQuestion {
  id: string;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  question: string;
  /** Exactly four answer choices. */
  options: [string, string, string, string];
  correctAnswer: CorrectAnswerIndex;
  explanation: string;
  source?: QuestionSource;
}

/** One answered item for results / review. */
export interface QuizAnswerRecord {
  questionId: string;
  question: string;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  selected: CorrectAnswerIndex;
  correct: CorrectAnswerIndex;
  isCorrect: boolean;
  explanation: string;
}
