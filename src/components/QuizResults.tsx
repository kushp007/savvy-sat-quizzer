
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, Target, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Answer {
  question: string;
  selected: number;
  correct: number;
  isCorrect: boolean;
}

interface QuizResultsProps {
  playerName: string;
  score: number;
  totalQuestions: number;
  answers: Answer[];
  onRestart: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  playerName,
  score,
  totalQuestions,
  answers,
  onRestart
}) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (percentage >= 80) return { level: 'Great', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (percentage >= 70) return { level: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (percentage >= 60) return { level: 'Fair', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { level: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const performance = getPerformanceLevel(percentage);

  const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Quiz Complete!</h1>
          <p className="text-xl text-gray-600">Great job, {playerName}!</p>
        </div>

        {/* Score Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Target className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800">{score}/{totalQuestions}</h3>
              <p className="text-gray-600">Questions Correct</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800">{percentage}%</h3>
              <p className="text-gray-600">Accuracy</p>
            </CardContent>
          </Card>

          <Card className={`text-center ${performance.bg}`}>
            <CardContent className="pt-6">
              <Clock className={`w-12 h-12 ${performance.color} mx-auto mb-4`} />
              <h3 className={`text-2xl font-bold ${performance.color}`}>{performance.level}</h3>
              <p className="text-gray-600">Performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Message */}
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-4">Performance Analysis</h3>
            <p className="text-gray-700 text-lg">
              {percentage >= 90 && "Outstanding work! You've mastered these SAT Math concepts."}
              {percentage >= 80 && percentage < 90 && "Excellent performance! You're well-prepared for the SAT Math section."}
              {percentage >= 70 && percentage < 80 && "Good job! With a bit more practice, you'll be ready for test day."}
              {percentage >= 60 && percentage < 70 && "Fair effort! Focus on reviewing the concepts you missed."}
              {percentage < 60 && "Keep practicing! Review the explanations below to improve your understanding."}
            </p>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Question Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    answer.isCorrect 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-red-500 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {answer.isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Question {index + 1}: {answer.question}
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Your Answer: </span>
                          <span className={answer.isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {getOptionLetter(answer.selected)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Correct Answer: </span>
                          <span className="text-green-600">
                            {getOptionLetter(answer.correct)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button 
            onClick={onRestart}
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 px-8 py-3"
          >
            <RotateCcw className="w-5 h-5" />
            Take Another Quiz
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p>Keep practicing to improve your SAT Math score!</p>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
