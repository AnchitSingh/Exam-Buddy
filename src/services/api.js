// src/api.js
import chromeAI from '../utils/chromeAI';
import { generateId } from '../utils/helpers';
import storage from '../utils/storage';

// This will be the single point where backend integration happens
// Frontend components will ONLY call these functions, never access data directly

class ExamBuddyAPI {
  constructor() {
    this.isProduction = true; // ENABLED: Use Chrome AI instead of mock data
    this._isDataLoaded = false;

    // Initialize with empty maps
    this.activeQuizzes = new Map();
    this.quizProgress = new Map();
    this.evaluationHistory = new Map();
    this.studyAnalytics = new Map();
    this.bookmarks = new Map();
    this.pausedQuizzes = new Map();
  }

  async _loadData() {
    if (this._isDataLoaded) return;

    try {
        const [
            activeQuizzes,
            quizProgress,
            evaluationHistory,
            studyAnalytics,
            bookmarks,
            pausedQuizzes
        ] = await Promise.all([
            storage.get('activeQuizzes', []),
            storage.get('quizProgress', []),
            storage.get('evaluationHistory', []),
            storage.get('studyAnalytics', []),
            storage.get('bookmarks', []),
            storage.get('pausedQuizzes', [])
        ]);

        this.activeQuizzes = new Map(activeQuizzes);
        this.quizProgress = new Map(quizProgress);
        this.evaluationHistory = new Map(evaluationHistory);
        this.studyAnalytics = new Map(studyAnalytics);
        this.bookmarks = new Map(bookmarks);
        this.pausedQuizzes = new Map(pausedQuizzes);

        this._isDataLoaded = true;
        console.log('✅ Persistent data loaded into API state.');
    } catch (error) {
        console.error('🚨 Failed to load persistent data:', error);
    }
  }

  // Debugging helper
  _logWithTimestamp(label, data) {
    console.group(`🤖 [ExamBuddy AI] ${label} - ${new Date().toLocaleTimeString()}`);
    console.log('Data:', data);
    if (data && typeof data === 'object') {
      console.log('JSON:', JSON.stringify(data, null, 2));
    }
    console.groupEnd();
  }

  // Chrome AI Integration Functions

