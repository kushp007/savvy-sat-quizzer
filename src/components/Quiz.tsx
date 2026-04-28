import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, Target, ArrowRight, RotateCcw, Info, TrendingUp } from "lucide-react";
import katex from "katex";
import QuizResults from "@/components/QuizResults";
import { useQuiz } from "@/hooks/useQuiz";
import { TOTAL_QUIZ_QUESTIONS } from "@/lib/quizConstants";
import type { CorrectAnswerIndex } from "@/types/question";

interface QuizProps {
  playerName: string;
  onRestart: () => void;
}

const INLINE_MATH_PATTERN = /(\\frac\{[^}]+\}\{[^}]+\}|\\log_[0-9A-Za-z]+\([^)]*\)|[0-9A-Za-z]+\^[0-9A-Za-z]+)/g;
const DELIMITED_MATH_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g;
const INLINE_MATH_EXACT_PATTERN =
  /^(\\frac\{[^}]+\}\{[^}]+\}|\\log_[0-9A-Za-z]+\([^)]*\)|[0-9A-Za-z]+\^[0-9A-Za-z]+)$/;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderMath = (expr: string, displayMode = false) =>
  katex.renderToString(expr, {
    throwOnError: false,
    displayMode,
  });

const renderMathTextToHtml = (text: string): string => {
  const delimitedChunks = text.split(DELIMITED_MATH_PATTERN).filter(Boolean);

  return delimitedChunks
    .map((chunk) => {
      if (chunk.startsWith("$$") && chunk.endsWith("$$")) {
        return renderMath(chunk.slice(2, -2).trim(), true);
      }

      if (chunk.startsWith("$") && chunk.endsWith("$")) {
        return renderMath(chunk.slice(1, -1).trim(), false);
      }

      const inlineChunks = chunk.split(INLINE_MATH_PATTERN).filter(Boolean);
      return inlineChunks
        .map((inlineChunk) => {
          if (INLINE_MATH_EXACT_PATTERN.test(inlineChunk)) {
            return renderMath(inlineChunk, false);
          }
          return escapeHtml(inlineChunk);
        })
        .join("");
    })
    .join("");
};

const MathText: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <span className={className} dangerouslySetInnerHTML={{ __html: renderMathTextToHtml(text) }} />
);

const Quiz: React.FC<QuizProps> = ({ playerName, onRestart }) => {
  const {
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
  } = useQuiz();

  const isBusy = poolLoading || questionLoading;
  const hasActiveQuestion = quizStatus === "active" && currentQuestion && !isPreparingQuiz;
  const progress = hasActiveQuestion
    ? ((currentQuestionIndex + 1) / TOTAL_QUIZ_QUESTIONS) * 100
    : 0;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (quizComplete) {
    const attempted = answers.length;
    return (
      <QuizResults
        playerName={playerName}
        score={score}
        totalQuestions={attempted > 0 ? attempted : TOTAL_QUIZ_QUESTIONS}
        answers={answers}
        onRestart={onRestart}
      />
    );
  }

  const diffColor =
    currentQuestion?.difficulty === "easy"
      ? "text-green-600"
      : currentQuestion?.difficulty === "medium"
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {aiErrorNotice && (
          <Alert variant="destructive" className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>AI question batch failed</AlertTitle>
            <AlertDescription>
              {aiErrorNotice} The quiz continues with the local question bank only.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Hi, {playerName}!</h1>
            <p className="text-gray-600">
              {hasActiveQuestion
                ? `Question ${currentQuestionIndex + 1} of ${TOTAL_QUIZ_QUESTIONS}`
                : "Preparing question pool..."}
            </p>
          </div>
          <Button variant="outline" onClick={onRestart} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Restart
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-xl font-bold">{scoreLabel}</p>
                  <p className="text-xs text-gray-500">correct / answered</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className={`w-5 h-5 ${diffColor}`} />
                <div>
                  <p className="text-sm text-gray-600">This question</p>
                  <div className="flex flex-wrap gap-1 items-center">
                    {hasActiveQuestion && (
                      <Badge variant="secondary" className="capitalize">
                        {currentQuestion.difficulty}
                      </Badge>
                    )}
                    <span className={`text-sm font-semibold capitalize ${diffColor}`}>
                      {hasActiveQuestion ? currentQuestion?.topic ?? "—" : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                <div>
                  <p className="text-sm text-gray-600">Adaptive trend</p>
                  <p className="text-xl font-bold text-violet-700">{performanceLabel}</p>
                  <p className="text-xs text-gray-500">rolling % correct</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${totalTimeLeft < 300 ? "text-red-600" : "text-amber-600"}`} />
                <div>
                  <p className="text-sm text-gray-600">Time left</p>
                  <p className={`text-xl font-bold ${totalTimeLeft < 300 ? "text-red-600" : ""}`}>
                    {formatTime(totalTimeLeft)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-4 pb-2">
            <p className="text-sm text-gray-600 mb-2">Progress</p>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">
              {poolLoading || isBusy ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  {poolLoading ? "Preparing question pool…" : "Loading question…"}
                </div>
              ) : (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <span className="flex-1">
                      {hasActiveQuestion && currentQuestion?.question ? (
                        <MathText text={currentQuestion.question} />
                      ) : null}
                    </span>
                    {hasActiveQuestion && currentQuestion && (
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600 whitespace-nowrap">
                        {currentQuestion.subtopic}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {poolLoading || isBusy ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : currentQuestion ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectOption(index as CorrectAnswerIndex)}
                    disabled={showResult}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      showResult
                        ? index === currentQuestion.correctAnswer
                          ? "border-green-500 bg-green-50 text-green-800"
                          : index === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer
                            ? "border-red-500 bg-red-50 text-red-800"
                            : "border-gray-200 bg-gray-50"
                        : selectedAnswer === index
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                    <MathText text={option} />
                  </button>
                ))}

                {showResult && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Explanation</h4>
                    <p className="text-blue-700">
                      <MathText text={currentQuestion.explanation} />
                    </p>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  {!showResult ? (
                    <Button
                      onClick={submitAnswer}
                      disabled={selectedAnswer === null}
                      className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    >
                      Submit answer
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={goToNextQuestion}
                      className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    >
                      {currentQuestionIndex + 1 >= TOTAL_QUIZ_QUESTIONS ? "View results" : "Next question"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quiz;
