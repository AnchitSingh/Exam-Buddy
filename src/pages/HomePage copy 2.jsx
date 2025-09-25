import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import QuizSetupModal from '../components/quiz/QuizSetupModal';
import examBuddyAPI from '../services/api';
import { extractFromCurrentPage, extractFromPDFResult, normalizeManualTopic } from '../utils/contentExtractor';
import { extractTextFromPDF } from '../utils/pdfExtractor';
import { SOURCE_TYPE } from '../utils/messages';

const HomePage = ({ onNavigate, navigationData }) => {
  const [activeTab, setActiveTab] = useState('continue'); // 'continue' or 'bookmarks'
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [pausedQuizzes, setPausedQuizzes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (navigationData?.openQuizSetup) {
      setShowQuizSetup(true);
    }
  }, [navigationData]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const [profileResponse, historyResponse, pausedResponse, bookmarksResponse] = await Promise.all([
        examBuddyAPI.getUserProfile(),
        examBuddyAPI.getQuizHistory(),
        examBuddyAPI.getPausedQuizzes(),
        examBuddyAPI.getBookmarks()
      ]);

      if (profileResponse.success) {
        setUserProfile(profileResponse.data);
      }

      if (pausedResponse.success) {
        setPausedQuizzes(pausedResponse.data);
      }

      if (bookmarksResponse.success) {
        setBookmarks(bookmarksResponse.data);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      // Fallback data for demo purposes
      setPausedQuizzes([{
        id: 'demo1',
        title: "React Advanced Concepts",
        progress: 60,
        questionsLeft: 4,
        totalQuestions: 10
      }]);
      setBookmarks([
        { id: 'b1', title: 'React Hooks Guide', savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { id: 'b2', title: 'State Management Patterns', savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async (config) => {
    console.log('=== STARTING NEW QUIZ ===');
    console.log('Config submitted:', config);

    let extractedSource;

    try {
      switch (config.sourceType) {
        case SOURCE_TYPE.PAGE:
          extractedSource = await extractFromCurrentPage();
          break;

        case SOURCE_TYPE.PDF:
          if (config.pdfFile) {
            const { text, meta } = await extractTextFromPDF(config.pdfFile);
            extractedSource = await extractFromPDFResult({
              text,
              fileName: config.pdfFile.name,
              pageCount: meta.pageCount
            });
          }
          break;

        case SOURCE_TYPE.URL:
          extractedSource = normalizeManualTopic(config.sourceValue, `Content from ${config.sourceValue}`);
          break;

        case SOURCE_TYPE.MANUAL:
        default:
          extractedSource = normalizeManualTopic(config.topic, config.context);
          break;
      }

      console.log('Extracted Source:', extractedSource);

      const finalQuizConfig = {
        ...config,
        extractedSource,
        topic: config.topic || extractedSource.title,
      };

      setShowQuizSetup(false);
      toast('Generating your quiz...');
      onNavigate('quiz', { quizConfig: finalQuizConfig });

    } catch (error) {
      console.error('Failed to prepare quiz source:', error);
      toast.error('Failed to prepare quiz source');
    }
  };

  const handleQuickAction = async (actionType) => {
    switch (actionType) {
      case 'paused':
        onNavigate('paused');
        break;
      case 'bookmarks':
        onNavigate('bookmarks');
        break;
      case 'continue-activity':
        onNavigate('quiz');
        break;
      default:
        break;
    }
  };


  const formatTimeAgo = (date) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  if (isLoading) {
    return (
      <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-slate-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen overflow-x-hidden">
      {/* Background Elements */}

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 md:left-10 w-64 h-64 md:w-72 md:h-72 bg-amber-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 md:right-10 w-72 h-72 md:w-96 md:h-96 bg-orange-200/30 rounded-full blur-3xl"></div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center py-12 relative z-0">

        {/* Simple Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl font-display font-bold tracking-tight mb-4">
            <span className="text-slate-800">Welcome back{userProfile?.name ? `, ${userProfile.name}` : ''}</span>
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">.</span>
          </h1>
          <p className="text-lg text-slate-500">What would you like to learn today?</p>
        </div>

        {/* Main Action - Start Quiz */}
        <div className="flex justify-center mb-20 animate-fade-in-up">
          <button
            onClick={() => setShowQuizSetup(true)}
            className="group relative px-12 py-6 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-amber-100/50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center transition-colors duration-500">
                <svg className="w-7 h-7 text-amber-700 transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>

              <div className="text-left">
                <p className="text-xl font-semibold text-slate-900 group-hover:text-white transition-colors duration-500">
                  Start New Quiz
                </p>
                <p className="text-sm text-slate-500 group-hover:text-white/80 transition-colors duration-500">
                  From any webpage or PDF
                </p>
              </div>

              <svg className="w-6 h-6 text-slate-400 group-hover:text-white group-hover:translate-x-2 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>

        {/* Secondary Section - Minimal Tabs */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Tab Headers */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 grid-cols-3 gap-4 rounded-2xl  @apply shadow-[0px_6px_12px_0px_rgba(0,0,0,0.02)_inset,0px_0.75px_0.75px_0px_rgba(0,0,0,0.02)_inset,0px_0.25px_0.25px_0px_rgba(0,0,0,0.04)_inset];">
              <button
                onClick={() => handleQuickAction('paused')}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'continue'
                    ? 'bg-white text-amber-700 shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Continue Learning
              </button>
              <button
                onClick={() => handleQuickAction('bookmarks')}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'bookmarks'
                    ? 'bg-white text-amber-700 shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Bookmarks
              </button>
              <button
                onClick={() => handleQuickAction('#')}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'bookmarks'
                    ? 'bg-white text-amber-700 shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Stories
              </button>
            </div>
          </div>
        </div>

        {/* Subtle Recommendation */}
        <div className="mt-16 text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-sm text-slate-400 mb-2">Recommended for you</p>
          <button
            onClick={() => setShowQuizSetup(true)}
            className="text-amber-600 hover:text-amber-700 font-medium transition-colors duration-300 inline-flex items-center group"
          >
            <span>Advanced React Patterns</span>
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </main>

      {/* Quiz Setup Modal */}
      <QuizSetupModal
        isOpen={showQuizSetup}
        onClose={() => setShowQuizSetup(false)}
        onStartQuiz={handleStartQuiz}
      />

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out both;
        }
      `}</style>
    </div>
  );
};

export default HomePage;