  async generateQuiz(config, onProgress) {
    await this._loadData();
    console.log('🚀 Generating quiz with Chrome AI...');
    this._logWithTimestamp('Quiz Generation Request', config);
    
    if (this.isProduction) {
      try {
        // Check AI status first
        const aiStatus = await chromeAI.available();
        console.log('📊 AI Status:', aiStatus);
        
        if (!aiStatus.available) {
          console.log('⚠️ Chrome AI unavailable, falling back to mock data:', aiStatus);
          // Fall back to mock data instead of throwing an error
          const mockQuiz = this._mockGenerateQuiz(config);
          return {
            success: true,
            data: mockQuiz
          };
        }

        // Generate quiz using Chrome AI
        const startTime = performance.now();
        const stream = await chromeAI.streamQuiz({
          extractedSource: {
            // Fix the source structure for AI
            title: config.topic || config.extractedSource?.title || 'Quiz Topic',
            text: config.context || config.extractedSource?.text || config.sourceValue || 'General knowledge',
            chunks: config.extractedSource?.chunks || [{
              id: 'chunk_1',
              text: config.context || config.sourceValue || 'General knowledge',
              start: 0,
              end: (config.context || config.sourceValue || 'General knowledge').length,
              tokenEstimate: 1
            }]
          },
          config: {
            questionCount: config.questionCount || 5,
            difficulty: config.difficulty || 'medium',
            questionTypes: config.questionTypes || ['MCQ'],
            immediateFeedback: config.immediateFeedback !== false
          }
        });

        let jsonString = '';
        let chunkCount = 0;
        for await (const chunk of stream) {
            jsonString += chunk;
            chunkCount++;
            if (onProgress) {
                onProgress({ status: 'streaming', receivedChunks: chunkCount });
            }
        }

        // The prompt asks for JSON only, but let's be safe and extract it.
        const firstBrace = jsonString.indexOf('{');
        if (firstBrace === -1) {
          throw new Error('No JSON object found in the stream');
        }
        
        // Find the matching closing brace
        let depth = 0;
        let lastBraceIndex = -1;
        for (let i = firstBrace; i < jsonString.length; i++) {
            if (jsonString[i] === '{') {
                depth++;
            } else if (jsonString[i] === '}') {
                depth--;
                if (depth === 0) {
                    lastBraceIndex = i;
                    break;
                }
            }
        }

        if (lastBraceIndex === -1) {
          throw new Error('Could not find the end of the JSON object');
        }

        const jsonBlock = jsonString.substring(firstBrace, lastBraceIndex + 1);
        const aiResult = JSON.parse(jsonBlock);
        
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        this._logWithTimestamp(`Quiz Generated (${duration}ms)`, aiResult);
        
        // Transform AI result to match frontend expectations
        const transformedQuestions = (aiResult.questions || []).map((q, index) => {
          const questionText = q.question || q.text;

          let processedOptions = q.options;
          // For MCQs, derive isCorrect from the top-level answer if present
          if (q.type === 'MCQ' && q.answer && Array.isArray(q.options)) {
            processedOptions = q.options.map(opt => ({
              text: opt.text, // ensure clean option object
              isCorrect: opt.text === q.answer,
            }));
          } 
          // For other types (like True/False), handle `correct` or `isCorrect`
          else if (Array.isArray(q.options)) {
            processedOptions = q.options.map(opt => {
              const isCorrect = opt.isCorrect !== undefined ? opt.isCorrect : opt.correct;
              return { text: opt.text, isCorrect: !!isCorrect };
            });
          }

          let normalizedType = q.type;
          const lowerCaseType = q.type.toLowerCase().replace(/[\s\/_-]/g, '');
          if (lowerCaseType === 'truefalse') {
            normalizedType = 'True/False';
          } else if (lowerCaseType === 'subjective' || lowerCaseType === 'shortanswer') {
            normalizedType = 'Short Answer';
          } else if (lowerCaseType === 'fillup' || lowerCaseType === 'fillintheblank' || lowerCaseType === 'fillinblank') {
            normalizedType = 'Fill in Blank';
          }

          // Build the clean, standardized question object
          const newQuestion = {
            ...q, // bring over other fields like explanation, difficulty
            id: generateId(`q${index}`),
            type: normalizedType,
            question: questionText,
            options: processedOptions,
          };

          // Clean up redundant/old properties
          delete newQuestion.text;
          // Only delete answer field if it was used for MCQ processing
          if (q.type === 'MCQ' && q.answer) {
            delete newQuestion.answer;
          }
          
          return newQuestion;
        });

        // Create the quiz object with the original config settings preserved
        const quiz = {
          id: generateId(),
          title: config.title || `AI Generated Quiz - ${new Date().toLocaleDateString()}`,
          description: config.description || 'Quiz generated using Chrome\'s built-in AI',
          questions: transformedQuestions,
          totalQuestions: transformedQuestions.length,
          // Preserve original UI configuration settings from the user's setup
          config: {
            immediateFeedback: config.immediateFeedback,
            timerEnabled: config.timerEnabled,
            totalTimer: config.totalTimer,
            timeLimit: config.timeLimit, // Also preserve timeLimit for consistency
            questionTimer: config.questionTimer,
            showAnswers: config.showAnswers !== false,
            allowRetake: config.allowRetake !== false,
            difficulty: config.difficulty || 'medium',
            subject: config.subject || config.topic || 'General',
            questionCount: config.questionCount || 5,
            questionTypes: config.questionTypes || ['MCQ']
          },
          createdAt: new Date().toISOString(),
          metadata: {
            source: 'chrome-ai',
            model: 'gemini-nano',
            generationTime: duration,
            questionCount: aiResult.questions?.length || 0
          }
        };

        // Store in memory
        this.activeQuizzes.set(quiz.id, quiz);
        await storage.set('activeQuizzes', Array.from(this.activeQuizzes.entries()));
        
        this._logWithTimestamp('Final Quiz Object', quiz);
        
        // RETURN PROPER STRUCTURE FOR FRONTEND
        return {
          success: true,
          data: quiz
        };
        
      } catch (error) {
        console.error('❌ Chrome AI Quiz Generation Error:', error);
        console.error('Stack:', error.stack);
        
        // RETURN ERROR STRUCTURE
        return {
          success: false,
          error: error.message || 'AI generation failed',
          data: null
        };
      }
    }

    // Mock fallback
    const mockQuiz = this._mockGenerateQuiz(config);
    return {
      success: true,
      data: mockQuiz
    };
  }

