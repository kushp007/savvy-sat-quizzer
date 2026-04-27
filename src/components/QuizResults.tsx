import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, Target, TrendingUp, Clock, CheckCircle, XCircle, Sparkles } from "lucide-react";
import type { QuizAnswerRecord } from "@/types/question";
import { generatePerformanceFeedback, type PerformanceFeedback } from "@/services/feedbackService";

interface QuizResultsProps {
  playerName: string;
  score: number;
  totalQuestions: number;
  answers: QuizAnswerRecord[];
  onRestart: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  playerName,
  score,
  totalQuestions,
  answers,
  onRestart,
}) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  const incorrect = totalQuestions - score;
  const [feedbackLoading, setFeedbackLoading] = React.useState(true);
  const [feedbackFallback, setFeedbackFallback] = React.useState(false);
  const [feedback, setFeedback] = React.useState<PerformanceFeedback | null>(null);

  const getPerformanceLevel = (pct: number) => {
    if (pct >= 90) return { level: "Excellent", color: "text-green-600", bg: "bg-green-50" };
    if (pct >= 80) return { level: "Great", color: "text-blue-600", bg: "bg-blue-50" };
    if (pct >= 70) return { level: "Good", color: "text-yellow-600", bg: "bg-yellow-50" };
    if (pct >= 60) return { level: "Fair", color: "text-orange-600", bg: "bg-orange-50" };
    return { level: "Needs improvement", color: "text-red-600", bg: "bg-red-50" };
  };

  const performance = getPerformanceLevel(percentage);

  const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

  const getTopTopics = (records: QuizAnswerRecord[], maxCount = 3): string[] => {
    const counts = new Map<string, number>();
    records.forEach((record) => {
      counts.set(record.topic, (counts.get(record.topic) ?? 0) + 1);
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCount)
      .map(([topic]) => topic);
  };

  const getDifficultyInsight = (records: QuizAnswerRecord[]): string => {
    const difficulties: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];
    const parts = difficulties
      .map((difficulty) => {
        const subset = records.filter((r) => r.difficulty === difficulty);
        if (subset.length === 0) return null;
        const correct = subset.filter((r) => r.isCorrect).length;
        const pct = Math.round((correct / subset.length) * 100);
        return `${difficulty}: ${pct}%`;
      })
      .filter(Boolean);

    return parts.length > 0 ? `By difficulty - ${parts.join(", ")}.` : "Difficulty-level insight unavailable.";
  };

  const buildFallbackFeedback = React.useCallback(
    (records: QuizAnswerRecord[]): PerformanceFeedback => {
      const weak = getTopTopics(records.filter((a) => !a.isCorrect), 3);
      const strong = getTopTopics(records.filter((a) => a.isCorrect), 3);
      const weakText = weak.length > 0 ? weak.join(" and ") : "fewer consistent topic gaps";

      return {
        summary: `You scored ${score}/${totalQuestions} (${percentage}%). You struggled most with ${weakText}. Review these topics and practice easier questions before moving to harder ones.`,
        weakAreas: weak,
        strongAreas: strong,
        studyTips: [
          "Redo missed questions and explain each step out loud before checking the answer.",
          "Practice 10-15 mixed problems daily from your weakest topic.",
          "Start with easier problems in weak areas, then increase difficulty.",
        ],
      };
    },
    [percentage, score, totalQuestions]
  );

  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadFeedback = async () => {
      setFeedbackLoading(true);
      setFeedbackFallback(false);

      try {
        const aiFeedback = await generatePerformanceFeedback({
          score,
          totalQuestions,
          percentage,
          answers,
          signal: controller.signal,
        });
        if (!active) return;
        setFeedback(aiFeedback);
      } catch {
        if (!active) return;
        setFeedback(buildFallbackFeedback(answers));
        setFeedbackFallback(true);
      } finally {
        if (active) setFeedbackLoading(false);
      }
    };

    loadFeedback();
    return () => {
      active = false;
      controller.abort();
    };
  }, [answers, buildFallbackFeedback, percentage, score, totalQuestions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Quiz complete</h1>
          <p className="text-xl text-gray-600">Great job, {playerName}!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Target className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800">
                {score}/{totalQuestions}
              </h3>
              <p className="text-gray-600">Correct</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800">{percentage}%</h3>
              <p className="text-gray-600">Accuracy</p>
              <p className="text-sm text-gray-500 mt-1">
                {incorrect} incorrect
              </p>
            </CardContent>
          </Card>

          <Card className={`text-center ${performance.bg}`}>
            <CardContent className="pt-6">
              <Clock className={`w-12 h-12 ${performance.color} mx-auto mb-4`} />
              <h3 className={`text-2xl font-bold ${performance.color}`}>{performance.level}</h3>
              <p className="text-gray-600">Overall</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-4">Performance</h3>
            <p className="text-gray-700 text-lg">
              {percentage >= 90 && "Outstanding work! You've mastered these SAT Math concepts."}
              {percentage >= 80 && percentage < 90 && "Excellent performance! You're well-prepared for the SAT Math section."}
              {percentage >= 70 && percentage < 80 && "Good job! With a bit more practice, you'll be ready for test day."}
              {percentage >= 60 && percentage < 70 && "Fair effort! Focus on reviewing the concepts you missed."}
              {percentage < 60 && "Keep practicing! Review the explanations below to improve your understanding."}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Performance Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedbackLoading ? (
              <p className="text-gray-600">Generating feedback...</p>
            ) : (
              <>
                {feedbackFallback && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                    AI feedback is currently unavailable. Showing local feedback based on your quiz results.
                  </p>
                )}

                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Overall summary</h4>
                  <p className="text-gray-700">{feedback?.summary}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Weakest topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {(feedback?.weakAreas.length ?? 0) > 0 ? (
                      feedback?.weakAreas.map((area) => (
                        <Badge key={area} className="bg-red-100 text-red-700 hover:bg-red-100">
                          {area}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-600">No major weak area detected.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Strongest topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {(feedback?.strongAreas.length ?? 0) > 0 ? (
                      feedback?.strongAreas.map((area) => (
                        <Badge key={area} className="bg-green-100 text-green-700 hover:bg-green-100">
                          {area}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-600">No clear strongest topic yet.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Difficulty insight</h4>
                  <p className="text-gray-700">{getDifficultyInsight(answers)}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Study tips</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    {(feedback?.studyTips ?? []).slice(0, 3).map((tip, index) => (
                      <li key={`${tip}-${index}`}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Question review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <div
                  key={answer.questionId + String(index)}
                  className={`p-4 rounded-lg border-l-4 ${
                    answer.isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {answer.isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <h4 className="font-semibold text-gray-800">Question {index + 1}</h4>
                        <Badge variant="outline" className="capitalize">
                          {answer.difficulty}
                        </Badge>
                        <span className="text-sm text-gray-600">{answer.topic}</span>
                      </div>
                      <p className="text-gray-800">{answer.question}</p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Your answer: </span>
                          <span className={answer.isCorrect ? "text-green-600" : "text-red-600"}>
                            {getOptionLetter(answer.selected)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Correct: </span>
                          <span className="text-green-600">{getOptionLetter(answer.correct)}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 bg-white/60 rounded-md p-3 border border-gray-100">
                        <span className="font-medium text-gray-600">Explanation: </span>
                        {answer.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button
            onClick={onRestart}
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 px-8 py-3"
          >
            <RotateCcw className="w-5 h-5" />
            Take another quiz
          </Button>
        </div>

        <div className="text-center mt-8 text-gray-500">
          <p>Keep practicing to improve your SAT Math score.</p>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
