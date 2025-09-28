// This will be the single point where backend integration happens later
// Frontend components will ONLY call these functions, never access data directly
import chromeAI from '../utils/chromeAI';
import { getQuizByTopic, getDefaultQuiz } from '../data/mockQuizTemplates';

async function aiReady() {
    const st = await chromeAI.available();
    return !!st?.available;
}

class ExamBuddyAPI {
    constructor() {
        this.isProduction = true; // Switch this to enable real backend calls
    }

    async generateQuiz(input) {
        const canAI = this.useAI && await aiReady();
        if (canAI && input?.extractedSource) {
            const data = await chromeAI.generateQuizJSON({
                extractedSource: input.extractedSource,
                config: input
            });
            // The validator ensures shape; return as-is for UI.
            return {
                success: true, data: {
                    id: `quiz_${Date.now()}`,
                    title: `${input.topic || input.extractedSource?.title || 'Adaptive'} Quiz`,
                    subject: detectSubject(input.extractedSource?.text || input.topic || ''),
                    difficulty: input.difficulty || 'medium',
                    totalQuestions: data.questions?.length || 0,
                    questions: data.questions || [],
                    config: input,
                    source: input.extractedSource || null,
                    createdAt: new Date().toISOString(),
                    timeLimit: input?.timerEnabled ? (input?.totalTimer || 600) : null
                }
            };
        }

        // Fallback mock path:
        const { topic = '', questionCount = 5 } = input || {};
        const subject = detectSubject(input?.extractedSource?.text || topic);
        const template = getQuizByTopic(subject) || getDefaultQuiz();
        const selected = template.questions.slice(0, questionCount);
        return {
            success: true, data: {
                id: `quiz_${Date.now()}`,
                title: `${topic || input?.extractedSource?.title || 'Adaptive'} Quiz`,
                subject,
                difficulty: input?.difficulty || 'medium',
                totalQuestions: selected.length,
                questions: selected,
                config: input,
                source: input?.extractedSource || null,
                createdAt: new Date().toISOString(),
                timeLimit: input?.timerEnabled ? (input?.totalTimer || 600) : null
            }
        };
    }

    async submitAnswer(quizId, questionId, answer) {
        // Objective handled locally; subjective types call AI if available.
        const isSubjective = (answer?.questionType === 'Short Answer' || answer?.questionType === 'Fill in Blank') && !answer?.autoSelected;
        const canAI = this.useAI && await aiReady();
        if (isSubjective && canAI) {
            const evaluation = await chromeAI.evaluateSubjectiveJSON({
                question: { stem: answer?.stem || '' },
                canonical: answer?.canonicalAnswers || [],
                userAnswer: answer?.textAnswer || ''
            });
            return {
                success: true,
                data: {
                    isCorrect: !!evaluation.isCorrect,
                    feedback: {
                        message: evaluation.isCorrect ? 'Great job!' : 'Keep refining your understanding.',
                        explanation: evaluation.rationale || ''
                    },
                    explanation: evaluation.rationale || '',
                    score: typeof evaluation.score === 'number' ? evaluation.score : (evaluation.isCorrect ? 1 : 0)
                }
            };
        }

        // Fallback/local:
        return {
            success: true,
            data: {
                isCorrect: !!answer.isCorrect,
                feedback: {
                    message: answer.isCorrect ? 'Great job!' : 'Review the concept and try again.',
                    explanation: answer.explanation || ''
                },
                explanation: answer.explanation || '',
                score: answer.isCorrect ? 1 : 0
            }
        };
    }

