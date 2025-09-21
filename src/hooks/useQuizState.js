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

  // Initialize quiz when config is provided
  useEffect(() => {
    if (quizConfig) {
      initializeQuiz(quizConfig);
    }
  }, [quizConfig]);

  // Effect to manage state when question changes
  useEffect(() => {
    const existingAnswer = userAnswers[currentQuestionIndex];
    
    if (existingAnswer) {
      setSelectedAnswer({
        optionIndex: existingAnswer.selectedOption,
        isCorrect: existingAnswer.isCorrect,
        textAnswer: existingAnswer.textAnswer, // For short answer etc.
      });
      
      // Only show feedback if the setting is on
      if (config.immediateFeedback) {
        setShowFeedback(true);
      } else {
        setShowFeedback(false);
      }
    } else {
      // No existing answer, so reset
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }, [currentQuestionIndex]); // Runs only when the user navigates

  const initializeQuiz = async (config) => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate new quiz via API
      const response = await examBuddyAPI.generateQuiz(config);

      if (response.success) {
        const newQuiz = response.data;
        setQuiz(newQuiz);
        setConfig({ ...config, ...newQuiz.config });
        setTimeRemaining(newQuiz.timeLimit || config.totalTimer || 600);
        setQuestionTimeRemaining(config.questionTimer || 60);
        setIsQuizActive(true);
        quizIdRef.current = newQuiz.id;

        console.log('=== QUIZ INITIALIZED ===');
        console.log('Quiz ID:', newQuiz.id);
        console.log('Config:', config);
        console.log('Questions:', newQuiz.questions.length);
        console.log('=======================');
      } else {
        setError(response.error || 'Failed to generate quiz');
      }
    } catch (err) {
      setError('Network error: Could not generate quiz');
      console.error('Quiz initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing quiz (for resumed quizzes)
  const loadExistingQuiz = async (quizId) => {
    try {
      setIsLoading(true);
      const response = await examBuddyAPI.getActiveQuiz(quizId);

      if (response.success) {
        const existingQuiz = response.data;
        setQuiz(existingQuiz);
        setIsQuizActive(true);
        quizIdRef.current = quizId;
        // Restore progress from API
      } else {
        setError('Could not load quiz');
      }
    } catch (err) {
      setError('Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  // Timer effects (same as before)
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

  // Question timer effect
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
          // Auto-select random answer when time runs out
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

  // Reset question timer when moving to new question
  useEffect(() => {
    if (config.timerEnabled) {
      setQuestionTimeRemaining(config.questionTimer);
    }
  }, [currentQuestionIndex, config.questionTimer, config.timerEnabled]);

  // Computed values
  const currentQuestion = quiz?.questions?.[currentQuestionIndex] || null;
  const isLastQuestion = currentQuestionIndex === (quiz?.questions?.length - 1) || false;
  const currentQuestionNumber = currentQuestionIndex + 1;

  // Actions with API integration
  // In the selectAnswer function, update this part:
  const selectAnswer = async (optionIndex, isCorrect, autoSelected = false) => {
    if (selectedAnswer && !autoSelected) return;

    try {
      const answer = {
        questionId: currentQuestion.id,
        questionType: currentQuestion.type || 'MCQ',
        selectedOption: optionIndex,
        isCorrect,
        timeSpent: (config.questionTimer || 60) - questionTimeRemaining,
        totalTimeWhenAnswered: timeRemaining,
        autoSelected
      };

      setSelectedAnswer({ optionIndex, isCorrect });

      // For MCQ/True-False: Instant validation (no API call needed)
      if (currentQuestion.type === 'MCQ' || currentQuestion.type === 'True/False') {
        // Show feedback based on current config setting
        if (config.immediateFeedback) {
          setShowFeedback(true);
        }

        // Update answers array
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = {
          ...answer,
          feedback: {
            message: isCorrect ? "Correct!" : "Not quite right.",
            explanation: currentQuestion.explanation
          }
        };
        setUserAnswers(newAnswers);

        console.log('=== ANSWER SUBMITTED (INSTANT) ===');
        console.log('Answer:', answer);
        console.log('No AI call needed for', currentQuestion.type);
        console.log('================================');

        return;
      }

      // For subjective questions: Call AI for evaluation
      const response = await examBuddyAPI.submitAnswer(
        quizIdRef.current,
        currentQuestion.id,
        answer
      );

      if (response.success) {
        // Show feedback based on config
        if (config.immediateFeedback) {
          setShowFeedback(true);
        }

        // Update answers array
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = {
          ...answer,
          feedback: response.data.feedback,
          explanation: response.data.explanation,
          aiEvaluated: true
        };
        setUserAnswers(newAnswers);
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

      console.log('=== QUIZ PAUSED ===');
      console.log('Quiz saved to backend');
      console.log('==================');
    } catch (err) {
      console.error('Error pausing quiz:', err);
      setError('Failed to save quiz progress');
    }
  };

  const resumeQuiz = () => {
    setIsPaused(false);
    setIsQuizActive(true);
    console.log('=== QUIZ RESUMED ===');
  };

  const stopQuiz = async () => {
    try {
      setIsQuizActive(false);
      setIsPaused(false);

      // Submit final answers to API
      const response = await examBuddyAPI.completeQuiz(quizIdRef.current, userAnswers);

      if (response.success) {
        console.log('=== QUIZ COMPLETED ===');
        console.log('Results:', response.data);
        console.log('======================');

        return {
          ...response.data,
          quiz: quiz // Include quiz data for results page
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

  // Fix the toggleImmediateFeedback function:
  const toggleImmediateFeedback = () => {
    const newSetting = !config.immediateFeedback;
    setConfig(prev => ({ ...prev, immediateFeedback: newSetting }));

    // If turning off feedback, hide current feedback
    if (!newSetting) {
      setShowFeedback(false);
    } else if (selectedAnswer) {
      // If turning on feedback and an answer is selected, show it
      setShowFeedback(true);
    }

    console.log('=== FEEDBACK SETTING CHANGED ===');
    console.log('Immediate Feedback:', newSetting ? 'ON' : 'OFF');
    console.log('=================================');
  };

  const getProgress = () => {
    if (!quiz?.questions) return 0;
    return ((currentQuestionIndex + (selectedAnswer ? 1 : 0)) / quiz.questions.length) * 100;
  };

  return {
    // State
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

    // Computed
    progress: getProgress(),
    isBookmarked: currentQuestion ? bookmarkedQuestions.has(currentQuestion.id) : false,

    // Actions
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

    // Error handling
    clearError: () => setError(null)
  };
};

export default useQuizState;