  async getActiveQuiz(quizId) {
    await this._loadData();
    console.log('🔍 Fetching active quiz:', quizId);
    
    if (this.isProduction) {
      let quiz = this.activeQuizzes.get(quizId);
      if (!quiz) {
        quiz = this.pausedQuizzes.get(quizId);
      }
      this._logWithTimestamp('Retrieved Quiz', quiz);
      
      return {
        success: quiz !== undefined,
        data: quiz || null,
        error: quiz ? null : 'Quiz not found'
      };
    }

    const mockQuiz = this._mockGetActiveQuiz(quizId);
    return {
      success: mockQuiz !== null,
      data: mockQuiz,
      error: mockQuiz ? null : 'Quiz not found'
    };
  }

  async saveQuizProgress(quizId, progress) {
    await this._loadData();
    console.log('💾 Saving quiz progress:', quizId);
    this._logWithTimestamp('Progress Data', progress);
    
    if (this.isProduction) {
      try {
        this.pausedQuizzes.set(quizId, {
          ...progress,
          lastUpdated: new Date().toISOString()
        });
        await storage.set('pausedQuizzes', Array.from(this.pausedQuizzes.entries()));

        // IMPORTANT: Remove from activeQuizzes since it's now paused
        this.activeQuizzes.delete(quizId);
        await storage.set('activeQuizzes', Array.from(this.activeQuizzes.entries()));
        
        return {
          success: true,
          data: { saved: true },
          error: null
        };
      } catch (error) {
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
    }

    return {
      success: true,
      data: { saved: true },
      error: null
    };
  }

  async submitAnswer(quizId, questionId, answer) {
    await this._loadData();
    console.log('✏️ Submitting answer:', { quizId, questionId, answer });
    this._logWithTimestamp('Answer Submission', { quizId, questionId, answer });
    
    if (this.isProduction) {
      try {
        const quiz = this.activeQuizzes.get(quizId);
        if (!quiz) {
          return {
            success: false,
            error: `Quiz ${quizId} not found`,
            data: null
          };
        }

        const question = quiz.questions.find(q => q.id === questionId);
        if (!question) {
          return {
            success: false,
            error: `Question ${questionId} not found in quiz ${quizId}`,
            data: null
          };
        }

        // For MCQ/True-False: direct comparison
        if (question.type === 'MCQ' || question.type === 'True/False') {
          const isCorrect = answer === question.correctAnswer;
          const result = {
            isCorrect,
            correctAnswer: question.correctAnswer,
            feedback: {
              message: isCorrect ? 'Correct!' : 'Incorrect.',
              explanation: question.explanation || 'No explanation provided.'
            },
            explanation: question.explanation || '',
            score: isCorrect ? 1.0 : 0.0
          };
          
          this._logWithTimestamp('Objective Answer Result', result);
          return {
            success: true,
            data: result,
            error: null
          };
        }

        // For subjective questions: use AI evaluation
        if (question.type === 'Short Answer' || question.type === 'Fill in Blank' || question.type === 'Subjective') {
          try {
            console.log('🧠 Evaluating subjective answer with Chrome AI...');
            const startTime = performance.now();
            
            const evaluation = await chromeAI.evaluateSubjectiveJSON({
              question,
              canonical: question.explanation, // Use explanation as the reference answer
              userAnswer: answer.textAnswer // Pass the user's text answer
            });
            
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            this._logWithTimestamp(`Subjective Evaluation (${duration}ms)`, evaluation);
            
            return {
              success: true,
              data: {
                isCorrect: evaluation.isCorrect,
                score: evaluation.score,
                feedback: evaluation.feedback,
                explanation: evaluation.explanation,
                metadata: {
                  evaluationTime: duration,
                  evaluatedBy: 'chrome-ai'
                }
              },
              error: null
            };
            
          } catch (error) {
            console.error('❌ AI Evaluation Error:', error);
            
            // Fallback evaluation
            const fallbackResult = {
              isCorrect: null, // Unknown
              score: 0.5, // Neutral score
              feedback: {
                message: 'Answer submitted but could not be evaluated automatically.',
                explanation: 'Manual review may be required.'
              },
              explanation: 'Automatic evaluation failed. Please review manually.',
              metadata: {
                error: error.message,
                fallback: true
              }
            };
            
            this._logWithTimestamp('Fallback Evaluation', fallbackResult);
            return {
              success: true,
              data: fallbackResult,
              error: null
            };
          }
        }

        return {
          success: false,
          error: `Unsupported question type: ${question.type}`,
          data: null
        };
        
      } catch (error) {
        return {
          success: false,
          error: error.message,
          data: null
        };
      }
    }

    const mockResult = this._mockSubmitAnswer(quizId, questionId, answer);
    return {
      success: true,
      data: mockResult,
      error: null
    };
  }

  async getQuizResults(quizId) {
    console.log('📈 Fetching quiz results:', quizId);
    
    if (this.isProduction) {
      try {
        const progress = this.quizProgress.get(quizId);
        const quiz = this.activeQuizzes.get(quizId);
        
        if (!progress || !quiz) {
          return {
            success: false,
            error: 'Quiz or progress data not found',
            data: null
          };
        }
        
        const results = {
          quizId,
          totalQuestions: quiz.questions.length,
          answeredQuestions: Object.keys(progress.answers || {}).length,
          correctAnswers: 0,
          totalScore: 0,
          percentage: 0,
          timeSpent: progress.timeSpent || 0,
          completedAt: progress.completedAt || null,
          answers: progress.answers || {},
          feedback: []
        };
        
        // Calculate scores
        for (const [questionId, answerData] of Object.entries(progress.answers || {})) {
          if (answerData.isCorrect === true) {
            results.correctAnswers++;
          }
          results.totalScore += (answerData.score || 0);
        }
        
        results.percentage = quiz.questions.length > 0 
          ? Math.round((results.correctAnswers / quiz.questions.length) * 100)
          : 0;

        this._logWithTimestamp('Quiz Results', results);
        return {
          success: true,
          data: results,
          error: null
        };
        
      } catch (error) {
        return {
          success: false,
          error: error.message,
          data: null
        };
      }
    }

    const mockResults = this._mockGetQuizResults(quizId);
    return {
      success: true,
      data: mockResults,
      error: null
    };
  }

  async generateStudyPlan(performanceSummary) {
    console.log('📚 Generating study plan with Chrome AI...');
    this._logWithTimestamp('Performance Summary Input', performanceSummary);
    
    if (this.isProduction) {
      try {
        // Check AI status
        const aiStatus = await chromeAI.available();
        if (!aiStatus.available) {
          console.log('⚠️ Chrome AI unavailable for study plan, falling back to mock data:', aiStatus);
          const mockPlan = this._mockGenerateStudyPlan(performanceSummary);
          return {
            success: true,
            data: mockPlan,
            error: null
          };
        }

        const startTime = performance.now();
        const recommendations = await chromeAI.recommendPlanJSON({
          summary: performanceSummary
        });
        
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        this._logWithTimestamp(`Study Plan Generated (${duration}ms)`, recommendations);
        
        const studyPlan = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          basedOn: performanceSummary,
          recommendations: recommendations,
          metadata: {
            generatedBy: 'chrome-ai',
            generationTime: duration
          }
        };
        
        // Store for analytics
        this.studyAnalytics.set(studyPlan.id, studyPlan);
        await storage.set('studyAnalytics', Array.from(this.studyAnalytics.entries()));
        
        return {
          success: true,
          data: studyPlan,
          error: null
        };
        
      } catch (error) {
        console.error('❌ Study Plan Generation Error:', error);
        const mockPlan = this._mockGenerateStudyPlan(performanceSummary);
        return {
          success: true,
          data: mockPlan,
          error: null
        };
      }
    }

    const mockPlan = this._mockGenerateStudyPlan(performanceSummary);
    return {
      success: true,
      data: mockPlan,
      error: null
    };
  }