    async completeQuiz(quizId, finalAnswers, extras = {}) {
        const totalQuestions = finalAnswers.length;
        const correctAnswers = finalAnswers.filter(a => a?.isCorrect).length;
        const percentage = Math.round((correctAnswers / Math.max(1, totalQuestions)) * 100);
        const timeSpent = finalAnswers.reduce((acc, a) => acc + (a?.timeSpent || 0), 0);

        const summary = {
            quizId,
            totalQuestions,
            correctAnswers,
            percentage,
            perTag: extras?.perTag || {},
            misses: finalAnswers
                .map((a, i) => ({ index: i, isCorrect: !!a?.isCorrect, tags: a?.tags || [] }))
                .filter(x => !x.isCorrect),
            source: {
                title: extras?.sourceTitle || '',
                domain: extras?.sourceDomain || ''
            }
        };

        let plan = { strengths: [], weaknesses: [], nextSteps: [] };
        const canAI = this.useAI && await aiReady();
        if (canAI) {
            try {
                plan = await chromeAI.recommendPlanJSON({ summary });
            } catch {
                // keep default if recommendation fails
            }
        } else {
            // simple heuristics
            plan = {
                strengths: percentage >= 70 ? ['Solid grasp of core ideas'] : [],
                weaknesses: percentage < 70 ? ['Revise missed concepts'] : [],
                nextSteps: [{ topic: 'Review missed tags', action: 'Practice 3 targeted questions', count: 3 }]
            };
        }

        const results = {
            quizId,
            score: correctAnswers,
            totalQuestions,
            percentage,
            timeSpent,
            answers: finalAnswers,
            completedAt: new Date().toISOString(),
            insights: {
                strengths: plan.strengths || [],
                improvements: plan.weaknesses || []
            },
            recommendations: plan
        };

        // Persist to history
        const history = JSON.parse(localStorage.getItem('exam_buddy_quiz_history') || '[]');
        history.push({
            id: quizId,
            title: extras?.title || 'Quiz',
            score: correctAnswers,
            totalQuestions,
            percentage,
            completedAt: results.completedAt,
            subject: extras?.subject || 'General'
        });
        if (history.length > 50) history.splice(0, history.length - 50);
        localStorage.setItem('exam_buddy_quiz_history', JSON.stringify(history));

        return { success: true, data: results };
    }

    // Quiz Management
    async getActiveQuiz(quizId) {
        if (this.isProduction) {
            return this._makeRequest(`/api/quiz/${quizId}`);
        }

        return this._mockGetActiveQuiz(quizId);
    }

    async saveQuizProgress(quizId, progress) {
        if (this.isProduction) {
            return this._makeRequest(`/api/quiz/${quizId}/progress`, { method: 'POST', body: progress });
        }

        return this._mockSaveProgress(quizId, progress);
    }

    async submitAnswer(quizId, questionId, answer) {
        if (this.isProduction) {
            return this._makeRequest(`/api/quiz/${quizId}/answer`, { method: 'POST', body: { questionId, answer } });
        }

        return this._mockSubmitAnswer(quizId, questionId, answer);
    }

    async completeQuiz(quizId, finalAnswers, quiz) {
        if (this.isProduction) {
            return this._makeRequest(`/api/quiz/${quizId}/complete`, { method: 'POST', body: finalAnswers });
        }

        return this._mockCompleteQuiz(quizId, finalAnswers, quiz);
    }

    // ————— Content Source helpers —————

    async cacheLastSource(extractedSource) {
        try {
            localStorage.setItem('exam_buddy_last_source', JSON.stringify({
                ...extractedSource,
                cachedAt: new Date().toISOString()
            }));
        } catch { }
    }

    async prepareQuizSource(extractedSource) {
        // Normalize and persist for quick re-use (e.g., "Use last source" CTA).
        await this.cacheLastSource(extractedSource);
        return { success: true, data: extractedSource };
    }

    // User Data
    async getUserProfile() {
        if (this.isProduction) {
            return this._makeRequest('/api/user/profile');
        }

        return this._mockGetUserProfile();
    }

    async getBookmarks() {
        if (this.isProduction) {
            return this._makeRequest('/api/user/bookmarks');
        }

        return this._mockGetBookmarks();
    }

    async addBookmark(questionId, questionData) {
        if (this.isProduction) {
            return this._makeRequest('/api/user/bookmarks', { method: 'POST', body: { questionId, questionData } });
        }

        return this._mockAddBookmark(questionId, questionData);
    }

    async removeBookmark(questionId) {
        if (this.isProduction) {
            return this._makeRequest(`/api/user/bookmarks/${questionId}`, { method: 'DELETE' });
        }

        return this._mockRemoveBookmark(questionId);
    }

    async removePausedQuiz(quizId) {
        if (this.isProduction) {
            return this._makeRequest(`/api/user/paused-quizzes/${quizId}`, { method: 'DELETE' });
        }

        return this._mockRemovePausedQuiz(quizId);
    }

    async getPausedQuizzes() {
        if (this.isProduction) {
            return this._makeRequest('/api/user/paused-quizzes');
        }

        return this._mockGetPausedQuizzes();
    }

