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
  const abortControllerRef = useRef(null);
  const currentQuestionIndexRef = useRef(0);

  // Keep currentQuestionIndexRef in sync
  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Load bookmarks on initial load
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const response = await examBuddyAPI.getBookmarks();
        if (response.success) {
          setBookmarkedQuestions(new Set(response.data.map(b => b.questionId)));
        }
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
      }
    };
    loadBookmarks();
  }, []);

  // Initialize quiz when config changes
  useEffect(() => {
    if (quizConfig) {
      if (quizConfig.quizId) {
        loadExistingQuiz(quizConfig.quizId);
      } else if (quizConfig.questions || quizConfig.topic) {
        initializeQuiz(quizConfig);
      }
    }
  }, [quizConfig]);

  // Handle existing answers when question changes
  useEffect(() => {
    // Add small debounce to prevent race conditions
    const timer = setTimeout(() => {
      const existingAnswer = userAnswers[currentQuestionIndex];
      
      if (existingAnswer) {
        setSelectedAnswer({
          optionIndex: existingAnswer.selectedOption,
          isCorrect: existingAnswer.isCorrect,
          textAnswer: existingAnswer.textAnswer,
        });
        
        if (config.immediateFeedback && !existingAnswer.isPending) {
          setShowFeedback(true);
        } else {
          setShowFeedback(false);
        }
      } else {
        setSelectedAnswer(null);
        setShowFeedback(false);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [currentQuestionIndex, userAnswers, config.immediateFeedback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

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
        const savedState = response.data;
        
        setQuiz({
            id: savedState.id,
            title: savedState.title,
            subject: savedState.subject,
            questions: savedState.questions,
            totalQuestions: savedState.totalQuestions,
        });
        setConfig(savedState.config);
        setCurrentQuestionIndex(savedState.currentQuestionIndex);
        setUserAnswers(savedState.userAnswers);
        setTimeRemaining(savedState.timeRemaining);
        setQuestionTimeRemaining(savedState.questionTimeRemaining);
        setBookmarkedQuestions(new Set(savedState.bookmarkedQuestions));
        
        setIsPaused(false);
        setIsQuizActive(true);
        quizIdRef.current = quizId;

        await examBuddyAPI.removePausedQuiz(quizId);

      } else {
        setError('Could not load quiz');
      }
    } catch (err) {
      setError('Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  // Fixed: Timer useEffect without timeRemaining dependency
  useEffect(() => {
    if (!isQuizActive || !config.timerEnabled || isPaused) {
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
  }, [isQuizActive, config.timerEnabled, isPaused]);

  // Fixed: Question timer useEffect
  useEffect(() => {
    // Check if we should have a question timer
    const shouldHaveTimer = isQuizActive && 
                           config.timerEnabled && 
                           !isPaused && 
                           !selectedAnswer;

    if (!shouldHaveTimer) {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      return;
    }

    questionTimerRef.current = setInterval(() => {
      setQuestionTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-select an answer when time runs out
          const currentQ = quiz?.questions?.[currentQuestionIndexRef.current];
          if (currentQ && currentQ.options) {
            const randomIndex = Math.floor(Math.random() * currentQ.options.length);
            selectAnswer(randomIndex, currentQ.options[randomIndex].isCorrect, true);
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
  }, [isQuizActive, config.timerEnabled, isPaused, selectedAnswer]);

  // Reset question timer when question changes
  useEffect(() => {
    if (config.timerEnabled) {
      setQuestionTimeRemaining(config.questionTimer);
    }
  }, [currentQuestionIndex, config.questionTimer, config.timerEnabled]);

  const currentQuestion = quiz?.questions?.[currentQuestionIndex] || null;
  const isLastQuestion = currentQuestionIndex === (quiz?.questions?.length - 1) || false;
  const currentQuestionNumber = currentQuestionIndex + 1;

  // Fixed: selectAnswer with proper abort controller and error handling
  const selectAnswer = useCallback(async (optionIndex, isCorrect, autoSelected = false, textAnswer = null) => {
    try {
      // Cancel any pending API call
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const currentQIndex = currentQuestionIndexRef.current;
      const currentQ = quiz?.questions?.[currentQIndex];
      
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
        abortControllerRef.current = new AbortController();
        
        try {
          const response = await examBuddyAPI.submitAnswer(
            quizIdRef.current,
            currentQ.id,
            answer,
            { signal: abortControllerRef.current.signal }
          );

          // Only process response if we're still on the same question
          if (currentQuestionIndexRef.current === currentQIndex && response.success) {
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
        } catch (err) {
          // Check if error is from abort
          if (err.name === 'AbortError') {
            console.log('API call was aborted');
            return;
          }
          
          console.error('Error submitting answer:', err);
          
          // Update answer state to show error
          setUserAnswers(currentAnswers => {
            const newAnswers = [...currentAnswers];
            if (newAnswers[currentQIndex]?.questionId === currentQ.id) {
              newAnswers[currentQIndex] = {
                ...newAnswers[currentQIndex],
                error: true,
                isPending: false
              };
            }
            return newAnswers;
          });
        }
      }
    } catch (err) {
      console.error('Error in selectAnswer:', err);
      setError('Failed to submit answer');
    }
  }, [quiz, config, questionTimeRemaining, timeRemaining]);

  const nextQuestion = () => {
    if (!isLastQuestion) {
      // Cancel any pending API calls
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      setShowFeedback(false);
      setSelectedAnswer(null);
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Cancel any pending API calls
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      setShowFeedback(false);
      setSelectedAnswer(null);
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const toggleBookmark = async () => {
    if (!currentQuestion) return;

    try {
      const questionId = currentQuestion.id;
      const isCurrentlyBookmarked = bookmarkedQuestions.has(questionId);

      if (isCurrentlyBookmarked) {
        const response = await examBuddyAPI.removeBookmark(questionId);
        if (response.success) {
          setBookmarkedQuestions(prev => {
            const newSet = new Set(prev);
            newSet.delete(questionId);
            return newSet;
          });
        }
      } else {
        const options = currentQuestion.options || [];
        const response = await examBuddyAPI.addBookmark(questionId, {
          question: currentQuestion.question,
          options: options,
          type: currentQuestion.type,
          correctAnswer: options.findIndex(opt => opt.isCorrect),
          explanation: currentQuestion.explanation,
          subject: currentQuestion.subject,
          difficulty: currentQuestion.difficulty,
          quizTitle: quiz?.title
        });
        
        if (response.success) {
          setBookmarkedQuestions(prev => new Set(prev).add(questionId));
        }
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

      const score = {
        correct: userAnswers.filter(a => a && a.isCorrect).length,
        total: userAnswers.filter(Boolean).length
      };

      const quizState = {
        quizId: quizIdRef.current,
        id: quizIdRef.current,
        title: quiz.title,
        subject: quiz.subject,
        questions: quiz.questions,
        totalQuestions: quiz.questions.length,
        progress: Math.round(getProgress()),
        currentQuestion: currentQuestionIndex + 1,
        difficulty: config.difficulty,
        score: score,
        currentQuestionIndex,
        userAnswers,
        timeRemaining,
        questionTimeRemaining,
        bookmarkedQuestions: Array.from(bookmarkedQuestions),
        config,
        pausedAt: new Date().toISOString()
      };

      const response = await examBuddyAPI.saveQuizProgress(quizIdRef.current, quizState);
      if (!response.success) {
        throw new Error('Failed to save progress');
      }
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

      // Cancel any pending API calls
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const response = await examBuddyAPI.completeQuiz(
        quizIdRef.current, 
        finalAnswers || userAnswers,
        quiz
      );

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
    } else if (selectedAnswer && !userAnswers[currentQuestionIndex]?.isPending) {
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