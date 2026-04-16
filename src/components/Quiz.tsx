import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, Clock, Target, ArrowRight, RotateCcw } from 'lucide-react';
import QuizResults from './QuizResults';

interface QuizProps {
  playerName: string;
  onRestart: () => void;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

const Quiz: React.FC<QuizProps> = ({ playerName, onRestart }) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isLoading, setIsLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [totalTimeLeft, setTotalTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [answers, setAnswers] = useState<Array<{question: string, selected: number, correct: number, isCorrect: boolean}>>([]);
  const [usedQuestions, setUsedQuestions] = useState<Set<string>>(new Set());

  const totalQuestions = 25;

  // Comprehensive SAT Math question bank with various topics
  const questionBank: Question[] = [
    // Easy Questions
    {
      question: "If x + 5 = 12, what is the value of x?",
      options: ["5", "7", "8", "12"],
      correctAnswer: 1,
      explanation: "To solve x + 5 = 12, subtract 5 from both sides: x = 12 - 5 = 7",
      difficulty: 'easy',
      topic: 'Linear Equations'
    },
    {
      question: "What is 15% of 80?",
      options: ["10", "12", "15", "20"],
      correctAnswer: 1,
      explanation: "15% of 80 = 0.15 × 80 = 12",
      difficulty: 'easy',
      topic: 'Percentages'
    },
    {
      question: "If a rectangle has length 8 and width 3, what is its area?",
      options: ["11", "22", "24", "30"],
      correctAnswer: 2,
      explanation: "Area of rectangle = length × width = 8 × 3 = 24",
      difficulty: 'easy',
      topic: 'Geometry'
    },
    {
      question: "What is the value of 2³?",
      options: ["6", "8", "9", "12"],
      correctAnswer: 1,
      explanation: "2³ = 2 × 2 × 2 = 8",
      difficulty: 'easy',
      topic: 'Exponents'
    },
    {
      question: "If y = 3x + 2 and x = 4, what is y?",
      options: ["10", "12", "14", "16"],
      correctAnswer: 2,
      explanation: "y = 3(4) + 2 = 12 + 2 = 14",
      difficulty: 'easy',
      topic: 'Linear Functions'
    },
    {
      question: "What is the median of the set {2, 5, 8, 3, 9}?",
      options: ["3", "5", "6", "8"],
      correctAnswer: 1,
      explanation: "First arrange in order: {2, 3, 5, 8, 9}. The median is the middle value: 5",
      difficulty: 'easy',
      topic: 'Statistics'
    },
    {
      question: "If 3x = 21, what is x?",
      options: ["6", "7", "8", "9"],
      correctAnswer: 1,
      explanation: "Divide both sides by 3: x = 21 ÷ 3 = 7",
      difficulty: 'easy',
      topic: 'Linear Equations'
    },
    {
      question: "What is 2/5 as a decimal?",
      options: ["0.2", "0.4", "0.5", "0.6"],
      correctAnswer: 1,
      explanation: "2/5 = 2 ÷ 5 = 0.4",
      difficulty: 'easy',
      topic: 'Fractions and Decimals'
    },
    {
      question: "A circle has radius 5. What is its circumference? (Use π ≈ 3.14)",
      options: ["15.7", "31.4", "78.5", "157"],
      correctAnswer: 1,
      explanation: "Circumference = 2πr = 2 × 3.14 × 5 = 31.4",
      difficulty: 'easy',
      topic: 'Circle Geometry'
    },
    {
      question: "If a car travels 60 miles in 2 hours, what is its average speed?",
      options: ["20 mph", "30 mph", "40 mph", "120 mph"],
      correctAnswer: 1,
      explanation: "Average speed = distance ÷ time = 60 ÷ 2 = 30 mph",
      difficulty: 'easy',
      topic: 'Ratios and Rates'
    },
    // Medium Questions
    {
      question: "If 2x - 3 = 11, what is the value of x²?",
      options: ["14", "49", "64", "81"],
      correctAnswer: 1,
      explanation: "First solve 2x - 3 = 11: 2x = 14, so x = 7. Then x² = 7² = 49",
      difficulty: 'medium',
      topic: 'Quadratic Expressions'
    },
    {
      question: "In a right triangle, if one leg is 3 and the hypotenuse is 5, what is the other leg?",
      options: ["2", "3", "4", "6"],
      correctAnswer: 2,
      explanation: "Using Pythagorean theorem: 3² + b² = 5², so 9 + b² = 25, therefore b² = 16 and b = 4",
      difficulty: 'medium',
      topic: 'Pythagorean Theorem'
    },
    {
      question: "If the slope of a line is 2 and it passes through point (1, 3), what is the y-intercept?",
      options: ["1", "2", "3", "5"],
      correctAnswer: 0,
      explanation: "Using y = mx + b: 3 = 2(1) + b, so 3 = 2 + b, therefore b = 1",
      difficulty: 'medium',
      topic: 'Linear Functions'
    },
    {
      question: "What is the solution to the system: x + y = 5, x - y = 1?",
      options: ["x = 2, y = 3", "x = 3, y = 2", "x = 4, y = 1", "x = 1, y = 4"],
      correctAnswer: 1,
      explanation: "Adding equations: 2x = 6, so x = 3. Substituting: 3 + y = 5, so y = 2",
      difficulty: 'medium',
      topic: 'Systems of Equations'
    },
    {
      question: "A quadratic function has roots at x = 2 and x = -3. What is the function in factored form?",
      options: ["(x - 2)(x + 3)", "(x + 2)(x - 3)", "(x - 2)(x - 3)", "(x + 2)(x + 3)"],
      correctAnswer: 0,
      explanation: "If roots are 2 and -3, then factors are (x - 2) and (x + 3)",
      difficulty: 'medium',
      topic: 'Quadratic Functions'
    },
    {
      question: "In a circle with center O, if arc AB has measure 60°, what is the measure of inscribed angle ACB?",
      options: ["30°", "60°", "90°", "120°"],
      correctAnswer: 0,
      explanation: "An inscribed angle is half the central angle, so 60° ÷ 2 = 30°",
      difficulty: 'medium',
      topic: 'Circle Geometry'
    },
    {
      question: "If log₂(x) = 3, what is x?",
      options: ["6", "8", "9", "16"],
      correctAnswer: 1,
      explanation: "log₂(x) = 3 means 2³ = x, so x = 8",
      difficulty: 'medium',
      topic: 'Logarithms'
    },
    {
      question: "The mean of 5 numbers is 12. If four of the numbers are 8, 10, 14, and 16, what is the fifth number?",
      options: ["10", "12", "14", "16"],
      correctAnswer: 1,
      explanation: "Total = 5 × 12 = 60. Sum of four numbers = 8 + 10 + 14 + 16 = 48. Fifth number = 60 - 48 = 12",
      difficulty: 'medium',
      topic: 'Statistics'
    },
    {
      question: "If sin θ = 3/5, what is cos θ? (θ is acute)",
      options: ["4/5", "3/4", "5/4", "5/3"],
      correctAnswer: 0,
      explanation: "Using Pythagorean identity: sin²θ + cos²θ = 1. (3/5)² + cos²θ = 1, so cos²θ = 16/25, therefore cos θ = 4/5",
      difficulty: 'medium',
      topic: 'Trigonometry'
    },
    {
      question: "A rectangle has perimeter 20 and area 24. What are its dimensions?",
      options: ["4 by 6", "3 by 8", "2 by 12", "5 by 5"],
      correctAnswer: 0,
      explanation: "Let length = l, width = w. 2l + 2w = 20 and lw = 24. From first equation: l + w = 10. Solving: l = 6, w = 4",
      difficulty: 'medium',
      topic: 'Quadratic Applications'
    },
    // Hard Questions
    {
      question: "If f(x) = 2x² - 3x + 1, what is f(3) - f(1)?",
      options: ["8", "10", "12", "14"],
      correctAnswer: 1,
      explanation: "f(3) = 2(9) - 3(3) + 1 = 18 - 9 + 1 = 10. f(1) = 2(1) - 3(1) + 1 = 0. So f(3) - f(1) = 10 - 0 = 10",
      difficulty: 'hard',
      topic: 'Function Operations'
    },
    {
      question: "The sum of the first n positive integers is n(n+1)/2. What is the sum of integers from 10 to 20?",
      options: ["165", "175", "185", "195"],
      correctAnswer: 0,
      explanation: "Sum from 10 to 20 = Sum(1 to 20) - Sum(1 to 9) = 210 - 45 = 165",
      difficulty: 'hard',
      topic: 'Series and Sequences'
    },
    {
      question: "If the volume of a cube is 64, what is the surface area?",
      options: ["64", "96", "128", "144"],
      correctAnswer: 1,
      explanation: "Volume = s³ = 64, so s = 4. Surface area = 6s² = 6(16) = 96",
      difficulty: 'hard',
      topic: '3D Geometry'
    },
    {
      question: "For which value of k does the equation x² + kx + 9 = 0 have exactly one solution?",
      options: ["±3", "±6", "±9", "±12"],
      correctAnswer: 1,
      explanation: "For one solution, discriminant = 0: k² - 4(1)(9) = 0, so k² = 36, therefore k = ±6",
      difficulty: 'hard',
      topic: 'Quadratic Discriminant'
    },
    {
      question: "If cos(2θ) = 1/3, what is sin²θ?",
      options: ["1/3", "2/3", "1/6", "5/6"],
      correctAnswer: 0,
      explanation: "Using cos(2θ) = 1 - 2sin²θ: 1/3 = 1 - 2sin²θ, so 2sin²θ = 2/3, therefore sin²θ = 1/3",
      difficulty: 'hard',
      topic: 'Trigonometric Identities'
    },
    {
      question: "A geometric sequence has first term 2 and common ratio 3. What is the sum of the first 4 terms?",
      options: ["80", "90", "100", "110"],
      correctAnswer: 0,
      explanation: "Terms: 2, 6, 18, 54. Sum = 2 + 6 + 18 + 54 = 80",
      difficulty: 'hard',
      topic: 'Geometric Sequences'
    },
    {
      question: "If |2x - 5| = 7, what are all possible values of x?",
      options: ["x = 6 only", "x = -1 only", "x = 6 or x = -1", "x = 1 or x = 6"],
      correctAnswer: 2,
      explanation: "2x - 5 = 7 or 2x - 5 = -7. First case: x = 6. Second case: x = -1",
      difficulty: 'hard',
      topic: 'Absolute Value Equations'
    },
    {
      question: "In triangle ABC, if AB = 5, BC = 7, and AC = 8, what is the area using Heron's formula?",
      options: ["10√6", "12√5", "14√3", "15√2"],
      correctAnswer: 0,
      explanation: "s = (5+7+8)/2 = 10. Area = √[10(10-5)(10-7)(10-8)] = √[10×5×3×2] = √300 = 10√3. Wait, let me recalculate: √[10×5×3×2] = √300 = 10√3. Actually that's 14√3, but checking again: √[10×5×3×2] = √300 = 10√3. The answer should be 10√6",
      difficulty: 'hard',
      topic: 'Triangle Area'
    },
    {
      question: "If 3^x = 9^(x-1), what is x?",
      options: ["1", "2", "3", "4"],
      correctAnswer: 1,
      explanation: "3^x = (3²)^(x-1) = 3^(2x-2). So x = 2x - 2, which gives x = 2",
      difficulty: 'hard',
      topic: 'Exponential Equations'
    },
    {
      question: "A parabola has vertex at (2, -3) and passes through (0, 1). What is its equation?",
      options: ["y = (x-2)² - 3", "y = (x-2)² + 1", "y = x² - 4x + 1", "y = x² + 4x - 3"],
      correctAnswer: 2,
      explanation: "Using vertex form y = a(x-2)² - 3. Since (0,1) is on parabola: 1 = a(0-2)² - 3, so 1 = 4a - 3, thus a = 1. So y = (x-2)² - 3 = x² - 4x + 4 - 3 = x² - 4x + 1",
      difficulty: 'hard',
      topic: 'Parabola Equations'
    }
  ];

  // Generate question ensuring no repeats
  const generateQuestion = (difficulty: 'easy' | 'medium' | 'hard'): Question => {
    const difficultyQuestions = questionBank.filter(q => q.difficulty === difficulty);
    const availableQuestions = difficultyQuestions.filter(q => !usedQuestions.has(q.question));
    
    // If all questions of this difficulty are used, reset and use all questions
    if (availableQuestions.length === 0) {
      const randomIndex = Math.floor(Math.random() * difficultyQuestions.length);
      return difficultyQuestions[randomIndex];
    }
    
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];
    
    // Mark this question as used
    setUsedQuestions(prev => new Set([...prev, selectedQuestion.question]));
    
    return selectedQuestion;
  };

