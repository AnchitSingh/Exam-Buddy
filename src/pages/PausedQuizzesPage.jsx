import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import examBuddyAPI from '../services/api';

const PausedQuizzesPage = ({ onNavigate }) => {
  const [pausedQuizzes, setPausedQuizzes] = useState([]);

  useEffect(() => {
    const loadPausedQuizzes = async () => {
      const response = await examBuddyAPI.getPausedQuizzes();
      if (response.success) {
        const sortedQuizzes = response.data.sort((a, b) => new Date(b.pausedAt) - new Date(a.pausedAt));
        setPausedQuizzes(sortedQuizzes);
      }
    };
    loadPausedQuizzes();
  }, []);

  const resumeQuiz = (quizId) => {
    console.log('Resuming quiz:', quizId);
    onNavigate('quiz', { quizConfig: { quizId: quizId } });
  };

  const restartQuiz = (quizId) => {
    if (confirm('Are you sure you want to restart this quiz? Your current progress will be lost.')) {
      const quizToRestart = pausedQuizzes.find(q => q.id === quizId);
      if (quizToRestart) {
        console.log('Restarting quiz with config:', quizToRestart.config);
        onNavigate('quiz', { quizConfig: quizToRestart.config });
      } else {
        console.error('Could not find quiz to restart');
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => onNavigate('home')} 
                className="p-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">EB</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-800">Paused Quizzes</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="default">{pausedQuizzes.length} paused</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Continue Your Learning</h2>
          <p className="text-slate-600">Pick up where you left off with your paused quizzes</p>
        </div>

        {/* Paused Quizzes List */}
        {pausedQuizzes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Paused Quizzes</h3>
            <p className="text-slate-600 mb-6">You don't have any paused quizzes at the moment</p>
            <Button onClick={() => onNavigate('home', { openQuizSetup: true })}>
              Start New Quiz
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pausedQuizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={
                    quiz.subject === 'Physics' ? 'info' : 
                    quiz.subject === 'Math' ? 'success' : 
                    'purple'
                  }>
                    {quiz.subject}
                  </Badge>
                  <div className="text-xs text-slate-500">Paused {quiz.pausedAt}</div>
                </div>
                
                <h3 className="text-lg font-semibold text-slate-800 mb-3">{quiz.title}</h3>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span>Progress</span>
                    <span>{quiz.currentQuestion}/{quiz.totalQuestions} questions</span>
                  </div>
                  <ProgressBar 
                    progress={quiz.progress} 
                    showPercentage={false}
                    color={
                      quiz.subject === 'Physics' ? 'blue' : 
                      quiz.subject === 'Math' ? 'green' : 
                      'purple'
                    }
                  />
                  <div className="text-xs text-slate-500 mt-1">{quiz.progress}% complete</div>
                </div>
                
                {/* Quiz Stats */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Current Score:</span>
                    <span className="font-semibold text-slate-800">{quiz.score.correct}/{quiz.score.total} correct</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Time Remaining:</span>
                    <span className="font-semibold text-slate-800">{formatTime(quiz.timeRemaining)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Difficulty:</span>
                    <Badge size="xs" variant={
                      quiz.difficulty === 'Easy' ? 'success' : 
                      quiz.difficulty === 'Medium' ? 'warning' : 
                      'danger'
                    }>
                      {quiz.difficulty}
                    </Badge>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="space-y-3">
                  <Button 
                    onClick={() => resumeQuiz(quiz.id)} 
                    className="w-full"
                  >
                    Continue Quiz
                  </Button>
                  <button 
                    onClick={() => restartQuiz(quiz.id)} 
                    className="w-full px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors"
                  >
                    Restart from Beginning
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default PausedQuizzesPage;