    async getQuizHistory() {
        if (this.isProduction) {
            return this._makeRequest('/api/user/quiz-history');
        }

        return this._mockGetQuizHistory();
    }

    // Content Extraction (Future)
    async extractContent(url) {
        if (this.isProduction) {
            return this._makeRequest('/api/content/extract', { method: 'POST', body: { url } });
        }

        return this._mockExtractContent(url);
    }

    // Private methods
    async _makeRequest(endpoint, options = {}) {
        // Real API implementation will go here
        throw new Error('Production API not implemented yet');
    }

    // Mock implementations with realistic delays and data
    async _mockGenerateQuiz(config) {
        // Simulate AI processing time
        await this._delay(2000 + Math.random() * 3000);

        const quizTemplates = await import('../data/mockQuizTemplates');
        const template = quizTemplates.getQuizByTopic(config.topic) || quizTemplates.getDefaultQuiz();

        const questions = template.questions.slice(0, config.questionCount);

        // Generate quiz based on config
        const quiz = {
            id: `quiz_${Date.now()}`,
            title: `${config.topic} Quiz`,
            subject: this._extractSubject(config.topic),
            difficulty: config.difficulty,
            totalQuestions: questions.length,
            config: config,
            questions: questions,
            createdAt: new Date().toISOString(),
            timeLimit: config.timerEnabled ? config.totalTimer : null
        };

        return { success: true, data: quiz };
    }

    async _mockGetActiveQuiz(quizId) {
        await this._delay(500);

        const pausedQuizzes = JSON.parse(localStorage.getItem('exam_buddy_paused_quizzes') || '[]');
        const quizData = pausedQuizzes.find(q => q.id === quizId);

        if (quizData) {
            return { success: true, data: quizData };
        }

        return { success: false, error: 'Paused quiz not found' };
    }

    async _mockSaveProgress(quizId, progress) {
        await this._delay(200);
        const pausedQuizzes = JSON.parse(localStorage.getItem('exam_buddy_paused_quizzes') || '[]');

        const existingIndex = pausedQuizzes.findIndex(q => q.id === quizId);

        if (existingIndex > -1) {
            pausedQuizzes[existingIndex] = progress;
        } else {
            pausedQuizzes.push(progress);
        }

        localStorage.setItem('exam_buddy_paused_quizzes', JSON.stringify(pausedQuizzes));
        return { success: true };
    }

    async _mockSubmitAnswer(quizId, questionId, answer) {
        await this._delay(1000 + Math.random() * 2000); // Simulate AI evaluation

        // Mock evaluation logic
        const feedback = await this._generateFeedback(questionId, answer);

        return {
            success: true,
            data: {
                isCorrect: answer.isCorrect,
                feedback: feedback,
                explanation: feedback.explanation,
                score: answer.isCorrect ? 1 : 0
            }
        };
    }

    async _mockCompleteQuiz(quizId, finalAnswers, quiz) {
        await this._delay(1500); // Simulate results processing

        const allQuestions = quiz.questions;
        const totalQuestions = quiz.totalQuestions;

        const detailedAnswers = allQuestions.map((question) => {
            const userAnswer = finalAnswers.find(a => a && a.questionId === question.id);
            if (userAnswer) {
                return userAnswer;
            }
            return {
                questionId: question.id,
                isCorrect: false,
                unanswered: true,
                selectedOption: null,
            };
        });

        const correctAnswers = detailedAnswers.filter(a => a && a.isCorrect).length;
        const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        const results = {
            quizId,
            score: correctAnswers,
            totalQuestions,
            percentage,
            timeSpent: finalAnswers.filter(Boolean).reduce((acc, a) => acc + (a.timeSpent || 0), 0),
            answers: detailedAnswers,
            completedAt: new Date().toISOString(),
            insights: this._generateInsights(finalAnswers),
            recommendations: this._generateRecommendations(percentage, finalAnswers)
        };

        // Save to quiz history
        this._saveToHistory({ ...results, title: quiz.title, subject: quiz.subject });

        return { success: true, data: results };
    }

    async _mockGetUserProfile() {
        await this._delay(300);

        const profile = {
            name: 'Study Enthusiast',
            totalQuizzes: 24,
            averageScore: 87,
            totalBookmarks: 12,
            learningStreaks: 3,
            preferredTopics: ['Physics', 'Mathematics', 'Computer Science'],
            recentActivity: await this._getRecentActivity()
        };

        return { success: true, data: profile };
    }

