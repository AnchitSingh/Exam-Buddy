import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { mockBookmarks } from '../data/mockData';

const BookmarksPage = ({ onNavigate }) => {
  const [bookmarks] = useState(mockBookmarks);
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Difficulty');

  const subjects = ['All Subjects', ...new Set(bookmarks.map(b => b.subject))];
  const difficulties = ['All Difficulty', ...new Set(bookmarks.map(b => b.difficulty))];

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const subjectMatch = selectedSubject === 'All Subjects' || bookmark.subject === selectedSubject;
    const difficultyMatch = selectedDifficulty === 'All Difficulty' || bookmark.difficulty === selectedDifficulty;
    return subjectMatch && difficultyMatch;
  });

  const removeBookmark = (bookmarkId) => {
    console.log('Removing bookmark:', bookmarkId);
    // In real app, update state and localStorage
  };

  const practiceQuestion = (bookmarkId) => {
    console.log('Starting practice for question:', bookmarkId);
    // Navigate to quiz with specific question
    onNavigate('quiz');
  };

  return (
    <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => onNavigate('home')} 
                className="p-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">EB</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-800">Bookmarked Questions</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="default">{filteredBookmarks.length} questions</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Bookmarked Questions</h2>
          <p className="text-slate-600">Review the questions you've saved for later study</p>
        </div>

        {/* Filter Options */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-slate-700">Filter by:</span>
            
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-1 bg-slate-100 rounded-lg text-sm border-0 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            
            <select 
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-1 bg-slate-100 rounded-lg text-sm border-0 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
            
            <Button 
              size="sm" 
              onClick={() => console.log('Practice all bookmarks')}
              className="ml-auto"
            >
              Practice All
            </Button>
          </div>
        </div>

        {/* Bookmarked Questions List */}
        <div className="space-y-4">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Bookmarked Questions</h3>
              <p className="text-slate-600 mb-6">Questions you bookmark during quizzes will appear here</p>
              <Button onClick={() => onNavigate('quiz')}>
                Start a Quiz
              </Button>
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Badge variant={bookmark.subject === 'Physics' ? 'info' : bookmark.subject === 'Math' ? 'success' : 'purple'}>
                      {bookmark.subject}
                    </Badge>
                    <Badge variant={
                      bookmark.difficulty === 'Easy' ? 'success' : 
                      bookmark.difficulty === 'Medium' ? 'warning' : 
                      'danger'
                    }>
                      {bookmark.difficulty}
                    </Badge>
                  </div>
                  <button 
                    onClick={() => removeBookmark(bookmark.id)} 
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 13H5v-2h14v2z"/>
                    </svg>
                  </button>
                </div>
                
                <h3 className="text-lg font-semibold text-slate-800 mb-3">
                  {bookmark.question}
                </h3>
                
                <div className="space-y-2 mb-4">
                  {bookmark.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-slate-700">{option}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span>📅 Bookmarked {bookmark.bookmarkedAt}</span>
                    <span>📝 From: {bookmark.source}</span>
                  </div>
                  <Button 
                    onClick={() => practiceQuestion(bookmark.id)} 
                    variant="secondary"
                    size="sm"
                  >
                    Practice
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button - if needed */}
        {filteredBookmarks.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="ghost">
              Load More Questions
            </Button>
          </div>
        )}

      </main>
    </div>
  );
};

export default BookmarksPage;
