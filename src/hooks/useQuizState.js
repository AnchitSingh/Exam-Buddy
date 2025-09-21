import { useState, useEffect, useRef } from 'react';
import examBuddyAPI from '../services/api';

const useQuizState = (quizConfig = null) => {
  const [quiz, setQuiz] = useState(null);
  const [config, setConfig] = useState(quizConfig || {
    immediateFeedback: true,
    timerEnabled: true,
    totalTimer: 600,
    questionTimer: 60
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(config.totalTimer || 600);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(config.questionTimer || 60);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(new Set());
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const timerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const quizIdRef = useRef(null);

  useEffect(() => {
    if (quizConfig) {
      initializeQuiz(quizConfig);
    }
  }, [quizConfig]);

  useEffect(() => {
    const existingAnswer = userAnswers[currentQuestionIndex];
    
    if (existingAnswer) {
      setSelectedAnswer({
        optionIndex: existingAnswer.selectedOption,
        isCorrect: existingAnswer.isCorrect,
        textAnswer: existingAnswer.textAnswer,
      });
      
      if (config.immediateFeedback) {
        setShowFeedback(true);
      } else {
        setShowFeedback(false);
      }
    } else {
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }, [currentQuestionIndex]);

  const initializeQuiz = async (config) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await examBuddyAPI.generateQuiz(config);

      if (response.success) {
        const newQuiz = response.data;
        setQuiz(newQuiz);
        setConfig({ ...config, ...newQuiz.config });
        setTimeRemaining(newQuiz.timeLimit || config.totalTimer || 600);
        setQuestionTimeRemaining(config.questionTimer || 60);
        setIsQuizActive(true);
        quizIdRef.current = newQuiz.id;
      } else {
        setError(response.error || 'Failed to generate quiz');
      }
    } catch (err) {
      setError('Network error: Could not generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingQuiz = async (quizId) => {
    try {
      setIsLoading(true);
      const response = await examBuddyAPI.getActiveQuiz(quizId);

      if (response.success) {
        const existingQuiz = response.data;
        setQuiz(existingQuiz);
        setIsQuizActive(true);
        quizIdRef.current = quizId;
      } else {
        setError('Could not load quiz');
      }
    } catch (err) {
      setError('Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isQuizActive || !config.timerEnabled || isPaused || timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsQuizActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isQuizActive, config.timerEnabled, isPaused, timeRemaining]);

  useEffect(() => {
    if (!isQuizActive || !config.timerEnabled || isPaused || questionTimeRemaining <= 0 || selectedAnswer) {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      return;
    }

    questionTimerRef.current = setInterval(() => {
      setQuestionTimeRemaining(prev => {
        if (prev <= 1) {
          if (currentQuestion) {
            const randomIndex = Math.floor(Math.random() * currentQuestion.options.length);
            selectAnswer(randomIndex, currentQuestion.options[randomIndex].isCorrect, true);
          }
          return config.questionTimer;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
    };
  }, [isQuizActive, config.timerEnabled, isPaused, questionTimeRemaining, selectedAnswer]);

  useEffect(() => {
    if (config.timerEnabled) {
      setQuestionTimeRemaining(config.questionTimer);
    }
  }, [currentQuestionIndex, config.questionTimer, config.timerEnabled]);

  const currentQuestion = quiz?.questions?.[currentQuestionIndex] || null;
  const isLastQuestion = currentQuestionIndex === (quiz?.questions?.length - 1) || false;
  const currentQuestionNumber = currentQuestionIndex + 1;

  const selectAnswer = async (optionIndex, isCorrect, autoSelected = false, textAnswer = null) => {
    try {
      const answer = {
        questionId: currentQuestion.id,
        questionType: currentQuestion.type || 'MCQ',
        selectedOption: optionIndex,
        isCorrect,
        timeSpent: (config.questionTimer || 60) - questionTimeRemaining,
        totalTimeWhenAnswered: timeRemaining,
        autoSelected,
        textAnswer,
      };

      setSelectedAnswer({ optionIndex, isCorrect, textAnswer });

      if (currentQuestion.type === 'MCQ' || currentQuestion.type === 'True/False') {
        if (config.immediateFeedback) {
          setShowFeedback(true);
        }
        setUserAnswers(currentAnswers => {
            const newAnswers = [...currentAnswers];
            newAnswers[currentQuestionIndex] = {
              ...answer,
              feedback: {
                message: isCorrect ? "Correct!" : "Not quite right.",
                explanation: currentQuestion.explanation
              }
            };
            return newAnswers;
        });
        return;
      }

      const response = await examBuddyAPI.submitAnswer(
        quizIdRef.current,
        currentQuestion.id,
        answer
      );

      if (response.success) {
        if (config.immediateFeedback) {
          setShowFeedback(true);
        }
        setUserAnswers(currentAnswers => {
            const newAnswers = [...currentAnswers];
            newAnswers[currentQuestionIndex] = {
              ...answer,
              feedback: response.data.feedback,
              explanation: response.data.explanation,
              aiEvaluated: true
            };
            return newAnswers;
        });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer');
    }
  };

  const nextQuestion = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const toggleBookmark = async () => {
    if (!currentQuestion) return;

    try {
      const questionId = currentQuestion.id;
      const isCurrentlyBookmarked = bookmarkedQuestions.has(questionId);

      if (isCurrentlyBookmarked) {
        await examBuddyAPI.removeBookmark(questionId);
        setBookmarkedQuestions(prev => {
          const newSet = new Set(prev);
          newSet.delete(questionId);
          return newSet;
        });
      } else {
        await examBuddyAPI.addBookmark(questionId, {
          question: currentQuestion.question,
          options: currentQuestion.options,
          correctAnswer: currentQuestion.options.findIndex(opt => opt.isCorrect),
          explanation: currentQuestion.explanation,
          subject: currentQuestion.subject,
          difficulty: currentQuestion.difficulty,
          quizTitle: quiz?.title
        });
        setBookmarkedQuestions(prev => new Set(prev).add(questionId));
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setError('Failed to update bookmark');
    }
  };

  const pauseQuiz = async () => {
    try {
      setIsPaused(true);
      setIsQuizActive(false);

      const quizState = {
        quizId: quizIdRef.current,
        currentQuestionIndex,
        userAnswers,
        timeRemaining,
        questionTimeRemaining,
        bookmarkedQuestions: Array.from(bookmarkedQuestions),
        config,
        pausedAt: new Date().toISOString()
      };

      await examBuddyAPI.saveQuizProgress(quizIdRef.current, quizState);
    } catch (err) {
      console.error('Error pausing quiz:', err);
      setError('Failed to save quiz progress');
    }
  };

  const resumeQuiz = () => {
    setIsPaused(false);
    setIsQuizActive(true);
  };

  const stopQuiz = async () => {
    try {
      setIsQuizActive(false);
      setIsPaused(false);

      const response = await examBuddyAPI.completeQuiz(quizIdRef.current, userAnswers);

      if (response.success) {
        return {
          ...response.data,
          quiz: quiz
        };
      } else {
        throw new Error('Failed to complete quiz');
      }
    } catch (err) {
      console.error('Error completing quiz:', err);
      setError('Failed to complete quiz');
      return null;
    }
  };

  const toggleImmediateFeedback = () => {
    const newSetting = !config.immediateFeedback;
    setConfig(prev => ({ ...prev, immediateFeedback: newSetting }));

    if (!newSetting) {
      setShowFeedback(false);
    } else if (selectedAnswer) {
      setShowFeedback(true);
    }
  };

  const getProgress = () => {
    if (!quiz?.questions) return 0;
    return ((currentQuestionIndex + (selectedAnswer ? 1 : 0)) / quiz.questions.length) * 100;
  };

  return {
    quiz,
    config,
    currentQuestion,
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
    bookmarkedQuestions,
    isLastQuestion,
    progress: getProgress(),
    isBookmarked: currentQuestion ? bookmarkedQuestions.has(currentQuestion.id) : false,
    initializeQuiz,
    loadExistingQuiz,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    toggleBookmark,
    pauseQuiz,
    resumeQuiz,
    stopQuiz,
    toggleImmediateFeedback,
    clearError: () => setError(null)
  };
};

export default useQuizState;