    async _mockGetBookmarks() {
        await this._delay(400);

        const bookmarks = JSON.parse(localStorage.getItem('exam_buddy_bookmarks') || '[]');
        return { success: true, data: bookmarks };
    }

    async _mockAddBookmark(questionId, questionData) {
        await this._delay(300);

        const bookmarks = JSON.parse(localStorage.getItem('exam_buddy_bookmarks') || '[]');
        const bookmark = {
            id: `bookmark_${Date.now()}`,
            questionId,
            question: questionData.question,
            options: questionData.options,
            type: questionData.type,
            correctAnswer: questionData.correctAnswer,
            explanation: questionData.explanation,
            subject: questionData.subject || 'General',
            difficulty: questionData.difficulty || 'Medium',
            bookmarkedAt: new Date().toISOString(),
            source: questionData.quizTitle || 'Unknown Quiz'
        };
        bookmarks.push(bookmark);
        localStorage.setItem('exam_buddy_bookmarks', JSON.stringify(bookmarks));

        return { success: true, data: bookmark };
    }

    async _mockRemoveBookmark(questionId) {
        await this._delay(200);

        const bookmarks = JSON.parse(localStorage.getItem('exam_buddy_bookmarks') || '[]');
        const updatedBookmarks = bookmarks.filter(b => b.questionId !== questionId);
        localStorage.setItem('exam_buddy_bookmarks', JSON.stringify(updatedBookmarks));

        return { success: true };
    }

    async _mockGetPausedQuizzes() {
        await this._delay(400);

        const pausedQuizzes = JSON.parse(localStorage.getItem('exam_buddy_paused_quizzes') || '[]');
        return { success: true, data: pausedQuizzes };
    }

    async _mockGetQuizHistory() {
        await this._delay(500);

        const history = JSON.parse(localStorage.getItem('exam_buddy_quiz_history') || '[]');
        return { success: true, data: history.slice(-10) }; // Last 10 quizzes
    }

    async _mockRemovePausedQuiz(quizId) {
        await this._delay(100);
        const pausedQuizzes = JSON.parse(localStorage.getItem('exam_buddy_paused_quizzes') || '[]');
        const updatedQuizzes = pausedQuizzes.filter(q => q.id !== quizId);
        localStorage.setItem('exam_buddy_paused_quizzes', JSON.stringify(updatedQuizzes));
        return { success: true };
    }

    // Helper methods
    // ————— Helpers —————

    _detectSubject(text = '') {
        const t = (text || '').toLowerCase();
        const map = {
            physics: ['physics', 'thermodynamics', 'kinematics', 'entropy', 'newton', 'quantum'],
            mathematics: ['calculus', 'algebra', 'matrix', 'derivative', 'integral', 'vector'],
            biology: ['cell', 'mitochondria', 'genetics', 'photosynthesis', 'organism'],
            chemistry: ['atom', 'molecule', 'reaction', 'organic', 'inorganic'],
            'computer science': ['algorithm', 'programming', 'javascript', 'python', 'computational'],
            history: ['ancient', 'medieval', 'war', 'civilization', 'empire']
        };
        for (const [subject, keys] of Object.entries(map)) {
            if (keys.some(k => t.includes(k))) return subject;
        }
        return 'general';
    }

    _generateInsights(answers) {
        const correct = answers.filter(a => a?.isCorrect).length;
        const totalTime = answers.reduce((acc, a) => acc + (a?.timeSpent || 0), 0);
        const avgTime = answers.length ? totalTime / answers.length : 0;
        return {
            strengths: [
                correct >= Math.ceil(answers.length * 0.7) ? 'Strong overall performance' : null,
                avgTime < 45 ? 'Efficient time management' : null
            ].filter(Boolean),
            improvements: [
                correct < Math.ceil(answers.length * 0.6) ? 'Review fundamental concepts' : null,
                avgTime > 90 ? 'Practice under time constraints' : null
            ].filter(Boolean)
        };
    }

