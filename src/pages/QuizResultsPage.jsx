import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const QuizResultsPage = ({ results, onNavigate }) => {
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center">
        <p>No results available</p>
      </div>
    );
  }

  const { score, totalQuestions, userAnswers, timeSpent, config } = results;
  const percentage = Math.round((score / totalQuestions) * 100);

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBadge = () => {
    if (percentage >= 80) return { text: 'Excellent! 🎉', variant: 'success' };
    if (percentage >= 60) return { text: 'Good Job! 👏', variant: 'warning' };
    return { text: 'Keep Practicing! 💪', variant: 'danger' };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const scoreBadge = getScoreBadge();

  return (
    <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">EB</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-800">Quiz Results</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Results Summary Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8 text-center">

          {/* Score Display */}
          <div className="mb-6">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
              {percentage}%
            </div>
            <Badge variant={scoreBadge.variant} className="text-lg px-4 py-2">
              {scoreBadge.text}
            </Badge>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-green-600">{score}</div>
              <div className="text-sm text-slate-600">Correct</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-600">{totalQuestions - score}</div>
              <div className="text-sm text-slate-600">Incorrect</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-600">{totalQuestions}</div>
              <div className="text-sm text-slate-600">Total Questions</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-600">{formatTime(timeSpent)}</div>
              <div className="text-sm text-slate-600">Time Taken</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => onNavigate('quiz')} className="flex-1 max-w-xs">
              Take Another Quiz
            </Button>
            <Button onClick={() => onNavigate('home')} variant="secondary" className="flex-1 max-w-xs">
              Back to Home
            </Button>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">

          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Question Review</h2>
            <button
              onClick={() => setShowAllQuestions(!showAllQuestions)}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              {showAllQuestions ? 'Show Less' : 'Show All Questions'}
            </button>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {/* Add safety check for userAnswers */}
            {(userAnswers || []).slice(0, showAllQuestions ? (userAnswers || []).length : 3).map((answer, index) => {
              const question = results.quiz?.questions?.[index] || {
                id: `question_${index}`,
                question: `Question ${index + 1}`,
                options: [
                  { text: 'Option A', isCorrect: false },
                  { text: 'Option B', isCorrect: true },
                  { text: 'Option C', isCorrect: false },
                  { text: 'Option D', isCorrect: false }
                ],
                explanation: 'Explanation not available',
                type: 'MCQ'
              };

              const isCorrect = answer?.isCorrect;
              const selectedOption = answer?.selectedOption;

              return (
                <div key={`${question.id}_${index}`} className={`border-2 rounded-2xl p-6 transition-all ${isCorrect
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-red-200 bg-red-50/50'
                  }`}>

                  {/* Question Header */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${isCorrect
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                      {isCorrect ? '✓' : '✗'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 mb-2">
                        Question {index + 1}
                        <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {question.type || 'MCQ'}
                        </span>
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        {question.question}
                      </p>
                    </div>
                  </div>

                  {/* Answer Display Based on Question Type */}
                  {question.type === 'Short Answer' || question.type === 'Fill in Blank' ? (
                    // Subjective answer display
                    <div className="ml-14 mb-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <p className="text-sm text-slate-600 mb-1">Your answer:</p>
                        <p className="text-slate-800 font-medium">{answer?.textAnswer || 'No answer provided'}</p>
                      </div>
                      {answer?.aiEvaluated && (
                        <div className="mt-2 text-xs text-purple-600">
                          ✨ Evaluated by AI
                        </div>
                      )}
                    </div>
                  ) : (
                    // MCQ answer display
                    <div className="ml-14 space-y-2 mb-4">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = selectedOption === optionIndex;
                        const isCorrectOption = option.isCorrect;

                        return (
                          <div key={optionIndex} className={`flex items-center space-x-3 p-3 rounded-lg ${isSelected && isCorrectOption ? 'bg-green-100 border border-green-300' :
                              isSelected && !isCorrectOption ? 'bg-red-100 border border-red-300' :
                                !isSelected && isCorrectOption ? 'bg-green-50 border border-green-200' :
                                  'bg-white border border-slate-200'
                            }`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${isSelected && isCorrectOption ? 'bg-green-200 text-green-800' :
                                isSelected && !isCorrectOption ? 'bg-red-200 text-red-800' :
                                  !isSelected && isCorrectOption ? 'bg-green-100 text-green-700' :
                                    'bg-slate-100 text-slate-600'
                              }`}>
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span className="flex-1 text-slate-700">{option.text}</span>
                            {isSelected && (
                              <span className="text-sm font-medium text-slate-600">Your Answer</span>
                            )}
                            {!isSelected && isCorrectOption && (
                              <span className="text-sm font-medium text-green-600">Correct</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Rest of the question display... */}
                </div>
              );
            })}
          </div>

          {/* Fix the Show More Button */}
          {!showAllQuestions && (userAnswers || []).length > 3 && (
            <div className="text-center mt-6">
              <Button
                onClick={() => setShowAllQuestions(true)}
                variant="ghost"
              >
                Show {(userAnswers || []).length - 3} More Questions
              </Button>
            </div>
          )}


          {/* Show More Button */}
          {!showAllQuestions && userAnswers.length > 3 && (
            <div className="text-center mt-6">
              <Button
                onClick={() => setShowAllQuestions(true)}
                variant="ghost"
              >
                Show {userAnswers.length - 3} More Questions
              </Button>
            </div>
          )}
        </div>

        {/* Performance Insights */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 mt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Performance Insights</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Strengths</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Strong performance on multiple choice questions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Good time management throughout the quiz</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Areas for Improvement</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  <span>Review concepts from questions 3 and 7</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  <span>Practice similar topics to reinforce learning</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default QuizResultsPage;
