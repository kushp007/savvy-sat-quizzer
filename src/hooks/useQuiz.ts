import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QUIZ_TIME_LIMIT_SEC, TOTAL_QUIZ_QUESTIONS } from "@/lib/quizConstants";
import { buildHybridQuestionPool } from "@/services/questionService";
import type { CorrectAnswerIndex, QuizAnswerRecord, SatQuestion } from "@/types/question";
import {
  cloneShuffle,
  dedupeKey,
  filterUnused,
  weightedPickQuestion,
} from "@/utils/questionUtils";

const NEUTRAL_ACCURACY = 0.55;

export interface UseQuizResult {
  poolLoading: boolean;
  quizStatus: "preparing" | "active";
  isPreparingQuiz: boolean;
  /** Only set when the API reports a real failure (not “no server / no key”). */
  aiErrorNotice: string | null;
  currentQuestion: SatQuestion | null;
  currentQuestionIndex: number;
  selectedAnswer: CorrectAnswerIndex | null;
  score: number;
  showResult: boolean;
  quizComplete: boolean;
  totalTimeLeft: number;
  answers: QuizAnswerRecord[];
  questionLoading: boolean;
  /** Correct / attempted (submitted) */
  scoreLabel: string;
  /** Rolling percent correct (answered questions only). */
  performanceLabel: string;
  submitAnswer: () => void;
  goToNextQuestion: () => void;
  selectOption: (index: CorrectAnswerIndex) => void;
}

export function useQuiz(): UseQuizResult {
  const [poolLoading, setPoolLoading] = useState(true);
  const [quizStatus, setQuizStatus] = useState<"preparing" | "active">("preparing");
  const [aiErrorNotice, setAiErrorNotice] = useState<string | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<SatQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<CorrectAnswerIndex | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [totalTimeLeft, setTotalTimeLeft] = useState(QUIZ_TIME_LIMIT_SEC);
  const [answers, setAnswers] = useState<QuizAnswerRecord[]>([]);
  const poolRef = useRef<SatQuestion[]>([]);
  /** Keys used in the current cycle; cleared when all pool items were shown once. */
  const usedKeysRef = useRef<Set<string>>(new Set());
  const scoreRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const isPreparingQuiz = quizStatus === "preparing";

  const pickQuestionForIndex = useCallback((nextIndex: number, scoreNow: number) => {
    scoreRef.current = scoreNow;
    const pool = poolRef.current;
    if (pool.length === 0) return;

    /** `nextIndex` is 0-based index of the question being shown; accuracy uses completed = nextIndex. */
    const accuracy =
      nextIndex === 0 ? NEUTRAL_ACCURACY : scoreNow / Math.max(1, nextIndex);

    let unused = filterUnused(pool, usedKeysRef.current);
    if (unused.length === 0) {
      usedKeysRef.current.clear();
      poolRef.current = cloneShuffle(pool);
      unused = filterUnused(poolRef.current, usedKeysRef.current);
    }

    const picked = weightedPickQuestion(unused, accuracy);
    usedKeysRef.current.add(dedupeKey(picked));
    setCurrentQuestion(picked);
  }, []);

  const initializeQuiz = useCallback(async (signal: AbortSignal) => {
    setQuizStatus("preparing");
    setPoolLoading(true);
    setQuestionLoading(false);
    setAiErrorNotice(null);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setQuizComplete(false);
    setAnswers([]);
    setTotalTimeLeft(QUIZ_TIME_LIMIT_SEC);
    poolRef.current = [];
    usedKeysRef.current.clear();
    scoreRef.current = 0;

    const { pool, ai } = await buildHybridQuestionPool({ signal });
    if (signal.aborted) return;

    poolRef.current = cloneShuffle(pool);

    if (ai.kind === "merged" && ai.added > 0) {
      toast.success(`Added ${ai.added} AI-generated questions to the pool.`);
    } else if (ai.kind === "error") {
      setAiErrorNotice(ai.message);
      toast.error("Could not add AI questions", { description: ai.message });
    }

    setPoolLoading(false);
    setQuestionLoading(true);
    pickQuestionForIndex(0, 0);
    setTotalTimeLeft(QUIZ_TIME_LIMIT_SEC);
    setQuizStatus("active");
    setQuestionLoading(false);
  }, [pickQuestionForIndex]);

  useEffect(() => {
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    initializeQuiz(signal).catch(() => {
      setPoolLoading(false);
    });

    return () => abortRef.current?.abort();
  }, [initializeQuiz]);

  useEffect(() => {
    const shouldRunTimer =
      quizStatus === "active" &&
      currentQuestion !== null &&
      !isPreparingQuiz &&
      totalTimeLeft > 0 &&
      !quizComplete;

    if (shouldRunTimer) {
      const t = setTimeout(() => setTotalTimeLeft((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }

    if (
      quizStatus === "active" &&
      currentQuestion !== null &&
      !isPreparingQuiz &&
      totalTimeLeft === 0 &&
      !quizComplete
    ) {
      setQuizComplete(true);
    }

    return undefined;
  }, [currentQuestion, isPreparingQuiz, quizComplete, quizStatus, totalTimeLeft]);

  const submitAnswer = useCallback(() => {
    if (selectedAnswer === null || !currentQuestion) return;
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore((s) => {
        const n = s + 1;
        scoreRef.current = n;
        return n;
      });
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        topic: currentQuestion.topic,
        subtopic: currentQuestion.subtopic,
        difficulty: currentQuestion.difficulty,
        selected: selectedAnswer,
        correct: currentQuestion.correctAnswer,
        isCorrect,
        explanation: currentQuestion.explanation,
      },
    ]);
    setShowResult(true);
  }, [currentQuestion, selectedAnswer]);

  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex + 1 >= TOTAL_QUIZ_QUESTIONS) {
      setQuizComplete(true);
      return;
    }
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuestionLoading(true);
    window.setTimeout(() => {
      pickQuestionForIndex(nextIndex, scoreRef.current);
      setQuestionLoading(false);
    }, 400);
  }, [currentQuestionIndex, pickQuestionForIndex]);

  const selectOption = useCallback((index: CorrectAnswerIndex) => {
    if (!showResult) setSelectedAnswer(index);
  }, [showResult]);

  const attempted = answers.length;
  const scoreLabel = `${score}/${attempted}`;
  const performanceLabel =
    attempted === 0 ? "—" : `${Math.round((score / attempted) * 100)}%`;

  return {
    poolLoading,
    quizStatus,
    isPreparingQuiz,
    aiErrorNotice,
    currentQuestion,
    currentQuestionIndex,
    selectedAnswer,
    score,
    showResult,
    quizComplete,
    totalTimeLeft,
    answers,
    questionLoading,
    scoreLabel,
    performanceLabel,
    submitAnswer,
    goToNextQuestion,
    selectOption,
  };
}