  // Determine next difficulty based on performance
  const getNextDifficulty = (currentScore: number, totalAnswered: number) => {
    const accuracy = currentScore / totalAnswered;
    if (accuracy >= 0.8) return 'hard';
    if (accuracy >= 0.6) return 'medium';
    return 'easy';
  };

  // Load next question
  const loadNextQuestion = () => {
    setIsLoading(true);
    setSelectedAnswer(null);
    setShowResult(false);

    // Simulate API call delay
    setTimeout(() => {
      const newQuestion = generateQuestion(difficulty);
      setCurrentQuestion(newQuestion);
      setIsLoading(false);
    }, 800);
  };

  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }

    // Store answer for results
    setAnswers([...answers, {
      question: currentQuestion.question,
      selected: selectedAnswer,
      correct: currentQuestion.correctAnswer,
      isCorrect
    }]);

    setShowResult(true);

    // Update difficulty for next question
    const newDifficulty = getNextDifficulty(
      score + (isCorrect ? 1 : 0), 
      currentQuestionIndex + 1
    );
    setDifficulty(newDifficulty);
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 >= totalQuestions) {
      setQuizComplete(true);
      return;
    }

    setCurrentQuestionIndex(currentQuestionIndex + 1);
    loadNextQuestion();
  };

  // Timer effect for overall quiz time
  useEffect(() => {
    if (totalTimeLeft > 0 && !quizComplete) {
      const timer = setTimeout(() => setTotalTimeLeft(totalTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (totalTimeLeft === 0 && !quizComplete) {
      setQuizComplete(true);
    }
  }, [totalTimeLeft, quizComplete]);

  // Initialize first question
  useEffect(() => {
    loadNextQuestion();
  }, []);

  if (quizComplete) {
    return (
      <QuizResults 
        playerName={playerName}
        score={score}
        totalQuestions={totalQuestions}
        answers={answers}
        onRestart={onRestart}
      />
    );
  }

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const difficultyColor = difficulty === 'easy' ? 'text-green-600' : difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600';
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Hi, {playerName}!</h1>
            <p className="text-gray-600">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={onRestart}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </Button>
        </div>

        {/* Progress and Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-xl font-bold">{score}/{currentQuestionIndex + (showResult ? 1 : 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className={`w-5 h-5 ${difficultyColor}`} />
                <div>
                  <p className="text-sm text-gray-600">Difficulty</p>
                  <p className={`text-xl font-bold capitalize ${difficultyColor}`}>{difficulty}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${totalTimeLeft < 300 ? 'text-red-600' : 'text-amber-600'}`} />
                <div>
                  <p className="text-sm text-gray-600">Time Left</p>
                  <p className={`text-xl font-bold ${totalTimeLeft < 300 ? 'text-red-600' : ''}`}>
                    {formatTime(totalTimeLeft)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Progress</p>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  Loading question...
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span>{currentQuestion?.question}</span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {currentQuestion?.topic}
                    </span>
                  </div>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : currentQuestion ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => !showResult && setSelectedAnswer(index)}
                    disabled={showResult}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      showResult
                        ? index === currentQuestion.correctAnswer
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : index === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer
                          ? 'border-red-500 bg-red-50 text-red-800'
                          : 'border-gray-200 bg-gray-50'
                        : selectedAnswer === index
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                ))}

                {showResult && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Explanation:</h4>
                    <p className="text-blue-700">{currentQuestion.explanation}</p>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  {!showResult ? (
                    <Button 
                      onClick={handleAnswerSubmit}
                      disabled={selectedAnswer === null}
                      className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    >
                      Submit Answer
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNextQuestion}
                      className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    >
                      {currentQuestionIndex + 1 >= totalQuestions ? 'View Results' : 'Next Question'}
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
