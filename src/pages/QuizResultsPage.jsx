import React, { useState } from 'react';

const QuizResultsPage = ({ results, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'solutions'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  if (!results) {
    return (
      <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-slate-600 mb-4">No results available</p>
          </div>
        </div>
      </div>
    );
  }

  const { score, totalQuestions, answers, timeSpent, config } = results;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const unansweredCount = (answers || []).filter(a => a && a.unanswered).length;
  const incorrectCount = totalQuestions - score - unansweredCount;

  // Calculate performance level
  const getPerformanceLevel = () => {
    if (percentage >= 90) return { text: "Outstanding!", color: "from-green-500 to-emerald-500" };
    if (percentage >= 75) return { text: "Great job!", color: "from-amber-500 to-orange-500" };
    if (percentage >= 60) return { text: "Good effort!", color: "from-blue-500 to-indigo-500" };
    return { text: "Keep practicing!", color: "from-purple-500 to-pink-500" };
  };

  const performance = getPerformanceLevel();

  const formatTime = (seconds) => {
    if (typeof seconds === 'string') return seconds;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate AI-like feedback based on performance
  const generateAIFeedback = () => {
    const correctPercentage = percentage;
    let feedback = "";
    let strengths = [];
    let improvements = [];

    if (correctPercentage >= 90) {
      feedback = "Excellent performance! You demonstrated strong mastery of the subject matter with consistent accuracy across all question types.";
      strengths = ["Comprehensive understanding", "Strong analytical skills"];
      improvements = ["Continue challenging yourself", "Explore advanced topics"];
    } else if (correctPercentage >= 75) {
      feedback = "Great work! You showed solid understanding with room for minor improvements in specific areas.";
      strengths = ["Good conceptual grasp", "Effective problem-solving"];
      improvements = ["Review missed concepts", "Practice similar problems"];
    } else if (correctPercentage >= 60) {
      feedback = "Good effort! You have a foundation to build upon. Focus on strengthening key concepts for better results.";
      strengths = ["Basic understanding established", "Learning progress evident"];
      improvements = ["Strengthen fundamentals", "Increase practice time"];
    } else {
      feedback = "Keep practicing! This is a learning opportunity. Focus on understanding core concepts and practice regularly.";
      strengths = ["Showing effort to learn", "Identifying knowledge gaps"];
      improvements = ["Review all topics thoroughly", "Seek additional resources"];
    }

    return { feedback, strengths, improvements };
  };

  const aiInsights = generateAIFeedback();

  const recommendedQuizzes = [
    { 
      id: 'rec1', 
      title: 'Review Incorrect Answers', 
      reason: 'Focus on the questions you missed in this quiz.', 
      difficulty: 'Custom', 
      icon: '🎯' 
    },
    { 
      id: 'rec2', 
      title: 'Related Topics Quiz', 
      reason: 'Broaden your knowledge around this subject.', 
      difficulty: 'Medium', 
      icon: '📚' 
    },
    { 
      id: 'rec3', 
      title: 'Challenge Mode', 
      reason: 'Try a harder quiz on the same topic.', 
      difficulty: 'Hard', 
      icon: '🔥' 
    }
  ];

  const renderSubjectiveAnswer = (question, answer) => {
    const textAnswer = answer?.textAnswer;

    if (!textAnswer) {
      return <p className="text-slate-800 font-medium">No answer provided</p>;
    }

    if (Array.isArray(textAnswer)) { // Fill in the Blank
      const parts = question.question.split('_______');
      const userAnswerSentence = parts.reduce((acc, part, i) => {
        const blank = textAnswer[i] ? `<strong class="text-amber-700 font-semibold">${textAnswer[i]}</strong>` : '_______';
        return acc + part + (i < parts.length - 1 ? blank : '');
      }, '');

      const correctAnswer = question.acceptableAnswers?.[0];
      let correctAnswerSentence = '';
      if (!answer.isCorrect && correctAnswer) {
        correctAnswerSentence = parts.reduce((acc, part, i) => {
          const blank = correctAnswer[i] ? `<strong class="text-green-700 font-semibold">${correctAnswer[i]}</strong>` : '_______';
          return acc + part + (i < parts.length - 1 ? blank : '');
        }, '');
      }

      return (
        <div>
          <div className="mb-3 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl p-3">
            <p className="text-sm text-slate-600 mb-1">Your answer:</p>
            <p className="text-slate-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: userAnswerSentence }} />
          </div>
          {correctAnswerSentence && (
            <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl p-3">
              <p className="text-sm text-green-800 mb-1">Correct answer:</p>
              <p className="text-green-900 leading-relaxed" dangerouslySetInnerHTML={{ __html: correctAnswerSentence }} />
            </div>
          )}
        </div>
      );
    }

    // Short Answer
    return (
      <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl p-3">
        <p className="text-sm text-slate-600 mb-1">Your answer:</p>
        <p className="text-slate-800 font-medium">{textAnswer}</p>
      </div>
    );
  };

  // Get current question for solutions view
  const currentQuestion = results.quiz?.questions?.[currentQuestionIndex] || null;
  const currentAnswer = answers?.[currentQuestionIndex] || null;

  return (
    <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 -z-10 opacity-40 overflow-hidden">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl"></div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center py-12 w-full overflow-x-hidden">
        
        {/* Score Display - Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          {/* Animated Score Circle */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 to-orange-200/20 rounded-full blur-2xl animate-pulse-slow"></div>
            
            <div className="relative bg-white rounded-full w-48 h-48 shadow-2xl flex flex-col items-center justify-center border border-amber-100/50">
              <div className={`text-6xl font-bold bg-gradient-to-r ${performance.color} bg-clip-text text-transparent animate-scale-in`}>
                {percentage}%
              </div>
              <p className="text-slate-500 text-sm mt-1">{score}/{totalQuestions} correct</p>
            </div>
            
            {/* Decorative Ring */}
            <svg className="absolute inset-0 w-48 h-48 animate-rotate-slow">
              <circle
                cx="96"
                cy="96"
                r="94"
                stroke="url(#gradient)"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${percentage * 5.9} 590`}
                strokeLinecap="round"
                className="transform -rotate-90 origin-center"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight mb-3">
            <span className={`bg-gradient-to-r ${performance.color} bg-clip-text text-transparent`}>
              {performance.text}
            </span>
          </h1>
          <p className="text-lg text-slate-600">You've completed the quiz in {formatTime(timeSpent)}</p>
        </div>

        {/* Quick Stats - Minimal Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/50 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl font-bold text-green-600">{score}</div>
            <p className="text-sm text-slate-500 mt-1">Correct</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/50 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
            <p className="text-sm text-slate-500 mt-1">Incorrect</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/50 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl font-bold text-slate-400">{unansweredCount}</div>
            <p className="text-sm text-slate-500 mt-1">Skipped</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/50 hover:scale-105 transition-transform duration-300">
            <div className="text-2xl font-bold text-blue-600">{formatTime(timeSpent)}</div>
            <p className="text-sm text-slate-500 mt-1">Time</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-white/50">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Overview & Insights
              </button>
              <button
                onClick={() => setActiveTab('solutions')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'solutions'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Solutions
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <>
            {/* AI Feedback - Clean Card */}
            <div className="mb-12 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">AI Evaluation</h3>
                    <p className="text-slate-600 leading-relaxed">
                      {aiInsights.feedback}
                    </p>
                    
                    {/* Expandable Details */}
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="mt-3 text-amber-600 hover:text-amber-700 text-sm font-medium inline-flex items-center transition-colors duration-300"
                    >
                      {showDetails ? 'Hide' : 'Show'} detailed analysis
                      <svg className={`w-4 h-4 ml-1 transform transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    
                    {showDetails && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 animate-fade-in">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Strong areas:</span>
                          <span className="text-green-600 font-medium">{aiInsights.strengths.join(', ')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Focus areas:</span>
                          <span className="text-amber-600 font-medium">{aiInsights.improvements.join(', ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Primary & Secondary */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <button 
                onClick={() => onNavigate('home', { openQuizSetup: true })}
                className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
              >
                <span className="flex items-center justify-center font-semibold">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                  Take New Quiz
                </span>
              </button>
              
              <button 
                onClick={() => onNavigate('home')}
                className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-slate-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 border border-amber-100/50"
              >
                <span className="flex items-center justify-center font-semibold">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                  Back to Home
                </span>
              </button>
            </div>

            {/* Recommendations - Subtle Section */}
            <div className="animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <h3 className="text-center text-sm font-medium text-slate-500 mb-6">Recommended next steps</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {recommendedQuizzes.map((quiz) => (
                  <button 
                    key={quiz.id}
                    onClick={() => onNavigate('home', { openQuizSetup: true })}
                    className="group bg-white/60 backdrop-blur-sm rounded-xl p-4 hover:bg-white/80 transition-all duration-300 border border-white/50 text-left"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-lg">{quiz.icon}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{quiz.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{quiz.reason}</p>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full font-medium ${
                          quiz.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                          quiz.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {quiz.difficulty}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Solutions Tab Content */
          <div className="animate-fade-in">
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Main Solution Content */}
              <div className="lg:col-span-3 space-y-6 max-w-full">
                {currentQuestion && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6 sm:p-8 max-w-full overflow-hidden">
                    {/* Question Header */}
                    <div className="flex items-start space-x-4 mb-6 max-w-full">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                        currentAnswer?.unanswered ? 'bg-slate-100 text-slate-700' : 
                        currentAnswer?.isCorrect ? 'bg-green-100 text-green-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {currentAnswer?.unanswered ? '?' : currentAnswer?.isCorrect ? '✓' : '✗'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 mb-2 text-xl">
                          Question {currentQuestionIndex + 1}
                          <span className="ml-2 text-xs text-slate-500 bg-white/60 backdrop-blur-sm px-2 py-1 rounded border border-white/50">
                            {currentQuestion.type || 'MCQ'}
                          </span>
                        </h3>
                        <p className="text-slate-700 leading-relaxed text-lg break-words max-w-full">
                          {currentQuestion.question}
                        </p>
                      </div>
                    </div>

                    {/* Answer Section */}
                    {currentAnswer?.unanswered ? (
                      <div className="mb-6">
                        <div className="p-4 rounded-xl bg-slate-100/60 backdrop-blur-sm text-slate-600 font-medium text-center mb-4 border border-white/50">
                          Not Answered
                        </div>
                        {currentQuestion.type === 'MCQ' || currentQuestion.type === 'True/False' ? (
                          <div className="space-y-3">
                            {(currentQuestion.options || []).map((option, optionIndex) => {
                              const isCorrectOption = option.isCorrect;
                              return (
                                <div key={optionIndex} className={`flex items-center space-x-3 p-4 rounded-xl backdrop-blur-sm border ${
                                  isCorrectOption ? 'bg-green-50/60 border-green-200/50' : 'bg-white/60 border-white/50'
                                }`}>
                                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    isCorrectOption ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {String.fromCharCode(65 + optionIndex)}
                                  </span>
                                  <span className="flex-1 text-slate-700 break-words max-w-full">{option.text}</span>
                                  {isCorrectOption && <span className="text-sm font-medium text-green-600">Correct Answer</span>}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-green-50/60 backdrop-blur-sm border border-green-200/50 text-green-800">
                            <strong>Correct Answer:</strong> {currentQuestion.explanation}
                          </div>
                        )}
                      </div>
                    ) : currentQuestion.type === 'Short Answer' || currentQuestion.type === 'Fill in Blank' ? (
                      <div className="mb-6">
                        {renderSubjectiveAnswer(currentQuestion, currentAnswer)}
                        {currentAnswer?.aiEvaluated && !Array.isArray(currentAnswer?.textAnswer) && (
                          <div className="mt-2 text-xs text-purple-600">
                            ✨ Evaluated by AI
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 mb-6">
                        {(currentQuestion.options || []).map((option, optionIndex) => {
                          const isSelected = currentAnswer?.selectedOption === optionIndex;
                          const isCorrectOption = option.isCorrect;

                          return (
                            <div key={optionIndex} className={`flex items-center space-x-3 p-4 rounded-xl backdrop-blur-sm border ${
                              isSelected && isCorrectOption ? 'bg-green-100/60 border-green-300/50' : 
                              isSelected && !isCorrectOption ? 'bg-red-100/60 border-red-300/50' : 
                              !isSelected && isCorrectOption ? 'bg-green-50/60 border-green-200/50' : 
                              'bg-white/60 border-white/50'
                            }`}>
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                isSelected && isCorrectOption ? 'bg-green-200 text-green-800' : 
                                isSelected && !isCorrectOption ? 'bg-red-200 text-red-800' : 
                                !isSelected && isCorrectOption ? 'bg-green-100 text-green-700' : 
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              <span className="flex-1 text-slate-700 break-words max-w-full">{option.text}</span>
                              {isSelected && <span className="text-sm font-medium text-slate-600">Your Answer</span>}
                              {!isSelected && isCorrectOption && <span className="text-sm font-medium text-green-600">Correct</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation */}
                    {!currentAnswer?.unanswered && currentQuestion.explanation && (
                      <div className="p-4 rounded-xl bg-blue-50/60 backdrop-blur-sm border border-blue-200/50">
                        <div className="flex items-start space-x-2">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-blue-800 mb-1">Explanation</p>
                            <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
                      <button 
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="text-slate-400 hover:text-slate-600 font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Previous Question
                      </button>
                      
                      <button
                        onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                        disabled={currentQuestionIndex === totalQuestions - 1}
                        className="text-slate-400 hover:text-slate-600 font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next Question →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Sidebar - Question Navigation */}
              <div className="hidden lg:block lg:col-span-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 sticky top-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Questions</h3>
                  <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 max-w-full">
                    {[...Array(totalQuestions)].map((_, idx) => {
                      const answer = answers?.[idx];
                      const isActive = idx === currentQuestionIndex;
                      const isCorrect = answer?.isCorrect;
                      const isUnanswered = answer?.unanswered;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                            isActive 
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md scale-110' 
                              : isUnanswered
                              ? 'bg-slate-100 text-slate-400 border border-slate-200'
                              : isCorrect
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}
                        >
                          {idx + 1}
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
                      <span className="text-slate-600">Correct</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                      <span className="text-slate-600">Incorrect</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-slate-100 border border-slate-200 rounded"></div>
                      <span className="text-slate-600">Unanswered</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Question Navigator */}
              <div className="lg:hidden col-span-full">
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
                      <div className="overflow-x-auto pb-2 max-w-full">
                        <div className="flex space-x-2 min-w-max overflow-x-auto">
                          {[...Array(totalQuestions)].map((_, idx) => {
                            const answer = answers?.[idx];
                            const isActive = idx === currentQuestionIndex;
                            const isCorrect = answer?.isCorrect;
                            const isUnanswered = answer?.unanswered;
                            
                            return (
                              <button
                                key={idx}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300 flex-shrink-0 ${
                                  isActive 
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md scale-110' 
                                    : isUnanswered
                                    ? 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200'
                                    : isCorrect
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-red-100 text-red-700 border border-red-200'
                                }`}
                              >
                                {idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share or Save - Minimal Footer Actions */}
        <div className="mt-12 flex justify-center space-x-4 animate-fade-in-up" style={{animationDelay: '0.7s'}}>
          <button className="text-slate-400 hover:text-amber-600 transition-colors duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326"/>
            </svg>
          </button>
          <button className="text-slate-400 hover:text-amber-600 transition-colors duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
          </button>
          <button className="text-slate-400 hover:text-amber-600 transition-colors duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
          </button>
        </div>

      </main>

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
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out both;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out;
        }
        
        .animate-rotate-slow {
          animation: rotateSlow 20s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
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
        
        /* Custom breakpoint for xs */
        @media (min-width: 475px) {
          .xs\:grid-cols-5 {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default QuizResultsPage;