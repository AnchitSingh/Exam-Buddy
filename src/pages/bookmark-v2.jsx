import React, { useState, useEffect } from 'react';
import examBuddyAPI from '../services/api';

const BookmarksPage = ({ onNavigate }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Difficulty');
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    const loadBookmarks = async () => {
      const response = await examBuddyAPI.getBookmarks();
      if (response.success) {
        setBookmarks(response.data.sort((a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt)));
      }
    };
    loadBookmarks();
  }, []);

  const subjects = ['All Subjects', ...new Set(bookmarks.map(b => b.subject))];
  const difficulties = ['All Difficulty', ...new Set(bookmarks.map(b => b.difficulty))];

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const subjectMatch = selectedSubject === 'All Subjects' || bookmark.subject === selectedSubject;
    const difficultyMatch = selectedDifficulty === 'All Difficulty' || bookmark.difficulty === selectedDifficulty;
    return subjectMatch && difficultyMatch;
  });

  const removeBookmark = async (questionId) => {
    const response = await examBuddyAPI.removeBookmark(questionId);
    if (response.success) {
      setBookmarks(prev => prev.filter(b => b.questionId !== questionId));
    }
  };

  const transformBookmarksToQuestions = (bookmarksToTransform) => {
    return bookmarksToTransform.map(b => ({
      ...b,
      id: b.questionId,
      type: b.type || 'MCQ',
    }));
  };

  const practiceQuestion = (bookmark) => {
    const questions = transformBookmarksToQuestions([bookmark]);
    onNavigate('quiz', {
      quizConfig: {
        title: `Practice: ${bookmark.subject}`,
        questions: questions,
      },
    });
  };

  const practiceAllFiltered = () => {
    if (filteredBookmarks.length === 0) return;
    const questions = transformBookmarksToQuestions(filteredBookmarks);
    onNavigate('quiz', {
      quizConfig: {
        title: 'Practice All Bookmarks',
        questions: questions,
      },
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return 'from-green-500 to-emerald-500';
      case 'Medium': return 'from-amber-500 to-orange-500';
      case 'Hard': return 'from-red-500 to-pink-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getSubjectIcon = (subject) => {
    switch(subject) {
      case 'Physics': return '⚛️';
      case 'Math': return '📐';
      case 'Chemistry': return '🧪';
      case 'Biology': return '🧬';
      case 'History': return '📜';
      case 'Geography': return '🌍';
      default: return '📚';
    }
  };

  return (
    <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-amber-100/30 rounded-full blur-2xl"></div>
      </div>

      {/* Enhanced Header */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-amber-100/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onNavigate('home')} 
                className="p-2.5 rounded-xl text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-display font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Bookmarks
                </h1>
                <p className="text-xs text-slate-500">{filteredBookmarks.length} saved questions</p>
              </div>
            </div>
            
            {filteredBookmarks.length > 0 && (
              <button
                onClick={practiceAllFiltered}
                className="hidden sm:flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Practice All</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-3">
            Your Saved
            <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              {" "}Questions
            </span>
          </h2>
          <p className="text-lg text-slate-600">Review and practice questions you've bookmarked for later study</p>
        </div>

        {/* Filter Section */}
        {bookmarks.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-xl mb-8 animate-fade-in-up">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
                <span className="text-sm font-semibold text-slate-700">Filters:</span>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <select 
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="appearance-none px-4 py-2 pr-10 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-amber-300 focus:border-amber-400 focus:outline-none transition-colors duration-200 cursor-pointer"
                  >
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
                
                <div className="relative">
                  <select 
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="appearance-none px-4 py-2 pr-10 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-amber-300 focus:border-amber-400 focus:outline-none transition-colors duration-200 cursor-pointer"
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </div>

              <div className="ml-auto flex items-center space-x-2 text-sm text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                </svg>
                <span>{filteredBookmarks.length} results</span>
              </div>
            </div>
          </div>
        )}

        {/* Bookmarked Questions Grid */}
        <div className="space-y-4">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-2xl"></div>
                <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-800 mb-3">
                {bookmarks.length === 0 ? 'No Bookmarks Yet' : 'No Matching Questions'}
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {bookmarks.length === 0 
                  ? 'Questions you bookmark during quizzes will appear here for easy review'
                  : 'Try adjusting your filters to see more questions'}
              </p>
              {bookmarks.length === 0 && (
                <button
                  onClick={() => onNavigate('home', { openQuizSetup: true })}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                  <span>Start a Quiz</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {filteredBookmarks.map((bookmark, index) => (
                <div 
                  key={bookmark.id} 
                  className="group bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] animate-fade-in-up"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="p-6">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex items-center justify-center text-xl">
                          {getSubjectIcon(bookmark.subject)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-800">{bookmark.subject}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium text-white bg-gradient-to-r ${getDifficultyColor(bookmark.difficulty)} rounded-full`}>
                              {bookmark.difficulty}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            From: {bookmark.source} • {new Date(bookmark.bookmarkedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => removeBookmark(bookmark.questionId)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                    
                    {/* Question */}
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 leading-relaxed">
                      {bookmark.question}
                    </h3>
                    
                    {/* Options */}
                    <button
                      onClick={() => setExpandedCard(expandedCard === bookmark.id ? null : bookmark.id)}
                      className="w-full text-left"
                    >
                      <div className={`space-y-2 overflow-hidden transition-all duration-300 ${
                        expandedCard === bookmark.id ? 'max-h-96' : 'max-h-0'
                      }`}>
                        {bookmark.options.map((option, idx) => (
                          <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                            <span className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-sm font-medium text-slate-600 shadow-sm">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="text-sm text-slate-700 flex-1">{option.text}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-center pt-3 text-sm text-slate-500 hover:text-amber-600 transition-colors duration-200">
                        <span>{expandedCard === bookmark.id ? 'Hide' : 'Show'} options</span>
                        <svg className={`w-4 h-4 ml-1 transform transition-transform duration-300 ${
                          expandedCard === bookmark.id ? 'rotate-180' : ''
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                      </div>
                    </button>
                    
                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span>2 min</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span>{bookmark.type || 'MCQ'}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => practiceQuestion(bookmark)}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>Practice</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Mobile Practice All Button */}
              <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
                <button
                  onClick={practiceAllFiltered}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl shadow-xl font-medium animate-bounce-slow"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Practice All ({filteredBookmarks.length})</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>

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
        
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-10px) translateX(-50%); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out both;
        }
        
        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default BookmarksPage;