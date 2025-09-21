import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import QuizSetupModal from '../components/quiz/QuizSetupModal';
import examBuddyAPI from '../services/api';
import { extractFromCurrentPage } from '../utils/contentExtractor';

const HomePage = ({ onNavigate }) => {
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [extractionResult, setExtractionResult] = useState(null);

  const handleTestExtraction = async () => {
    try {
      setExtractionResult('Extracting content from page...');
      const result = await extractFromCurrentPage();
      console.log('Extraction Result:', result);
      // Displaying only a subset of data for readability
      const displayResult = {
        sourceType: result.sourceType,
        title: result.title,
        url: result.url,
        domain: result.domain,
        excerpt: result.excerpt,
        wordCount: result.wordCount,
        chunksCount: result.chunks.length,
      };
      setExtractionResult(JSON.stringify(displayResult, null, 2));
    } catch (error) {
      console.error('Extraction failed:', error);
      setExtractionResult(`Error: ${error.message}`);
    }
  };

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load user profile and recent activity
      const [profileResponse, historyResponse] = await Promise.all([
        examBuddyAPI.getUserProfile(),
        examBuddyAPI.getQuizHistory()
      ]);
      
      if (profileResponse.success) {
        setUserProfile(profileResponse.data);
        setRecentActivity(profileResponse.data.recentActivity || []);
      }
      
      if (historyResponse.success) {
        // Merge with existing activity
        setRecentActivity(prev => [
          ...prev,
          ...historyResponse.data.slice(0, 3).map(quiz => ({
            type: 'quiz_completed',
            title: `${quiz.title} - Completed`,
            score: `${quiz.score}/${quiz.totalQuestions}`,
            time: new Date(quiz.completedAt).toLocaleDateString(),
            id: quiz.id
          }))
        ]);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async (config) => {
    console.log('=== STARTING NEW QUIZ ===');
    console.log('Config submitted:', config);
    console.log('========================');
    
    // Pass config to QuizPage
    onNavigate('quiz', { quizConfig: config });
  };

  const handleQuickAction = async (actionType) => {
    switch (actionType) {
      case 'paused':
        console.log('=== NAVIGATING TO PAUSED QUIZZES ===');
        onNavigate('paused');
        break;
      case 'bookmarks':
        console.log('=== NAVIGATING TO BOOKMARKS ===');
        onNavigate('bookmarks');
        break;
      case 'continue-activity':
        // Handle continuing specific activity
        console.log('=== CONTINUING ACTIVITY ===');
        onNavigate('quiz');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">EB</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-800">Exam Buddy</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => handleQuickAction('bookmarks')}
                className="p-2 rounded-xl text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome back{userProfile?.name ? `, ${userProfile.name}` : ''}! 👋
          </h2>
          <p className="text-slate-600">Ready to continue your learning journey?</p>
        </div>

        {/* EXTRACTION TEST SECTION */}
        <div className="mb-8 p-4 border-2 border-dashed border-amber-400 rounded-2xl bg-amber-50/50">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Extraction Test</h3>
            <p className="text-sm text-slate-600 mb-4">
                Click the button below to test the content extraction from the current active browser tab.
                Make sure you are on a page with some article content.
            </p>
            <Button onClick={handleTestExtraction} variant="secondary">
                Test Page Extraction
            </Button>
            {extractionResult && (
                <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                    <h4 className="font-bold text-slate-700">Extraction Result:</h4>
                    <pre className="text-xs whitespace-pre-wrap overflow-x-auto mt-2">
                        {extractionResult}
                    </pre>
                </div>
            )}
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Start New Quiz */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white relative overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200" 
               onClick={() => setShowQuizSetup(true)}>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Start New Quiz</h3>
              <p className="text-amber-100 mb-4">Create a quiz from any webpage or PDF</p>
              <div className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-medium transition-colors text-white border-none shadow-none inline-block">
                Get Started
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16"></div>
          </div>

          {/* Continue Paused */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-200"
               onClick={() => handleQuickAction('paused')}>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Continue Learning</h3>
            <p className="text-slate-600 mb-4">Resume your paused quizzes</p>
            <span className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
              View Paused →
            </span>
          </div>

          {/* Review Bookmarks */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-200"
               onClick={() => handleQuickAction('bookmarks')}>
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Review Bookmarks</h3>
            <p className="text-slate-600 mb-4">Practice your saved questions</p>
            <span className="text-purple-600 hover:text-purple-700 font-medium cursor-pointer">
              View All →
            </span>
          </div>

        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/20 shadow-lg mb-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-6">Recent Activity</h3>
            
            <div className="space-y-4">
              {recentActivity.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    activity.type === 'quiz_completed' ? 'bg-green-100' :
                    activity.type === 'quiz_paused' ? 'bg-amber-100' :
                    'bg-purple-100'
                  }`}>
                    {activity.type === 'quiz_completed' && (
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                      </svg>
                    )}
                    {activity.type === 'quiz_paused' && (
                      <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    )}
                    {activity.type === 'bookmark_added' && (
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{activity.title}</h4>
                    <p className="text-slate-600 text-sm">
                      {activity.score && `Score: ${activity.score} • `}
                      {activity.progress && `Progress: ${activity.progress} • `}
                      {activity.time}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleQuickAction('continue-activity')}
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    {activity.type === 'quiz_paused' ? 'Continue' : 'Review'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study Stats */}
        {userProfile && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg text-center">
              <div className="text-3xl font-bold text-amber-600 mb-1">{userProfile.totalQuizzes}</div>
              <div className="text-slate-600 text-sm">Quizzes Completed</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{userProfile.averageScore}%</div>
              <div className="text-slate-600 text-sm">Average Score</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{userProfile.totalBookmarks}</div>
              <div className="text-slate-600 text-sm">Bookmarked Questions</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{userProfile.learningStreaks}</div>
              <div className="text-slate-600 text-sm">Learning Streaks</div>
            </div>
          </div>
        )}

      </main>

      {/* Quiz Setup Modal */}
      <QuizSetupModal 
        isOpen={showQuizSetup}
        onClose={() => setShowQuizSetup(false)}
        onStartQuiz={handleStartQuiz}
      />
    </div>
  );
};

export default HomePage;
