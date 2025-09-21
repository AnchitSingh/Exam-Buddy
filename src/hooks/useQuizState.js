import { useState, useEffect, useRef, useCallback } from 'react';
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
  const pendingApiCallRef = useRef(null); // Add ref to track pending API calls

  // Load bookmarks on initial load
  useEffect(() => {
    const loadBookmarks = async () => {
      const response = await examBuddyAPI.getBookmarks();
      if (response.success) {
        setBookmarkedQuestions(new Set(response.data.map(b => b.questionId)));
      }
    };
    loadBookmarks();
  }, []);

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

      let response;
      if (config.questions && config.questions.length > 0) {
        // This is a practice quiz from bookmarks
        response = {
          success: true,
          data: {
            id: `practice_${Date.now()}`,
            title: config.title || 'Practice Quiz',
            subject: config.subject || 'Mixed',
            totalQuestions: config.questions.length,
            config: { ...config, immediateFeedback: true, timerEnabled: false },
            questions: config.questions,
            createdAt: new Date().toISOString(),
            timeLimit: null,
          }
        };
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
      } else {
        // Generate a new quiz
        response = await examBuddyAPI.generateQuiz(config);
      }

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

  // ... timer useEffects remain the same ...

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

  // FIXED selectAnswer function
  const selectAnswer = useCallback(async (optionIndex, isCorrect, autoSelected = false, textAnswer = null) => {
    try {
      // Cancel any pending API call for text questions
      if (pendingApiCallRef.current) {
        pendingApiCallRef.current.cancel = true;
      }

      const currentQIndex = currentQuestionIndex; // Capture current index
      const currentQ = currentQuestion; // Capture current question
      
      if (!currentQ) return;

      const answer = {
        questionId: currentQ.id,
        questionType: currentQ.type || 'MCQ',
        selectedOption: optionIndex,
        isCorrect,
        timeSpent: (config.questionTimer || 60) - questionTimeRemaining,
        totalTimeWhenAnswered: timeRemaining,
        autoSelected,
        textAnswer,
      };

      console.log('Saving answer at index:', currentQIndex, 'Answer:', textAnswer);

      setSelectedAnswer({ optionIndex, isCorrect, textAnswer });

      // For MCQ and True/False, handle immediately without API call
      if (currentQ.type === 'MCQ' || currentQ.type === 'True/False') {
        if (config.immediateFeedback) {
          setShowFeedback(true);
        }
        
        setUserAnswers(currentAnswers => {
          const newAnswers = [...currentAnswers];
          newAnswers[currentQIndex] = {
            ...answer,
            feedback: {
              message: isCorrect ? "Correct!" : "Not quite right.",
              explanation: currentQ.explanation
            }
          };
          return newAnswers;
        });
        return;
      }

      // For text-based questions, update local state immediately
      setUserAnswers(currentAnswers => {
        const newAnswers = [...currentAnswers];
        newAnswers[currentQIndex] = {
          ...answer,
          aiEvaluated: false,
          isPending: true
        };
        console.log('Updated userAnswers at index:', currentQIndex, 'with:', answer);
        return newAnswers;
      });

      // Then make API call for evaluation (if needed)
      if (config.immediateFeedback || currentQ.type === 'Fill in Blank') {
        const apiCall = { cancel: false };
        pendingApiCallRef.current = apiCall;

        const response = await examBuddyAPI.submitAnswer(
          quizIdRef.current,
          currentQ.id,
          answer
        );

        // Check if this call was cancelled
        if (apiCall.cancel) {
          console.log('API call was cancelled, ignoring response');
          return;
        }

        if (response.success) {
          if (config.immediateFeedback) {
            setShowFeedback(true);
          }
          
          // Update with API response
          setUserAnswers(currentAnswers => {
            const newAnswers = [...currentAnswers];
            // Make sure we're updating the right index
            if (newAnswers[currentQIndex]?.questionId === currentQ.id) {
              newAnswers[currentQIndex] = {
                ...newAnswers[currentQIndex],
                ...answer, // Ensure the latest textAnswer is preserved
                feedback: response.data.feedback,
                explanation: response.data.explanation,
                aiEvaluated: true,
                isPending: false
              };
            }
            return newAnswers;
          });
        }
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer');
      
      // Even on error, make sure we save the answer locally
      setUserAnswers(currentAnswers => {
        const newAnswers = [...currentAnswers];
        newAnswers[currentQuestionIndex] = {
          questionId: currentQuestion.id,
          questionType: currentQuestion.type || 'MCQ',
          selectedOption: optionIndex,
          isCorrect,
          timeSpent: (config.questionTimer || 60) - questionTimeRemaining,
          totalTimeWhenAnswered: timeRemaining,
          autoSelected,
          textAnswer,
          error: true,
          isPending: false
        };
        return newAnswers;
      });
    }
  }, [currentQuestionIndex, currentQuestion, config, questionTimeRemaining, timeRemaining, quizIdRef.current]);

  const nextQuestion = () => {
    if (!isLastQuestion) {
      setShowFeedback(false);
      setSelectedAnswer(null);
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
        const options = currentQuestion.options || [];
        await examBuddyAPI.addBookmark(questionId, {
          question: currentQuestion.question,
          options: options,
          type: currentQuestion.type,
          correctAnswer: options.findIndex(opt => opt.isCorrect),
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

  const stopQuiz = async (finalAnswers) => {
    try {
      setIsQuizActive(false);
      setIsPaused(false);

      const response = await examBuddyAPI.completeQuiz(quizIdRef.current, finalAnswers);

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