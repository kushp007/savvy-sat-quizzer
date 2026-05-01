
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Brain, Target, Trophy } from 'lucide-react';
import Quiz from '@/components/Quiz';

const Index = () => {
  const [playerName, setPlayerName] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartQuiz = async () => {
    if (!playerName.trim()) return;
    
    setIsLoading(true);
    // Simulate a brief loading time for better UX
    setTimeout(() => {
      setQuizStarted(true);
      setIsLoading(false);
    }, 1000);
  };

  if (quizStarted) {
    return <Quiz playerName={playerName} onRestart={() => {
      setQuizStarted(false);
      setPlayerName('');
    }} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Brain className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Savvy SAT Quizzer
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sharpen your SAT Math skills with adaptive quizzes, real-time feedback, and AI-powered question expansion.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:scale-105 hover:shadow-lg transition duration-300 ease-in-out">
            <CardContent className="pt-6">
              <BookOpen className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Hybrid question pool</h3>
              <p className="text-gray-600">
                Uses both built-in and AI-generated questions to give you more variety as you practice.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:scale-105 hover:shadow-lg transition duration-300 ease-in-out">
            <CardContent className="pt-6">
              <Target className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Adaptive Difficulty</h3>
              <p className="text-gray-600">Questions adjust based on your performance</p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:scale-105 hover:shadow-lg transition duration-300 ease-in-out">
            <CardContent className="pt-6">
              <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-time Scoring</h3>
              <p className="text-gray-600">Track your progress as you go</p>
            </CardContent>
          </Card>
        </div>

        {/* Start Quiz Form */}
        <Card className="max-w-md mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Ready to Start?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="text-base p-3"
                onKeyPress={(e) => e.key === 'Enter' && handleStartQuiz()}
              />
            </div>
            
            <Button 
              onClick={handleStartQuiz}
              disabled={!playerName.trim() || isLoading}
              className="w-full py-3 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Preparing Quiz...
                </div>
              ) : (
                'Start Quiz'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Good luck! Difficulty mix shifts based on your rolling accuracy.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
