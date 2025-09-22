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

  const { score, totalQuestions, answers, timeSpent, config } = results;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const unansweredCount = (answers || []).filter(a => a && a.unanswered).length;
  const incorrectCount = totalQuestions - score - unansweredCount;

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
                <div className="mb-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-sm text-slate-600 mb-1">Your answer:</p>
                    <p className="text-slate-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: userAnswerSentence }} />
                </div>
                {correctAnswerSentence && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 mb-1">Correct answer:</p>
                        <p className="text-green-900 leading-relaxed" dangerouslySetInnerHTML={{ __html: correctAnswerSentence }} />
                    </div>
                )}
            </div>
        );
    }

    // Short Answer
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-sm text-slate-600 mb-1">Your answer:</p>
            <p className="text-slate-800 font-medium">{textAnswer}</p>
        </div>
    );
  };

  const scoreBadge = getScoreBadge();

  const recommendedQuizzes = [
    { id: 'rec1', title: 'Review Incorrect Answers', reason: 'Focus on the questions you missed in this quiz.', difficulty: 'Custom', icon: '🎯' },
    { id: 'rec2', title: 'Related Topics Quiz', reason: 'Broaden your knowledge around this subject.', difficulty: 'Medium', icon: '📚' },
    { id: 'rec3', title: 'Challenge Mode', reason: 'Try a harder quiz on the same topic.', difficulty: 'Hard', icon: '🔥' }
  ];

  return (
    <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8 text-center">

          <div className="mb-6">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
              {percentage}%
            </div>
            <Badge variant={scoreBadge.variant} className="text-lg px-4 py-2">
              {scoreBadge.text}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-green-600">{score}</div>
              <div className="text-sm text-slate-600">Correct</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
              <div className="text-sm text-slate-600">Incorrect</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-slate-500">{unansweredCount}</div>
              <div className="text-sm text-slate-600">Unanswered</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-amber-600">{totalQuestions}</div>
              <div className="text-sm text-slate-600">Total</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => onNavigate('home', { openQuizSetup: true })} className="flex-1 max-w-xs">
              Take Another Quiz
            </Button>
            <Button onClick={() => onNavigate('home')} variant="secondary" className="flex-1 max-w-xs">
              Back to Home
            </Button>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Question Review</h2>
            <button
              onClick={() => setShowAllQuestions(!showAllQuestions)}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              {showAllQuestions ? 'Show Less' : 'Show All Questions'}
            </button>
          </div>

          <div className="space-y-4">
            {(answers || []).slice(0, showAllQuestions ? (answers || []).length : 3).map((answer, index) => {
              const question = results.quiz?.questions?.[index] || {
                id: `question_${index}`,
                question: `Question ${index + 1}`,
                options: [],
                explanation: 'Explanation not available',
                type: 'MCQ'
              };

              const isCorrect = answer?.isCorrect;
              const selectedOption = answer?.selectedOption;
              const isUnanswered = answer?.unanswered;

              return (
                <div key={`${question.id}_${index}`} className={`border-2 rounded-2xl p-6 transition-all ${isUnanswered ? 'border-slate-200 bg-slate-50/50' : isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>

                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${isUnanswered ? 'bg-slate-100 text-slate-700' : isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isUnanswered ? '?' : isCorrect ? '✓' : '✗'}
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

                  {isUnanswered ? (
                    <div className="ml-14 mb-4">
                        <div className="p-3 rounded-lg bg-slate-100 text-slate-600 font-medium text-center mb-2">
                            Not Answered
                        </div>
                        {question.type === 'MCQ' || question.type === 'True/False' ? (
                            <div className="space-y-2">
                                {(question.options || []).map((option, optionIndex) => {
                                    const isCorrectOption = option.isCorrect;
                                    return (
                                        <div key={optionIndex} className={`flex items-center space-x-3 p-3 rounded-lg ${isCorrectOption ? 'bg-green-50 border border-green-200' : 'bg-white border border-slate-200'}`}>
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${isCorrectOption ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {String.fromCharCode(65 + optionIndex)}
                                            </span>
                                            <span className="flex-1 text-slate-700">{option.text}</span>
                                            {isCorrectOption && <span className="text-sm font-medium text-green-600">Correct Answer</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                                <strong>Correct Answer:</strong> {question.explanation}
                            </div>
                        )}
                    </div>
                  ) : question.type === 'Short Answer' || question.type === 'Fill in Blank' ? (
                    <div className="ml-14 mb-4">
                      {renderSubjectiveAnswer(question, answer)}
                      {answer?.aiEvaluated && !Array.isArray(answer?.textAnswer) && (
                        <div className="mt-2 text-xs text-purple-600">
                          ✨ Evaluated by AI
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="ml-14 space-y-2 mb-4">
                      {(question.options || []).map((option, optionIndex) => {
                        const isSelected = selectedOption === optionIndex;
                        const isCorrectOption = option.isCorrect;

                        return (
                          <div key={optionIndex} className={`flex items-center space-x-3 p-3 rounded-lg ${isSelected && isCorrectOption ? 'bg-green-100 border border-green-300' : isSelected && !isCorrectOption ? 'bg-red-100 border border-red-300' : !isSelected && isCorrectOption ? 'bg-green-50 border border-green-200' : 'bg-white border border-slate-200'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${isSelected && isCorrectOption ? 'bg-green-200 text-green-800' : isSelected && !isCorrectOption ? 'bg-red-200 text-red-800' : !isSelected && isCorrectOption ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span className="flex-1 text-slate-700">{option.text}</span>
                            {isSelected && <span className="text-sm font-medium text-slate-600">Your Answer</span>}
                            {!isSelected && isCorrectOption && <span className="text-sm font-medium text-green-600">Correct</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!showAllQuestions && (answers || []).length > 3 && (
            <div className="text-center mt-6">
              <Button onClick={() => setShowAllQuestions(true)} variant="ghost">
                Show {(answers || []).length - 3} More Questions
              </Button>
            </div>
          )}
        </div>

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

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 mt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">What's Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedQuizzes.map((quiz) => (
              <div key={quiz.id} className="bg-slate-50 rounded-2xl p-5 flex flex-col transition-transform hover:scale-105 hover:shadow-md">
                <div className="flex-grow">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4">
                        <span className="text-2xl">{quiz.icon}</span>
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-1">{quiz.title}</h4>
                    <p className="text-sm text-slate-600 mb-3">{quiz.reason}</p>
                </div>
                <div className="flex items-center justify-between">
                    <Badge variant={
                        quiz.difficulty === 'Hard' ? 'danger' :
                        quiz.difficulty === 'Medium' ? 'warning' : 'default'
                    }>{quiz.difficulty}</Badge>
                    <Button size="sm" variant="secondary" onClick={() => onNavigate('home', { openQuizSetup: true })}>
                        Start
                    </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};

export default QuizResultsPage;