  async completeQuiz(quizId, answers, quiz) {
    await this._loadData();
    console.log('✅ Completing quiz:', quizId, answers, quiz);
    
    try {
      // Calculate results
      const results = {
        quizId,
        totalQuestions: quiz?.questions?.length || 0,
        answeredQuestions: answers?.length || 0,
        score: answers?.filter(a => a.isCorrect).length || 0,
        totalScore: answers?.reduce((sum, a) => sum + (a.score || (a.isCorrect ? 1 : 0)), 0) || 0,
        timeSpent: 0,
        completedAt: new Date().toISOString(),
        answers: answers || []
      };
      
      results.percentage = quiz?.questions?.length > 0 
        ? Math.round((results.correctAnswers / quiz.questions.length) * 100)
        : 0;
        
      // Store results
      this.quizProgress.set(quizId, {
        ...results,
        completed: true
      });
      await storage.set('quizProgress', Array.from(this.quizProgress.entries()));

      // Remove from active quizzes
      this.activeQuizzes.delete(quizId);
      await storage.set('activeQuizzes', Array.from(this.activeQuizzes.entries()));
      
      return {
        success: true,
        data: results,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async addBookmark(questionId, bookmarkData) {
    await this._loadData();
    console.log('📎 Adding bookmark:', questionId, bookmarkData);
    
    try {
      const bookmark = {
        id: generateId('bookmark'),
        questionId,
        ...bookmarkData,
        createdAt: new Date().toISOString()
      };
      
      this.bookmarks.set(questionId, bookmark);
      await storage.set('bookmarks', Array.from(this.bookmarks.entries()));
      
      return {
        success: true,
        data: bookmark,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async removeBookmark(questionId) {
    await this._loadData();
    console.log('🗑️ Removing bookmark:', questionId);
    
    try {
      const removed = this.bookmarks.delete(questionId);
      await storage.set('bookmarks', Array.from(this.bookmarks.entries()));
      
      return {
        success: true,
        data: { removed },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async removePausedQuiz(quizId) {
    await this._loadData();
    console.log('🔄 Removing paused quiz:', quizId);
    
    try {
      const removed = this.pausedQuizzes.delete(quizId);
      await storage.set('pausedQuizzes', Array.from(this.pausedQuizzes.entries()));
      
      return {
        success: true,
        data: { removed },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Chrome AI Status Methods
  async getAIStatus() {
    try {
      const status = await chromeAI.available();
      this._logWithTimestamp('AI Status Check', status);
      return {
        success: true,
        data: status,
        error: null
      };
    } catch (error) {
      console.error('❌ AI Status Check Failed:', error);
      return {
        success: false,
        data: { available: false, status: 'error' },
        error: error.message
      };
    }
  }

  async initializeAI() {
    console.log('🔧 Initializing Chrome AI...');
    try {
      const status = await this.getAIStatus();
      if (status.data?.status === 'downloadable') {
        console.log('📥 Triggering AI model download...');
        // This should be called behind a user gesture
        await chromeAI.available();
      }
      return status;
    } catch (error) {
      console.error('❌ AI Initialization Failed:', error);
      return {
        success: false,
        data: { available: false, status: 'error' },
        error: error.message
      };
    }
  }

  // Debug methods
  async getDebugInfo() {
    await this._loadData();
    return {
      success: true,
      data: {
        isProduction: this.isProduction,
        activeQuizzes: Array.from(this.activeQuizzes.keys()),
        progressEntries: Array.from(this.quizProgress.keys()),
        studyPlans: Array.from(this.studyAnalytics.keys()),
        bookmarks: Array.from(this.bookmarks.keys()),
        pausedQuizzes: Array.from(this.pausedQuizzes.keys()),
        timestamp: new Date().toISOString()
      },
      error: null
    };
  }

  async clearDebugData() {
    this.activeQuizzes.clear();
    this.quizProgress.clear();
    this.evaluationHistory.clear();
    this.studyAnalytics.clear();
    this.bookmarks.clear();
    this.pausedQuizzes.clear();
    this._isDataLoaded = true; // It's "loaded" because it's empty

    await Promise.all([
        storage.remove('activeQuizzes'),
        storage.remove('quizProgress'),
        storage.remove('evaluationHistory'),
        storage.remove('studyAnalytics'),
        storage.remove('bookmarks'),
        storage.remove('pausedQuizzes')
    ]);

    console.log('🧹 Debug data cleared');
    
    return {
      success: true,
      data: { cleared: true },
      error: null
    };
  }

  // Keep original mock methods for fallback
  _mockGenerateQuiz(config) {
    console.log('🎭 Using mock quiz generation');
    const mockQuestions = [
      {
        id: 'q1',
        type: 'MCQ',
        question: 'What is the primary purpose of this content?',
        options: ['Education', 'Entertainment', 'Marketing', 'Research'],
        correctAnswer: 'Education',
        explanation: 'Based on the content analysis, the primary purpose appears to be educational.',
        difficulty: config.difficulty || 'medium',
        subject: config.subject || config.topic || 'General'
      },
      {
        id: 'q2',
        type: 'True/False',
        question: 'This content contains technical information.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'The content includes technical details and terminology.',
        difficulty: config.difficulty || 'medium',
        subject: config.subject || config.topic || 'General'
      }
    ];

    return {
      id: generateId(),
      title: config.title || 'Mock Generated Quiz',
      description: 'Generated using mock data for testing',
      questions: mockQuestions.slice(0, config.questionCount || 2),
      config: config,
      createdAt: new Date().toISOString(),
      metadata: { source: 'mock' }
    };
  }

  _mockGetActiveQuiz(quizId) {
    return this.activeQuizzes.get(quizId) || null;
  }

  _mockSubmitAnswer(quizId, questionId, answer) {
    return {
      isCorrect: Math.random() > 0.5,
      feedback: { 
        message: 'Mock feedback',
        explanation: 'This is mock evaluation' 
      },
      explanation: 'Mock explanation',
      score: Math.random()
    };
  }

  _mockGetQuizResults(quizId) {
    return {
      quizId,
      totalQuestions: 2,
      correctAnswers: 1,
      percentage: 50,
      timeSpent: 120,
      answers: {},
      completedAt: new Date().toISOString()
    };
  }

  _mockGenerateStudyPlan(summary) {
    return {
      id: generateId(),
      recommendations: {
        strengths: ['Quick comprehension', 'Good recall'],
        weaknesses: ['Complex problem solving', 'Time management'],
        nextSteps: ['Practice more problems', 'Review weak topics', 'Take timed tests']
      },
      metadata: { source: 'mock' },
      createdAt: new Date().toISOString()
    };
  }

  async streamQuizFeedback(quizMeta, stats) {
    console.log('🧠 Streaming overall feedback...');
    try {
      const aiStatus = await chromeAI.available();
      if (!aiStatus.available) {
        console.log('⚠️ Chrome AI unavailable for feedback, using error stream:', aiStatus);
        async function* errorStream() { yield "Sorry, I was unable to generate feedback at this time."; }
        return errorStream();
      }
      return await chromeAI.streamOverallFeedback({ quizMeta, stats });
    } catch (error) {
      console.error('❌ AI Streaming Feedback Error:', error);
      async function* errorStream() { yield "Sorry, I was unable to generate feedback at this time."; }
      return errorStream();
    }
  }

  async getQuizRecommendations(quizMeta, stats) {
    console.log('💡 Getting quiz recommendations...');
    try {
      const aiStatus = await chromeAI.available();
      if (!aiStatus.available) {
        console.log('⚠️ Chrome AI unavailable for recommendations, returning fallback:', aiStatus);
        // Return a default recommendations structure when AI is unavailable
        return { 
          success: true, 
          data: {
            recommendations: [
              { 
                topic: "General Study", 
                reason: "AI is unavailable, using general recommendations", 
                suggested_count: 3, 
                types: ["MCQ"] 
              }
            ]
          } 
        };
      }
      const result = await chromeAI.getQuizRecommendationsJSON({ quizMeta, stats });
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ AI Recommendations Error:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async getUserProfile() {
    await this._loadData();
    return {
      success: true,
      data: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    };
  }

  async getPausedQuizzes() {
    await this._loadData();
    return {
      success: true,
      data: Array.from(this.pausedQuizzes.values())
    };
  }

  async getBookmarks() {
    await this._loadData();
    return {
      success: true,
      data: Array.from(this.bookmarks.values())
    };
  }
}

// Export singleton instance
const examBuddyAPI = new ExamBuddyAPI();

// Export individual methods for cleaner imports
export const {
  generateQuiz,
  getActiveQuiz,
  saveQuizProgress,
  submitAnswer,
  getQuizResults,
  generateStudyPlan,
  completeQuiz,
  addBookmark,
  removeBookmark,
  removePausedQuiz,
  getAIStatus,
  initializeAI,
  getDebugInfo,
  clearDebugData,
  getUserProfile,
  getPausedQuizzes,
  getBookmarks,
  streamQuizFeedback,
  getQuizRecommendations
} = examBuddyAPI;

export default examBuddyAPI;
