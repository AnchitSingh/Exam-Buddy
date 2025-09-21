import React from 'react';
import Button from '../ui/Button';

const QuizHeader = ({ 
  title = "Quiz", 
  currentQuestion, 
  totalQuestions, 
  timeLeft,
  onPause,
  onStop,
  onBookmark,
  isBookmarked = false 
}) => {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeWarning = timeLeft <= 30;

  return (
    <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Mobile Layout */}
        <div className="sm:hidden">
          {/* Top Row: Logo and Timer */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EB</span>
              </div>
              <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
            </div>
            
            {/* Timer (Mobile) */}
            <div className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 shadow-sm border ${
              isTimeWarning 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'bg-white/90 border-amber-100 text-slate-700'
            }`}>
              <svg className={`w-4 h-4 ${isTimeWarning ? 'text-red-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className={`font-mono text-base font-semibold ${isTimeWarning ? 'animate-pulse' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          
          {/* Bottom Row: Controls and Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Bookmark (Mobile) */}
              <button 
                onClick={onBookmark}
                className={`p-1.5 rounded-lg transition-colors ${
                  isBookmarked 
                    ? 'text-amber-600 bg-amber-50' 
                    : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
                }`}
              >
                <svg className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
              </button>
              
              <Button onClick={onPause} variant="secondary" size="sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
                Pause
              </Button>
              
              <Button onClick={onStop} variant="danger" size="sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
                Stop
              </Button>
            </div>
            
            {/* Question Counter (Mobile) */}
            <div className="text-sm text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">
              <span className="font-semibold text-slate-800">{currentQuestion}</span> of{" "}
              <span className="font-semibold text-slate-800">{totalQuestions}</span>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">EB</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
          </div>

          {/* Controls & Timer */}
          <div className="flex items-center space-x-4">
            {/* Control Buttons */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={onBookmark}
                className={`p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isBookmarked 
                    ? 'text-amber-600 bg-amber-50' 
                    : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
                }`}
                title="Bookmark this question"
              >
                <svg className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
              </button>

              <Button onClick={onPause} variant="secondary" size="md">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
                Pause
              </Button>

              <Button onClick={onStop} variant="danger" size="md">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
                Stop
              </Button>
            </div>

            {/* Timer (Desktop) */}
            <div className={`flex items-center space-x-2 rounded-full px-4 py-2 shadow-lg border ${
              isTimeWarning 
                ? 'bg-red-50 border-red-200' 
                : 'bg-white/90 border-amber-100'
            }`}>
              <svg className={`w-5 h-5 ${isTimeWarning ? 'text-red-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className={`font-mono text-lg font-semibold ${
                isTimeWarning ? 'text-red-700 animate-pulse' : 'text-slate-700'
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Question Counter */}
            <div className="text-sm text-slate-600 bg-slate-100 rounded-full px-3 py-1">
              <span className="font-semibold text-slate-800">{currentQuestion}</span> of{" "}
              <span className="font-semibold text-slate-800">{totalQuestions}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default QuizHeader;
