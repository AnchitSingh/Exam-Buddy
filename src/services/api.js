// src/api.js
import chromeAI from '../utils/chromeAI';
import { generateId } from '../utils/helpers';

// This will be the single point where backend integration happens
// Frontend components will ONLY call these functions, never access data directly

class ExamBuddyAPI {
  constructor() {
    this.isProduction = true; // ENABLED: Use Chrome AI instead of mock data
    
    // In-memory storage for quiz sessions (replace with proper state management later)
    this.activeQuizzes = new Map();
    this.quizProgress = new Map();
    this.evaluationHistory = new Map();
    this.studyAnalytics = new Map();
    this.bookmarks = new Map();
    this.pausedQuizzes = new Map();
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

  async generateQuiz(config) {
    console.log('🚀 Generating quiz with Chrome AI...');
    this._logWithTimestamp('Quiz Generation Request', config);
    
    if (this.isProduction) {
      try {
        // Check AI status first
        const aiStatus = await chromeAI.available();
        console.log('📊 AI Status:', aiStatus);
        
        if (!aiStatus.available) {
          throw new Error(`Chrome AI unavailable: ${aiStatus.status}`);
        }

        // Generate quiz using Chrome AI
        const startTime = performance.now();
        const aiResult = await chromeAI.generateQuizJSON({
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
        
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        this._logWithTimestamp(`Quiz Generated (${duration}ms)`, aiResult);
        
        // Transform AI result to match frontend expectations
        const transformedQuestions = (aiResult.questions || []).map((q, index) => ({
          ...q,
          id: generateId(`q${index}`),
        }));

        const quiz = {
          id: generateId(),
          title: config.title || `AI Generated Quiz - ${new Date().toLocaleDateString()}`,
          description: config.description || 'Quiz generated using Chrome\'s built-in AI',
          questions: transformedQuestions,
          totalQuestions: transformedQuestions.length,
          config: {
            timeLimit: config.timeLimit,
            showAnswers: config.showAnswers !== false,
            allowRetake: config.allowRetake !== false,
            difficulty: config.difficulty || 'medium',
            subject: config.subject || config.topic || 'General'
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
    console.log('🔍 Fetching active quiz:', quizId);
    
    if (this.isProduction) {
      const quiz = this.activeQuizzes.get(quizId);
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
    console.log('💾 Saving quiz progress:', quizId);
    this._logWithTimestamp('Progress Data', progress);
    
    if (this.isProduction) {
      try {
        this.quizProgress.set(quizId, {
          ...progress,
          lastUpdated: new Date().toISOString()
        });
        
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
        if (question.type === 'Short Answer' || question.type === 'Fill in Blank') {
          try {
            console.log('🧠 Evaluating subjective answer with Chrome AI...');
            const startTime = performance.now();
            
            const evaluation = await chromeAI.evaluateSubjectiveJSON({
              question,
              canonical: question.correctAnswer,
              userAnswer: answer
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
          throw new Error(`Chrome AI unavailable: ${aiStatus.status}`);
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
    console.log('📎 Adding bookmark:', questionId, bookmarkData);
    
    try {
      const bookmark = {
        id: generateId('bookmark'),
        questionId,
        ...bookmarkData,
        createdAt: new Date().toISOString()
      };
      
      this.bookmarks.set(questionId, bookmark);
      
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
    console.log('🗑️ Removing bookmark:', questionId);
    
    try {
      const removed = this.bookmarks.delete(questionId);
      
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
    console.log('🔄 Removing paused quiz:', quizId);
    
    try {
      const removed = this.pausedQuizzes.delete(quizId);
      
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
  getDebugInfo() {
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

  clearDebugData() {
    this.activeQuizzes.clear();
    this.quizProgress.clear();
    this.evaluationHistory.clear();
    this.studyAnalytics.clear();
    this.bookmarks.clear();
    this.pausedQuizzes.clear();
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

  // Dummy methods as requested
  getUserProfile() {
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

  getPausedQuizzes() {
    return {
      success: true,
      data: Array.from(this.pausedQuizzes.values())
    };
  }

  getBookmarks() {
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
  getBookmarks
} = examBuddyAPI;

export default examBuddyAPI;
