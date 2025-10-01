import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import examBuddyAPI from '../services/api';

const useQuizState = (quizConfig = null, answerRef) => {
  const [quiz, setQuiz] = useState(null);
  const [config, setConfig] = useState(quizConfig || {
    immediateFeedback: true,
    timerEnabled: true,
    totalTimer: 600,
    questionTimer: 60
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(quizConfig?.timerEnabled ? (quizConfig.totalTimer || 600) : 0);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(new Set());
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [draftAnswers, setDraftAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState({ current: 0, total: 0 });

  const timerRef = useRef(null);
  const quizIdRef = useRef(null);
  const abortControllerRef = useRef(null);
  const currentQuestionIndexRef = useRef(0);
  const autoSaveTimerRef = useRef(null);
  const isMountedRef = useRef(true);
  const userAnswersRef = useRef([]);

  // Keep refs in sync
  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  // Load bookmarks on initial load
  useEffect(() => {
    let isMounted = true;
    
    const loadBookmarks = async () => {
      try {
        const response = await examBuddyAPI.getBookmarks();
        if (isMounted && response.success) {
          setBookmarkedQuestions(new Set(response.data.map(b => b.questionId)));
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load bookmarks:', err);
        }
      }
    };
    
    loadBookmarks();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize quiz when config changes
  useEffect(() => {
    if (quizConfig && !quiz) {
      // NEW: Handle pre-generated quiz data
      if (quizConfig.quizData) {
        const newQuiz = quizConfig.quizData;
        setQuiz(newQuiz);
        // Merge the original config with the new quiz config to preserve user settings
        setConfig(prevConfig => ({ ...prevConfig, ...newQuiz.config }));
        setTimeRemaining(newQuiz.timeLimit || newQuiz.config?.totalTimer || 600);
        setIsQuizActive(true);
        quizIdRef.current = newQuiz.id;
        setIsLoading(false); // Data is already here
        toast.success('Quiz ready!');
        return; // Done
      }

      if (quizConfig.quizId) {
        loadExistingQuiz(quizConfig.quizId);
      } else if (quizConfig.questions || quizConfig.topic) {
        // This path is still used for practice quizzes from bookmarks
        initializeQuiz(quizConfig);
      }
    }
  }, [quizConfig, quiz]);

  // Handle existing answers when question changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const existingAnswer = userAnswers[currentQuestionIndex];
      
      if (existingAnswer) {
        setSelectedAnswer({
          optionIndex: existingAnswer.selectedOption,
          isCorrect: existingAnswer.isCorrect,
          textAnswer: existingAnswer.textAnswer,
          aiEvaluated: existingAnswer.aiEvaluated
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
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  const initializeQuiz = async (config) => {
    // Validate config
    if (!config || (!config.questions && !config.topic)) {
      setError('Invalid quiz configuration');
      toast.error('Invalid quiz configuration');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let response;
      if (config.questions && config.questions.length > 0) {
        response = {
          success: true,
          data: {
            id: `practice_${Date.now()}`,
            title: config.title || 'Practice Quiz',
            subject: config.subject || 'Mixed',
            totalQuestions: config.questions.length,
            // Preserve original config settings instead of overriding
            config: { ...config },
            questions: config.questions,
            createdAt: new Date().toISOString(),
            timeLimit: null,
          }
        };
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        response = await examBuddyAPI.generateQuiz(config);
      }

      if (isMountedRef.current && response.success) {
        const newQuiz = response.data;
        setQuiz(newQuiz);
        // Merge the original config with the new quiz config to preserve user settings
        setConfig(prevConfig => ({ ...prevConfig, ...newQuiz.config }));
        setTimeRemaining(newQuiz.timeLimit || newQuiz.config?.totalTimer || quizConfig?.totalTimer || 600);
        setIsQuizActive(true);
        quizIdRef.current = newQuiz.id;
        toast.success('Quiz started successfully');
      } else if (isMountedRef.current) {
        setError(response.error || 'Failed to generate quiz');
        toast.error(response.error || 'Failed to generate quiz');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Network error: Could not generate quiz');
        toast.error('Network error: Could not generate quiz');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const loadExistingQuiz = async (quizId) => {
    try {
      setIsLoading(true);
      const response = await examBuddyAPI.getActiveQuiz(quizId);

      if (isMountedRef.current && response.success) {
        const savedState = response.data;
        
        setQuiz({
          id: savedState.id,
          title: savedState.title,
          subject: savedState.subject,
          questions: savedState.questions,
          totalQuestions: savedState.totalQuestions,
        });
        // Merge the saved config with quizConfig to preserve original settings
        setConfig(prevConfig => ({ ...prevConfig, ...savedState.config }));
        setCurrentQuestionIndex(savedState.currentQuestionIndex);
        setUserAnswers(savedState.userAnswers);
        setTimeRemaining(savedState.timeRemaining || savedState.config?.totalTimer || 600);
        setBookmarkedQuestions(new Set(savedState.bookmarkedQuestions));
        setDraftAnswers(savedState.draftAnswers || {});
        
        setIsPaused(false);
        setIsQuizActive(true);
        quizIdRef.current = quizId;

        await examBuddyAPI.removePausedQuiz(quizId);
        toast.success('Quiz loaded successfully');
      } else if (isMountedRef.current) {
        setError('Could not load quiz');
        toast.error('Could not load quiz');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Failed to load quiz');
        toast.error('Failed to load quiz');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Fixed stopQuiz with proper state management
  const stopQuiz = useCallback(async (finalAnswers = null) => {
    if (isSubmitting) return null;

    try {
      setIsSubmitting(true);
      setIsQuizActive(false);
      setIsPaused(false);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      let answersToSubmit = [...(finalAnswers || userAnswersRef.current)]; // Make a mutable copy

      // Find answers that need evaluation
      const answersToEvaluate = [];
      for (let i = 0; i < answersToSubmit.length; i++) {
        const answer = answersToSubmit[i];
        const question = quiz.questions[i];
        if (answer && !answer.aiEvaluated && (question.type === 'Short Answer' || question.type === 'Fill in Blank')) {
          answersToEvaluate.push({ index: i, answer, question });
        }
      }

      // If there are answers to evaluate, show loading screen and evaluate one by one
      if (answersToEvaluate.length > 0) {
        setIsEvaluating(true); // Trigger loading screen
        setEvaluationProgress({ current: 0, total: answersToEvaluate.length });

        for (const [index, item] of answersToEvaluate.entries()) {
          const { index: answerIndex, answer, question } = item;
          setEvaluationProgress({ current: index + 1, total: answersToEvaluate.length });
          try {
            const response = await examBuddyAPI.submitAnswer(quizIdRef.current, question.id, answer);
            if (response.success) {
              // Update the answer in our array
              answersToSubmit[answerIndex] = {
                ...answer,
                isCorrect: response.data.isCorrect,
                score: response.data.score,
                feedback: response.data.feedback,
                explanation: response.data.explanation,
                aiEvaluated: true,
                isPending: false,
              };
            }
          } catch (e) {
            console.error(`Failed to evaluate question ${answerIndex}`, e);
            // Keep the answer as is (incorrect)
          }
        }

        setIsEvaluating(false); // Hide loading screen
      }

      // Now answersToSubmit is fully evaluated
      const validAnswers = answersToSubmit.filter(answer => answer && !answer.isDraft);

      const response = await examBuddyAPI.completeQuiz(
        quizIdRef.current, 
        validAnswers,
        quiz
      );

      if (response.success) {
        return {
          ...response.data,
          quiz: quiz,
          config: config
        };
      } else {
        throw new Error('Failed to complete quiz');
      }
    } catch (err) {
      console.error('Error completing quiz:', err);
      if (isMountedRef.current) {
        setError('Failed to complete quiz');
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [quiz, config, isSubmitting, userAnswers]);

  // Fixed timer with proper auto-submission
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
          // Clear the interval immediately
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          // Auto-submit the quiz
          setTimeout(() => {
            if (!isMountedRef.current) return;
            
            // Prepare final answers including any unsaved text
            let finalAnswers = [...userAnswersRef.current];
            
            if (answerRef?.current) {
              const { textAnswer, fillBlanks } = answerRef.current;
              const currentQ = quiz?.questions?.[currentQuestionIndexRef.current];
              
              if (currentQ && !finalAnswers[currentQuestionIndexRef.current]) {
                if (currentQ.type === 'Short Answer' && textAnswer?.trim()) {
                  finalAnswers[currentQuestionIndexRef.current] = {
                    questionId: currentQ.id,
                    questionType: 'Short Answer',
                    selectedOption: 0,
                    isCorrect: false,
                    timeSpent: 30,
                    totalTimeWhenAnswered: 0,
                    textAnswer: textAnswer.trim(),
                    autoSelected: true,
                    isDraft: false
                  };
                } else if (currentQ.type === 'Fill in Blank' && fillBlanks?.some(b => b?.trim())) {
                  const isCorrect = currentQ.acceptableAnswers?.some(acceptableSet =>
                    acceptableSet.every((acceptable, index) =>
                      fillBlanks[index]?.toLowerCase().trim() === acceptable.toLowerCase()
                    )
                  ) || false;
                  
                  finalAnswers[currentQuestionIndexRef.current] = {
                    questionId: currentQ.id,
                    questionType: 'Fill in Blank',
                    selectedOption: 0,
                    isCorrect: isCorrect,
                    timeSpent: 30,
                    totalTimeWhenAnswered: 0,
                    textAnswer: fillBlanks,
                    autoSelected: true,
                    isDraft: false
                  };
                }
              }
            }
            
            // Submit the quiz
            stopQuiz(finalAnswers).then(results => {
              if (results) {
                toast.success('Time\'s up! Quiz submitted automatically.');
              }
            });
          }, 100);
          
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
  }, [isQuizActive, config.timerEnabled, isPaused, quiz, stopQuiz]);

  const currentQuestion = quiz?.questions?.[currentQuestionIndex] || null;
  const isLastQuestion = currentQuestionIndex === (quiz?.questions?.length - 1) || false;
  const currentQuestionNumber = currentQuestionIndex + 1;

  // Fixed saveDraftAnswer
  const saveDraftAnswer = useCallback(() => {
    if (!answerRef?.current) return;
    
    const { textAnswer, fillBlanks } = answerRef.current;
    const currentQ = quiz?.questions?.[currentQuestionIndexRef.current];
    
    if (!currentQ) return;

    // Only save drafts for text-based questions
    if (currentQ.type === 'Short Answer' && textAnswer?.trim()) {
      setDraftAnswers(prev => ({
        ...prev,
        [currentQuestionIndexRef.current]: {
          type: 'Short Answer',
          textAnswer: textAnswer.trim()
        }
      }));
    } else if (currentQ.type === 'Fill in Blank' && fillBlanks?.some(b => b?.trim())) {
      setDraftAnswers(prev => ({
        ...prev,
        [currentQuestionIndexRef.current]: {
          type: 'Fill in Blank',
          textAnswer: fillBlanks
        }
      }));
    }
  }, [quiz]);

  // Fixed selectAnswer with race condition protection
  const selectAnswer = useCallback(async (optionIndex, isCorrect, autoSelected = false, textAnswer = null, isDraft = false) => {
    try {
      const newController = new AbortController();
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = newController;

      const currentQIndex = currentQuestionIndexRef.current;
      const currentQ = quiz?.questions?.[currentQIndex];
      
      if (!currentQ) return;

      const actualTimeSpent = config.questionTimer ? (config.questionTimer - 30) : 30;

      const answer = {
        questionId: currentQ.id,
        questionType: currentQ.type || 'MCQ',
        selectedOption: optionIndex,
        isCorrect,
        timeSpent: actualTimeSpent,
        totalTimeWhenAnswered: timeRemaining,
        autoSelected,
        textAnswer,
        isDraft,
        isPending: false
      };

      console.log('Saving answer at index:', currentQIndex, 'Answer:', answer);

      // Remove from drafts if not a draft
      if (!isDraft && draftAnswers[currentQIndex]) {
        setDraftAnswers(prev => {
          const newDrafts = { ...prev };
          delete newDrafts[currentQIndex];
          return newDrafts;
        });
      }

      setSelectedAnswer({ optionIndex, isCorrect, textAnswer });

      // Update userAnswers immediately
      setUserAnswers(currentAnswers => {
        const newAnswers = [...currentAnswers];
        newAnswers[currentQIndex] = answer;
        return newAnswers;
      });

      // Show feedback for MCQ/True-False
      if ((currentQ.type === 'MCQ' || currentQ.type === 'True/False') && config.immediateFeedback) {
        setShowFeedback(true);
      }

      // Make API call for evaluation if needed and not a draft
      if (!isDraft && config.immediateFeedback && (currentQ.type === 'Short Answer' || currentQ.type === 'Fill in Blank')) {
        try {
          // Mark as pending
          setUserAnswers(currentAnswers => {
            const newAnswers = [...currentAnswers];
            if (newAnswers[currentQIndex]) {
              newAnswers[currentQIndex].isPending = true;
            }
            return newAnswers;
          });

          const response = await examBuddyAPI.submitAnswer(
            quizIdRef.current,
            currentQ.id,
            answer,
            { signal: newController.signal }
          );

          // Check if component is still mounted and index hasn't changed
          if (!isMountedRef.current || currentQuestionIndexRef.current !== currentQIndex) {
            return;
          }

          if (response.success) {
            setShowFeedback(true);
            
            setUserAnswers(currentAnswers => {
              const newAnswers = [...currentAnswers];
              if (newAnswers[currentQIndex]?.questionId === currentQ.id) {
                newAnswers[currentQIndex] = {
                  ...newAnswers[currentQIndex],
                  ...answer,
                  feedback: response.data.feedback,
                  explanation: response.data.explanation,
                  aiEvaluated: true,
                  isPending: false,
                  isDraft: false
                };
              }
              return newAnswers;
            });
          }
        } catch (err) {
          if (err.name === 'AbortError') {
            console.log('API call was aborted');
            return;
          }
          
          if (isMountedRef.current) {
            console.error('Error submitting answer:', err);
            // Remove pending status on error
            setUserAnswers(currentAnswers => {
              const newAnswers = [...currentAnswers];
              if (newAnswers[currentQIndex]) {
                newAnswers[currentQIndex].isPending = false;
              }
              return newAnswers;
            });
          }
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error in selectAnswer:', err);
        setError('Failed to submit answer');
      }
    }
  }, [quiz, config, timeRemaining, draftAnswers]);

  // Fixed saveCurrentAnswer with proper dependencies
  const saveCurrentAnswer = useCallback(() => {
    if (!answerRef?.current) return;
    
    const { textAnswer, fillBlanks } = answerRef.current;
    const currentQ = quiz?.questions?.[currentQuestionIndex];
    
    if (!currentQ) return;
    
    // Save text-based answers if they exist
    if (currentQ.type === 'Short Answer' && textAnswer?.trim()) {
      selectAnswer(0, false, false, textAnswer.trim(), false);
    } else if (currentQ.type === 'Fill in Blank' && fillBlanks?.some(b => b?.trim())) {
      const isCorrect = currentQ.acceptableAnswers?.some(acceptableSet =>
        acceptableSet.every((acceptable, index) =>
          fillBlanks[index]?.toLowerCase().trim() === acceptable.toLowerCase()
        )
      ) || false;
      selectAnswer(0, isCorrect, false, fillBlanks, false);
    }
  }, [quiz, currentQuestionIndex, selectAnswer]);

  const nextQuestion = useCallback(() => {
    if (!isLastQuestion) {
      saveCurrentAnswer(); // Save current answer before moving
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      if (config.immediateFeedback) {
        setShowFeedback(false);
      }
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [isLastQuestion, saveCurrentAnswer, config.immediateFeedback]);

  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      saveCurrentAnswer(); // Save current answer before moving
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      if (config.immediateFeedback) {
        setShowFeedback(false);
      }
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex, saveCurrentAnswer, config.immediateFeedback]);

  const goToQuestion = useCallback((questionIndex) => {
    if (questionIndex >= 0 && questionIndex < quiz?.totalQuestions && questionIndex !== currentQuestionIndex) {
      saveCurrentAnswer(); // Save current answer before jumping
      
      // Add a small delay to ensure save completes
      setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        
        setCurrentQuestionIndex(questionIndex);
      }, 50);
    }
  }, [quiz?.totalQuestions, currentQuestionIndex, saveCurrentAnswer]);

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
          toast.success('Question removed from bookmarks');
        } else {
          toast.error('Failed to remove bookmark');
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
          toast.success('Question bookmarked successfully');
        } else {
          toast.error('Failed to bookmark question');
        }
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      if (isMountedRef.current) {
        setError('Failed to update bookmark');
        toast.error('Failed to update bookmark');
      }
    }
  };

  const pauseQuiz = async () => {
    try {
      saveCurrentAnswer(); // Save current answer
      
      setIsPaused(true);
      setIsQuizActive(false);

      const score = {
        correct: userAnswers.filter(a => a && a.isCorrect && !a.isDraft && !a.isPending).length,
        total: userAnswers.filter(a => a && !a.isDraft && !a.isPending).length
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
        draftAnswers,
        timeRemaining,
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
      if (isMountedRef.current) {
        setError('Failed to save quiz progress');
      }
    }
  };

  const resumeQuiz = () => {
    setIsPaused(false);
    setIsQuizActive(true);
  };

  const toggleImmediateFeedback = () => {
    const newSetting = !config.immediateFeedback;
    setConfig(prev => ({ ...prev, immediateFeedback: newSetting }));

    if (!newSetting) {
      setShowFeedback(false);
      toast('Immediate feedback turned off');
    } else if (selectedAnswer && !userAnswers[currentQuestionIndex]?.isPending) {
      setShowFeedback(true);
      toast('Immediate feedback turned on');
    }
  };

  // Fixed progress calculation
  const getProgress = () => {
    if (!quiz?.questions) return 0;
    const answeredCount = userAnswers.filter(answer => 
      answer != null && !answer.isDraft && !answer.isPending
    ).length;
    return Math.min(100, (answeredCount / quiz.questions.length) * 100);
  };

  // Get draft for current question
  const getCurrentDraft = () => {
    return draftAnswers[currentQuestionIndex] || null;
  };

  return {
    quiz,
    config,
    currentQuestion,
    currentQuestionIndex,
    currentQuestionNumber,
    timeRemaining,
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
    currentDraft: getCurrentDraft(),
    isSubmitting,
    isEvaluating,
    evaluationProgress,
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
    goToQuestion,
    saveDraftAnswer,
    saveCurrentAnswer,
    clearError: () => setError(null)
  };
};

export default useQuizState;