    _generateRecommendations(scorePct, answers) {
        if (scorePct >= 80) {
            return ['Try a harder difficulty', 'Explore advanced topics', 'Teach concepts to reinforce learning'];
        } else if (scorePct >= 60) {
            return ['Review missed concepts', 'Practice similar questions', 'Focus identified weak areas'];
        }
        return ['Start with easier sets', 'Review basics before next quiz', 'Short, frequent practice sessions'];
    }
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    _extractSubject(topic) {
        const subjectKeywords = {
            'Physics': ['physics', 'mechanics', 'thermodynamics', 'electricity', 'magnetism'],
            'Mathematics': ['math', 'calculus', 'algebra', 'geometry', 'statistics'],
            'Chemistry': ['chemistry', 'organic', 'inorganic', 'biochemistry'],
            'Biology': ['biology', 'anatomy', 'genetics', 'ecology', 'cell'],
            'Computer Science': ['programming', 'javascript', 'python', 'algorithm', 'data structure'],
            'History': ['history', 'war', 'civilization', 'ancient', 'medieval'],
            'Geography': ['geography', 'climate', 'continent', 'country', 'mountain']
        };

        const lowerTopic = topic.toLowerCase();
        for (const [subject, keywords] of Object.entries(subjectKeywords)) {
            if (keywords.some(keyword => lowerTopic.includes(keyword))) {
                return subject;
            }
        }

        return 'General';
    }

    async _generateFeedback(questionId, answer) {
        // Mock AI feedback generation
        const feedbackTemplates = [
            {
                correct: "Excellent! You've grasped this concept well.",
                incorrect: "Not quite right. Let's break this down step by step.",
                explanation: "This concept is fundamental because..."
            },
            {
                correct: "Perfect! Your understanding is spot on.",
                incorrect: "Close, but there's a key detail to consider.",
                explanation: "The important thing to remember is..."
            }
        ];

        const template = feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];

        return {
            message: answer.isCorrect ? template.correct : template.incorrect,
            explanation: template.explanation,
            confidence: 0.85 + Math.random() * 0.15,
            helpfulResources: []
        };
    }

    _generateInsights(answers) {
        const answeredQuestions = answers.filter(Boolean);
        const correctAnswers = answeredQuestions.filter(a => a.isCorrect).length;
        const totalTime = answeredQuestions.reduce((acc, a) => acc + (a.timeSpent || 0), 0);
        const avgTimePerQuestion = answeredQuestions.length > 0 ? totalTime / answeredQuestions.length : 0;

        return {
            strengths: [
                correctAnswers > answeredQuestions.length * 0.7 ? "Strong overall performance" : null,
                avgTimePerQuestion < 45 && avgTimePerQuestion > 0 ? "Efficient time management" : null,
            ].filter(Boolean),
            improvements: [
                correctAnswers < answeredQuestions.length * 0.6 ? "Review fundamental concepts" : null,
                avgTimePerQuestion > 90 ? "Focus on time management" : null,
            ].filter(Boolean)
        };
    }
    _generateRecommendations(score, answers) {
        if (score >= 80) {
            return [
                "Try a harder difficulty level",
                "Explore advanced topics in this subject",
                "Consider teaching others to reinforce learning"
            ];
        } else if (score >= 60) {
            return [
                "Review the concepts from incorrect answers",
                "Practice similar questions",
                "Focus on weak areas identified"
            ];
        } else {
            return [
                "Start with easier questions to build confidence",
                "Review basic concepts before attempting quiz",
                "Take breaks between study sessions"
            ];
        }
    }

    async _getRecentActivity() {
        return [
            { type: 'quiz_completed', title: 'Physics Quiz - Completed', score: '8/10', time: '2 hours ago', id: 'a1' },
            { type: 'quiz_paused', title: 'Math Quiz - Paused', progress: '3/15', time: 'Yesterday', id: 'a2' },
            { type: 'bookmark_added', title: '5 Questions Bookmarked', source: 'Chemistry Quiz', time: '3 days ago', id: 'a3' }
        ];
    }

    _saveToHistory(results) {
        const history = JSON.parse(localStorage.getItem('exam_buddy_quiz_history') || '[]');
        history.push({
            id: results.quizId,
            title: results.title || 'Quiz',
            score: results.score,
            totalQuestions: results.totalQuestions,
            percentage: results.percentage,
            completedAt: results.completedAt,
            subject: results.subject || 'General'
        });
        if (history.length > 50) history.splice(0, history.length - 50);
        localStorage.setItem('exam_buddy_quiz_history', JSON.stringify(history));
    }

}

// Export singleton instance
const examBuddyAPI = new ExamBuddyAPI();
export default examBuddyAPI;
export { examBuddyAPI };
