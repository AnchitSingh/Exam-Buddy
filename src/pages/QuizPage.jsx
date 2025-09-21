import React, { useState, useRef } from 'react';
import QuizHeader from '../components/quiz/QuizHeader';
import QuestionTypeRenderer from '../components/quiz/QuestionTypeRenderer';
import ProgressBar from '../components/ui/ProgressBar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import AIProcessingFeedback from '../components/ui/AIProcessingFeedback';
import useQuizState from '../hooks/useQuizState';

const QuizPage = ({ onNavigate, quizConfig = null }) => {
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
  } = useQuizState(quizConfig);

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [showAIProcessing, setShowAIProcessing] = useState(false);
  const [aiTask, setAITask] = useState('processing');
  
  const questionRendererRef = useRef();

  const handleSubjectiveAnswer = () => {
    if (questionRendererRef.current) {
      const subjectiveAnswer = questionRendererRef.current.getAnswer();
      if (subjectiveAnswer) {
        const isCorrect = currentQuestion.type === 'Fill in Blank' 
          ? currentQuestion.acceptableAnswers?.some(acceptableSet =>
              acceptableSet.every((acceptable, index) =>
                subjectiveAnswer[index]?.toLowerCase().trim() === acceptable.toLowerCase()
              )
            ) || false
          : false;
        selectAnswer(0, isCorrect, false, subjectiveAnswer);
      }
    }
  };

  const handleNext = () => {
    handleSubjectiveAnswer();
    nextQuestion();
  };

  const handlePause = () => {
    setShowPauseModal(true);
  };

  const confirmPause = async () => {
    await pauseQuiz();
    setShowPauseModal(false);
    onNavigate('home');
  };

  const handleStop = () => {
    setShowStopModal(true);
  };

  const confirmStop = async () => {
    let finalAnswers = [...userAnswers];
    const subjectiveAnswer = questionRendererRef.current?.getAnswer();

    if (subjectiveAnswer) {
      const isCorrect = currentQuestion.type === 'Fill in Blank' 
        ? currentQuestion.acceptableAnswers?.some(acceptableSet =>
            acceptableSet.every((acceptable, index) =>
              subjectiveAnswer[index]?.toLowerCase().trim() === acceptable.toLowerCase()
            )
          ) || false
        : false;

      const newAnswer = {
        questionId: currentQuestion.id,
        questionType: currentQuestion.type,
        selectedOption: 0,
        isCorrect,
        textAnswer: subjectiveAnswer,
        timeSpent: (config.timerEnabled ? (config.questionTimer || 60) - questionTimeRemaining : 0),
        totalTimeWhenAnswered: timeRemaining,
      };

      if (finalAnswers[currentQuestionIndex]) {
        finalAnswers[currentQuestionIndex] = newAnswer;
      } else {
        finalAnswers.push(newAnswer);
      }
    }

    const results = await stopQuiz(finalAnswers);
    setQuizResults(results);
    setShowStopModal(false);
    
    if (results) {
      setAITask('feedback');
      setShowAIProcessing(true);
    }
  };

  const handleAnswerSelect = (optionIndex, isCorrect, autoSelected = false, textAnswer = null) => {
    if (selectedAnswer && !autoSelected) return;
    
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
              <Button onClick={() => {
                clearError();
                if (quizConfig) {
                  window.location.reload();
                } else {
                  onNavigate('home');
                }
              }}>
                Try Again
              </Button>
              <Button onClick={() => onNavigate('home')} variant="secondary">
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <Button onClick={() => onNavigate('home')}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
      <QuizHeader
        title={quiz.title || 'Quiz'}
        currentQuestion={currentQuestionNumber}
        totalQuestions={quiz.totalQuestions}
        timeLeft={timeRemaining}
        questionTimeLeft={config.timerEnabled ? questionTimeRemaining : null}
        onPause={handlePause}
        onStop={handleStop}
        onBookmark={toggleBookmark}
        isBookmarked={isBookmarked}
        isPaused={isPaused}
      />

      <div className="max-w-4xl mx-auto px-4 py-2">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-10">
        
        <ProgressBar 
          progress={progress} 
          label="Progress"
        />

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-5 sm:p-8 mb-6 sm:mb-8">
          
          <div className="mb-6 sm:mb-8">
            <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <span className="text-amber-700 font-bold text-base sm:text-lg">
                  Q{currentQuestionNumber}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 leading-relaxed">
                    {currentQuestion.question}
                  </h2>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    {currentQuestion.type || 'MCQ'}
                  </span>
                </div>
                <p className="text-slate-600 mt-2 text-xs sm:text-sm">
                  {currentQuestion.type === 'MCQ' ? 'Choose the best answer from the options below' :
                   currentQuestion.type === 'True/False' ? 'Select True or False' :
                   currentQuestion.type === 'Short Answer' ? 'Provide a detailed answer' :
                   currentQuestion.type === 'Fill in Blank' ? 'Fill in the missing words' :
                   'Answer the question below'}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <QuestionTypeRenderer
              ref={questionRendererRef}
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              onAnswerSelect={handleAnswerSelect}
              disabled={showFeedback}
              showResult={showFeedback}
              immediateFeedback={config.immediateFeedback}
            />
          </div>

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

          <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-slate-200">
            <Button
              onClick={previousQuestion}
              variant="ghost"
              disabled={currentQuestionNumber === 1}
              icon={
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
              }
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            
            <Button
              onClick={isLastQuestion ? confirmStop : handleNext}
              icon={
                <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
              }
            >
              {isLastQuestion ? 'Finish Quiz' : (
                <>
                  <span className="hidden sm:inline">Next Question</span>
                  <span className="sm:hidden">Next</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="hidden sm:flex bg-white/60 backdrop-blur-sm rounded-2xl p-6 items-center space-x-4">
          <img src="/assets/i3.png" alt="Study Buddy" className="w-16 h-16 animate-bounce" />
          <div>
            <p className="text-slate-700 font-medium">Keep going! You're doing great!</p>
            <p className="text-sm text-slate-600">
              {selectedAnswer?.isCorrect ? 
                "Excellent work! Ready for the next challenge?" : 
                "Don't worry, learning from mistakes makes you stronger!"
              }
            </p>
          </div>
        </div>

      </main>

      <AIProcessingFeedback
        isVisible={showAIProcessing}
        task={aiTask}
        onComplete={() => setShowAIProcessing(false)}
      />

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
          <Button onClick={() => setShowPauseModal(false)}>
            Resume Quiz
          </Button>
          <Button onClick={confirmPause} variant="secondary">
            Back to Home
          </Button>
        </div>
      </Modal>

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
          <Button onClick={confirmStop} variant="danger">
            Yes, Stop Quiz
          </Button>
          <Button onClick={() => setShowStopModal(false)} variant="secondary">
            Continue Quiz
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default QuizPage;
