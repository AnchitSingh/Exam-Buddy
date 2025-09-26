import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import AIProcessingFeedback from '../components/ui/AIProcessingFeedback';
import useQuizState from '../hooks/useQuizState';

const QuizPage = ({ onNavigate, quizConfig = null }) => {
  const answerRef = useRef();

  const {
    quiz,
    config,
    currentQuestion,
    currentQuestionIndex,
    currentQuestionNumber,
    timeRemaining,
    questionTimeRemaining,
    isQuizActive,
    isPaused,
    isLoading,
    error,
    showFeedback,
    selectedAnswer,
    userAnswers,
    isLastQuestion,
    progress,
    isBookmarked,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    toggleBookmark,
    pauseQuiz,
    stopQuiz,
    toggleImmediateFeedback,
    clearError
  } = useQuizState(quizConfig, answerRef);

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [showAIProcessing, setShowAIProcessing] = useState(false);
  const [aiTask, setAITask] = useState('processing');
  const [showHint, setShowHint] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [fillBlanks, setFillBlanks] = useState(['']);
  
  const questionRendererRef = useRef();

  answerRef.current = { textAnswer, fillBlanks, selectedAnswer };

  // Initialize fill blanks based on question
  React.useEffect(() => {
    if (currentQuestion) {
      setTextAnswer('');
      if (currentQuestion.type === 'Fill in Blank') {
        const blanksCount = currentQuestion.question ? currentQuestion.question.split('_______').length - 1 : 0;
        setFillBlanks(Array(Math.max(0, blanksCount)).fill(''));
      }
      
      // Restore previous answers if they exist
      if (selectedAnswer?.textAnswer) {
        if (currentQuestion.type === 'Short Answer' && typeof selectedAnswer.textAnswer === 'string') {
          setTextAnswer(selectedAnswer.textAnswer);
        }
        if (currentQuestion.type === 'Fill in Blank' && Array.isArray(selectedAnswer.textAnswer)) {
          setFillBlanks(selectedAnswer.textAnswer);
        }
      }
    }
  }, [currentQuestion, selectedAnswer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubjectiveAnswer = () => {
    if (currentQuestion?.type === 'Short Answer' && textAnswer.trim()) {
      const isCorrect = false; // Short answers need AI evaluation
      selectAnswer(0, isCorrect, false, textAnswer.trim());
    } else if (currentQuestion?.type === 'Fill in Blank' && fillBlanks.some(b => b.trim())) {
      const isCorrect = currentQuestion.acceptableAnswers?.some(acceptableSet =>
        acceptableSet.every((acceptable, index) =>
          fillBlanks[index]?.toLowerCase().trim() === acceptable.toLowerCase()
        )
      ) || false;
      selectAnswer(0, isCorrect, false, fillBlanks);
    }
  };

  const handleNext = () => {
    handleSubjectiveAnswer();
    nextQuestion();
  };

  const handlePause = () => {
    setShowPauseModal(true);
    toast('Quiz paused');
  };

  const confirmPause = async () => {
    await pauseQuiz();
    setShowPauseModal(false);
    onNavigate('home');
    toast.success('Quiz progress saved');
  };

  const handleStop = () => {
    setShowStopModal(true);
  };

  const confirmStop = async () => {
    let finalAnswers = [...userAnswers];
    
    // Handle current question if it has an answer
    if (hasAnswer()) {
      handleSubjectiveAnswer();
    }

    const results = await stopQuiz(finalAnswers);
    setQuizResults(results);
    setShowStopModal(false);
    
    if (results) {
      setAITask('feedback');
      setShowAIProcessing(true);
      toast.success('Quiz completed! Generating results...');
    }
  };

  const handleAnswerSelect = (optionIndex, isCorrect, autoSelected = false, textAnswer = null) => {
    // Allow answer changes when immediate feedback is off
    // Only prevent changes when immediate feedback is on and answer is already selected
    if (selectedAnswer && !autoSelected && config.immediateFeedback) return;
    
    if ((currentQuestion?.type === 'Short Answer' || currentQuestion?.type === 'Fill in Blank') && config.immediateFeedback) {
      setAITask('evaluation');
      setShowAIProcessing(true);
      
      setTimeout(() => {
        setShowAIProcessing(false);
        selectAnswer(optionIndex, isCorrect, autoSelected, textAnswer);
      }, 2000);
    } else {
      selectAnswer(optionIndex, isCorrect, autoSelected, textAnswer);
    }
  };

  // Helper function to check if an answer is selected
  const hasAnswer = () => {
    if (currentQuestion?.type === 'MCQ' || currentQuestion?.type === 'True/False') {
      // For MCQ and True/False, an answer is selected if there's a selectedAnswer
      return selectedAnswer !== null;
    }
    if (currentQuestion?.type === 'Short Answer') {
      return textAnswer.trim() !== '';
    }
    if (currentQuestion?.type === 'Fill in Blank') {
      return fillBlanks.some(blank => blank.trim() !== '');
    }
    return false;
  };

  // Get question type for display
  const getQuestionTypeDisplay = () => {
    const type = currentQuestion?.type || 'MCQ';
    switch (type) {
      case 'MCQ': return 'Multiple Choice';
      case 'True/False': return 'True/False';
      case 'Short Answer': return 'Short Answer';
      case 'Fill in Blank': return 'Fill in the Blank';
      default: return 'Multiple Choice';
    }
  };

  // Render different question types
  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'MCQ':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index, option.isCorrect)}
                disabled={selectedAnswer !== null && config.immediateFeedback}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                  selectedAnswer?.optionIndex === index
                    ? 'border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg scale-[1.02]'
                    : 'border-white/50 bg-white/60 hover:border-amber-200 hover:bg-white/80'
                } backdrop-blur-sm ${selectedAnswer !== null && config.immediateFeedback ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    selectedAnswer?.optionIndex === index
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-slate-300'
                  }`}>
                    {selectedAnswer?.optionIndex === index && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </div>
                  <span className={`text-base ${selectedAnswer?.optionIndex === index ? 'text-amber-700 font-medium' : 'text-slate-700'}`}>
                    {option.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'True/False':
        return (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswerSelect(0, currentQuestion.options?.[0]?.isCorrect)}
              disabled={selectedAnswer !== null && config.immediateFeedback}
              className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                selectedAnswer?.optionIndex === 0
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg scale-[1.02]'
                  : 'border-white/50 bg-white/60 hover:border-green-200 hover:bg-white/80'
              } backdrop-blur-sm ${selectedAnswer !== null && config.immediateFeedback ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <svg className="w-10 h-10 mx-auto mb-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span className={`text-lg ${selectedAnswer?.optionIndex === 0 ? 'text-green-700 font-semibold' : 'text-slate-700'}`}>
                True
              </span>
            </button>
            
            <button
              onClick={() => handleAnswerSelect(1, currentQuestion.options?.[1]?.isCorrect)}
              disabled={selectedAnswer !== null && config.immediateFeedback}
              className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                selectedAnswer?.optionIndex === 1
                  ? 'border-red-500 bg-gradient-to-br from-red-50 to-pink-50 shadow-lg scale-[1.02]'
                  : 'border-white/50 bg-white/60 hover:border-red-200 hover:bg-white/80'
              } backdrop-blur-sm ${selectedAnswer !== null && config.immediateFeedback ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <svg className="w-10 h-10 mx-auto mb-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              <span className={`text-lg ${selectedAnswer?.optionIndex === 1 ? 'text-red-700 font-semibold' : 'text-slate-700'}`}>
                False
              </span>
            </button>
          </div>
        );

      case 'Fill in Blank':
        return (
          <div className="space-y-4">
            <div className="text-lg text-slate-700 leading-relaxed">
              {currentQuestion.question?.split('_______').map((part, index, array) => (
                <span key={index}>
                  {part}
                  {index < array.length - 1 && (
                                          <input
                        type="text"
                        value={fillBlanks[index] || ''}
                        onChange={(e) => {
                          const newBlanks = [...fillBlanks];
                          newBlanks[index] = e.target.value;
                          setFillBlanks(newBlanks);
                        }}
                        disabled={selectedAnswer !== null && config.immediateFeedback}
                        placeholder="your answer"
                        className="inline-block mx-2 px-4 py-2 bg-white/80 backdrop-blur-sm border-b-2 border-amber-400 focus:border-amber-600 outline-none rounded-lg min-w-[150px] text-center font-medium text-amber-700 placeholder-amber-300 disabled:opacity-50"
                      />
                  )}
                </span>
              ))}
            </div>
          </div>
        );

      case 'Short Answer':
        return (
          <textarea
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={selectedAnswer !== null && config.immediateFeedback}
            placeholder="Type your answer here..."
            className="w-full p-4 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-2xl focus:border-amber-400 outline-none resize-none h-40 text-slate-700 placeholder-slate-400 disabled:opacity-50"
          />
        );

      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            <p className="text-slate-600 font-medium">Generating your quiz...</p>
            <p className="text-slate-500 text-sm mt-2">
              {quizConfig?.topic ? `Topic: ${quizConfig.topic}` : 'Setting up questions'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => {
                  clearError();
                  if (quizConfig) {
                    window.location.reload();
                  } else {
                    onNavigate('home');
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Try Again
              </button>
              <button 
                onClick={() => onNavigate('home')}
                className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No quiz data
  if (!quiz || !currentQuestion) {
    return (
      <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-slate-600 mb-4">No quiz data available</p>
            <button 
              onClick={() => onNavigate('home')}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz results redirect
  if (quizResults) {
    const QuizResultsPage = React.lazy(() => import('./QuizResultsPage'));
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            <p className="text-slate-600">Loading results...</p>
          </div>
        </div>
      }>
        <QuizResultsPage results={quizResults} onNavigate={onNavigate} />
      </React.Suspense>
    );
  }

  return (
    <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 -right-20 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl"></div>
      </div>

      {/* Enhanced Header */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-amber-100/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Left: Progress and Question Number */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              {/* Logo/Icon */}
              <div className="hidden sm:block w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              
              {/* Progress Info */}
              <div className="flex-1 sm:flex-none">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                  <span className="text-xs sm:text-sm font-medium text-slate-600">Question</span>
                  <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {currentQuestionNumber}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500">of {quiz.totalQuestions}</span>
                </div>
                <div className="w-32 sm:w-48 bg-slate-200/50 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{width: `${progress}%`}}
                  ></div>
                </div>
              </div>
            </div>

            {/* Center: Timers - Hidden on smallest screens */}
            <div className="hidden md:flex items-center space-x-8">
              {config.timerEnabled && questionTimeRemaining !== null && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-md border border-white/50">
                  <p className="text-xs text-slate-500 text-center mb-1">Question Time</p>
                  <p className="text-xl font-mono font-bold text-amber-700">{formatTime(questionTimeRemaining)}</p>
                </div>
              )}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-md border border-white/50">
                <p className="text-xs text-slate-500 text-center mb-1">Total Time</p>
                <p className="text-xl font-mono font-bold text-slate-700">{formatTime(timeRemaining)}</p>
              </div>
            </div>

            {/* Right: Control Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handlePause}
                className="group flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/80 backdrop-blur-sm border-2 border-amber-200/50 text-amber-700 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-xs sm:text-base font-medium">Pause</span>
              </button>
              <button
                onClick={handleStop}
                className="group flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/80 backdrop-blur-sm border-2 border-red-200/50 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                </svg>
                <span className="text-xs sm:text-base font-medium">Stop</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Timer Bar - Shows on mobile only */}
        <div className="md:hidden px-4 pb-3">
          <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-xl px-3 py-2">
            {config.timerEnabled && questionTimeRemaining !== null && (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-xs text-slate-600">Question: <span className="font-mono font-bold text-amber-700">{formatTime(questionTimeRemaining)}</span></span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="text-xs text-slate-600">Total: <span className="font-mono font-bold text-slate-700">{formatTime(timeRemaining)}</span></span>
            </div>
          </div>
        </div>
      </header>

      {/* Immediate Feedback Toggle */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-end">
          <button
            onClick={toggleImmediateFeedback}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center space-x-1 transition-colors"
          >
            <span>Immediate feedback:</span>
            <span className={`font-medium ${config.immediateFeedback ? 'text-green-600' : 'text-red-600'}`}>
              {config.immediateFeedback ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Question Navigation - Horizontal Scrollable */}
      <div className="lg:hidden px-4 pt-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-md border border-white/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Question Navigator</h3>
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className={`w-5 h-5 transform transition-transform ${showMobileNav ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          </div>
          
          {showMobileNav && (
            <div className="animate-fade-in">
              <div className="overflow-x-auto pb-2">
                <div className="flex space-x-2 min-w-max">
                  {[...Array(quiz.totalQuestions)].map((_, idx) => {
                    const questionNumber = idx + 1;
                    const isActive = questionNumber === currentQuestionNumber;
                    const isAnswered = questionNumber < currentQuestionNumber || (questionNumber === currentQuestionNumber && selectedAnswer);
                    
                    return (
                      <button
                        key={idx}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300 flex-shrink-0 ${
                          isActive 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md scale-110' 
                            : isAnswered
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {questionNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Compact Legend */}
              <div className="flex items-center justify-center space-x-4 mt-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded"></div>
                  <span className="text-slate-600">Current</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span className="text-slate-600">Answered</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-slate-50 border border-slate-200 rounded"></div>
                  <span className="text-slate-600">Pending</span>
                </div>
              </div>
            </div>
          )}

          {!showMobileNav && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">
                {userAnswers.length} answered • {quiz.totalQuestions - userAnswers.length} remaining
              </span>
              <span className="text-xs font-medium text-amber-600">
                {Math.round(progress)}% complete
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Quiz Content - Better Layout */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6 animate-fade-in-up">
            {/* Question Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6 sm:p-8">
              {/* Question Header with Actions */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-xs sm:text-sm font-medium rounded-full">
                      {getQuestionTypeDisplay()}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 leading-relaxed">
                    {currentQuestion.question}
                  </h2>
                </div>
                <div className="flex items-center space-x-1 ml-4">
                  <button
                    onClick={toggleBookmark}
                    className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 ${
                      isBookmarked 
                        ? 'text-amber-600 bg-amber-50 shadow-md' 
                        : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                    }`}
                  >
                    <svg className="w-4 sm:w-5 h-4 sm:h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
                  >
                    <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Hint Box */}
              {showHint && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl animate-fade-in">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Hint:</span> {currentQuestion.hint || "Think carefully about the key concepts related to this topic..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Question Content */}
              <div className="mb-8">
                {renderQuestionContent()}
              </div>

              {/* Feedback Section */}
              {showFeedback && (
                <div className="mb-6">
                  <div className={`border rounded-xl sm:rounded-2xl p-4 sm:p-6 ${selectedAnswer?.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${selectedAnswer?.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                        <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedAnswer?.isCorrect ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          {selectedAnswer?.isCorrect ? (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                          ) : (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
                          )}
                        </svg>
                      </div>
                      <div>
                        <h3 className={`font-semibold mb-1 sm:mb-2 text-sm sm:text-base ${selectedAnswer?.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                          {selectedAnswer?.isCorrect ? 'Correct! Well done! 🎉' : 'Not quite right'}
                          {selectedAnswer?.aiEvaluated && (
                            <span className="ml-2 text-xs text-purple-600">✨ AI Evaluated</span>
                          )}
                        </h3>
                        <p className={`text-xs sm:text-sm ${selectedAnswer?.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                <button 
                  onClick={previousQuestion}
                  disabled={currentQuestionNumber === 1 || config.questionTimer > 0}
                  className="text-slate-400 hover:text-slate-600 font-medium transition-colors duration-300 order-2 sm:order-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous Question
                </button>
                
                <button
                  onClick={isLastQuestion ? confirmStop : handleNext}
                  disabled={!hasAnswer() && !isLastQuestion}
                  className={`px-6 sm:px-8 py-3 rounded-2xl font-semibold transition-all duration-300 transform order-1 sm:order-2 w-full sm:w-auto ${
                    hasAnswer() || isLastQuestion
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isLastQuestion ? 'Finish Quiz' : 'Next Question'} →
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Sidebar - Question Navigation */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4">Questions</h3>
              <div className="grid grid-cols-3 gap-2">
                {[...Array(quiz.totalQuestions)].map((_, idx) => {
                  const questionNumber = idx + 1;
                  const isActive = questionNumber === currentQuestionNumber;
                  const isAnswered = questionNumber < currentQuestionNumber || (questionNumber === currentQuestionNumber && selectedAnswer);
                  
                  return (
                    <button
                      key={idx}
                      className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md scale-110' 
                          : isAnswered
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {questionNumber}
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-6 space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded"></div>
                  <span className="text-slate-600">Current</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                  <span className="text-slate-600">Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded"></div>
                  <span className="text-slate-600">Not Visited</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Processing Feedback */}
      <AIProcessingFeedback
        isVisible={showAIProcessing}
        task={aiTask}
        onComplete={() => setShowAIProcessing(false)}
      />

      {/* Pause Modal */}
      <Modal 
        isOpen={showPauseModal}
        onClose={() => setShowPauseModal(false)}
        title="Quiz Paused"
        icon={
          <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        }
      >
        <p className="text-gray-600 mb-6">
          Your progress has been saved. You can resume anytime from where you left off.
        </p>
        <div className="flex flex-col space-y-3">
          <button 
            onClick={() => setShowPauseModal(false)}
            className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-2xl hover:shadow-lg transition-all duration-200"
          >
            Resume Quiz
          </button>
          <button 
            onClick={confirmPause}
            className="w-full px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </Modal>

      {/* Stop Modal */}
      <Modal 
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        title="Stop Quiz?"
        icon={
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z"/>
          </svg>
        }
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to stop this quiz? Your current progress will be saved, but the quiz will end.
        </p>
        <div className="flex flex-col space-y-3">
          <button 
            onClick={confirmStop}
            className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-2xl hover:bg-red-700 transition-colors"
          >
            Yes, Stop Quiz
          </button>
          <button 
            onClick={() => setShowStopModal(false)}
            className="w-full px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-2xl hover:bg-slate-200 transition-colors"
          >
            Continue Quiz
          </button>
        </div>
      </Modal>

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
        
        /* Hide scrollbar but keep functionality */
        .overflow-x-auto::-webkit-scrollbar {
          height: 4px;
        }
        
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #fbbf24;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default QuizPage;