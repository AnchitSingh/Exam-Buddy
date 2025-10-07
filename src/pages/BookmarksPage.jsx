import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import examBuddyAPI from '../services/api';
import GlobalHeader from '../components/ui/GlobalHeader';
import BackgroundEffects from '../components/ui/BackgroundEffects';
// Modal Component for Question Details
const QuestionDetailModal = ({ isOpen, onClose, question, onDelete, onPractice }) => {
  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-modal-enter">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Question Details</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {question.subject && (
                <Badge variant={question.subject === 'Physics' ? 'info' : question.subject === 'Math' ? 'success' : 'purple'}>
                  {question.subject}
                </Badge>
              )}
              {question.difficulty && (
                <Badge variant={
                  question.difficulty === 'Easy' ? 'success' : 
                  question.difficulty === 'Medium' ? 'warning' : 
                  'danger'
                }>
                  {question.difficulty}
                </Badge>
              )}
              {question.type && (
                <Badge variant="default">{question.type}</Badge>
              )}
            </div>

            {/* Question */}
            <div className="mb-6">
              <h4 className="text-base font-semibold text-slate-800 mb-2">Question:</h4>
              <p className="text-slate-700 leading-relaxed">{question.question}</p>
            </div>

            {/* Options */}
            <div className="mb-6">
              <h4 className="text-base font-semibold text-slate-800 mb-3">Options:</h4>
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50">
                    <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-slate-600 font-medium text-sm border border-slate-200">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-slate-700 flex-1">{option.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <div className="flex items-center space-x-4">
                  <span>📅 Bookmarked: {question.bookmarkedAt ? new Date(question.bookmarkedAt).toLocaleDateString() : 'Date unknown'}</span>
                  <span>📝 Source: {question.source}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => onDelete(question.questionId)}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Delete Bookmark
            </button>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => onPractice(question)}>
                Practice Question
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookmarksPage = ({ onNavigate }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    topic: 'All',
    difficulty: 'All',
    type: 'All'
  });
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      setIsLoading(true);
      const response = await examBuddyAPI.getBookmarks();
      if (response.success) {
        setBookmarks(response.data.sort((a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt)));
      }
      setIsLoading(false);
    };
    loadBookmarks();
  }, []);

  // Extract unique values for filters
  const filterOptions = useMemo(() => ({
    topics: ['All', ...new Set(bookmarks.flatMap(b => b.tags || []))],
    difficulties: ['All', ...new Set(bookmarks.map(b => b.difficulty))],
    types: ['All', ...new Set(bookmarks.map(b => b.type || 'MCQ'))]
  }), [bookmarks]);

  // Filter bookmarks based on search and filters
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bookmark => {
      const matchesSearch = searchQuery === '' || 
        bookmark.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bookmark.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTopic = filters.topic === 'All' || (bookmark.tags || []).includes(filters.topic);
      const matchesDifficulty = filters.difficulty === 'All' || bookmark.difficulty === filters.difficulty;
      const matchesType = filters.type === 'All' || (bookmark.type || 'MCQ') === filters.type;
      
      return matchesSearch && matchesTopic && matchesDifficulty && matchesType;
    });
  }, [bookmarks, searchQuery, filters]);

  const handleSelectAll = () => {
    if (selectedBookmarks.size === filteredBookmarks.length) {
      setSelectedBookmarks(new Set());
    } else {
      setSelectedBookmarks(new Set(filteredBookmarks.map(b => b.questionId)));
    }
  };

  const handleSelectBookmark = (questionId) => {
    const newSelected = new Set(selectedBookmarks);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedBookmarks(newSelected);
  };

  const handleViewQuestion = (bookmark) => {
    setSelectedQuestion(bookmark);
    setIsModalOpen(true);
  };

  const handleDeleteBookmark = async (questionId) => {
    try {
      const response = await examBuddyAPI.removeBookmark(questionId);
      if (response.success) {
        setBookmarks(prev => prev.filter(b => b.questionId !== questionId));
        setIsModalOpen(false);
        toast.success('Bookmark removed successfully');
      } else {
        toast.error('Failed to remove bookmark');
      }
    } catch (error) {
      toast.error('Error removing bookmark');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBookmarks.size === 0) return;
    
    const confirmDelete = window.confirm(`Delete ${selectedBookmarks.size} selected bookmark(s)?`);
    if (!confirmDelete) return;

    try {
      // Delete all selected bookmarks
      await Promise.all(
        Array.from(selectedBookmarks).map(id => examBuddyAPI.removeBookmark(id))
      );
      
      setBookmarks(prev => prev.filter(b => !selectedBookmarks.has(b.questionId)));
      setSelectedBookmarks(new Set());
      toast.success(`${selectedBookmarks.size} bookmark(s) removed`);
    } catch (error) {
      toast.error('Error removing bookmarks');
    }
  };

  const practiceQuestion = (bookmark) => {
    const questions = [{
      ...bookmark,
      id: bookmark.questionId,
      type: bookmark.type || 'MCQ',
    }];
    
    setIsModalOpen(false);
    toast('Starting practice quiz...');
    onNavigate('quiz', {
      quizConfig: {
        title: `Practice: ${bookmark.subject}`,
        questions: questions,
      },
    });
  };

  const practiceSelected = () => {
    if (selectedBookmarks.size === 0) return;
    
    const questions = bookmarks
      .filter(b => selectedBookmarks.has(b.questionId))
      .map(b => ({
        ...b,
        id: b.questionId,
        type: b.type || 'MCQ',
      }));
    
    toast(`Starting practice with ${questions.length} questions...`);
    onNavigate('quiz', {
      quizConfig: {
        title: 'Practice Selected Bookmarks',
        questions: questions,
      },
    });
  };

  return (
    <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
      <BackgroundEffects />
      <GlobalHeader currentPage="bookmarks" onNavigate={onNavigate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Bookmarked Questions</h2>
          <p className="text-slate-600">Review and practice your saved questions</p>
        </div>

        {/* Main Card Container */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Filter Button */}
                <div className="relative">
                  <button
                    onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter
                  </button>

                  {/* Filter Dropdown */}
                  {filterMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-20">
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1 block">Topic</label>
                          <select 
                            value={filters.topic}
                            onChange={(e) => setFilters({...filters, topic: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            {filterOptions.topics.map(topic => (
                              <option key={topic} value={topic}>{topic}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1 block">Difficulty</label>
                          <select 
                            value={filters.difficulty}
                            onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            {filterOptions.difficulties.map(difficulty => (
                              <option key={difficulty} value={difficulty}>{difficulty}</option>
                            ))}
                          </select>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                          <button
                            onClick={() => setFilterMenuOpen(false)}
                            className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                          >
                            Apply Filters
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bulk Actions */}
                {selectedBookmarks.size > 0 && (
                  <>
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete ({selectedBookmarks.size})
                    </button>
                    <Button onClick={practiceSelected}>
                      Practice ({selectedBookmarks.size})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading bookmarks...</p>
              </div>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {searchQuery || filters.topic !== 'All' || filters.difficulty !== 'All' 
                  ? 'No matching bookmarks found' 
                  : 'No Bookmarked Questions'}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchQuery || filters.topic !== 'All' || filters.difficulty !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Questions you bookmark during quizzes will appear here'}
              </p>
              {!searchQuery && filters.topic === 'All' && filters.difficulty === 'All' && (
                <Button onClick={() => onNavigate('home', { openQuizSetup: true })}>
                  Start a Quiz
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedBookmarks.size === filteredBookmarks.length && filteredBookmarks.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBookmarks.map((bookmark, index) => (
                    <tr 
                      key={bookmark.questionId} 
                      className="hover:bg-slate-50/50 transition-colors"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedBookmarks.has(bookmark.questionId)}
                          onChange={() => handleSelectBookmark(bookmark.questionId)}
                          className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-lg">
                          <p className="text-slate-800 font-medium line-clamp-2">
                            {bookmark.question}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {bookmark.subject && (
                            <Badge variant={bookmark.subject === 'Physics' ? 'info' : bookmark.subject === 'Math' ? 'success' : 'purple'}>
                              {bookmark.subject}
                            </Badge>
                          )}
                          {bookmark.difficulty && (
                            <Badge variant={
                              bookmark.difficulty === 'Easy' ? 'success' : 
                              bookmark.difficulty === 'Medium' ? 'warning' : 
                              'danger'
                            }>
                              {bookmark.difficulty}
                            </Badge>
                          )}
                          {bookmark.tags && bookmark.tags.length > 0 && bookmark.tags.map((tag, index) => (
                            <Badge key={index} variant="default">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewQuestion(bookmark)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteBookmark(bookmark.questionId)}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete bookmark"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Question Detail Modal */}
      <QuestionDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        question={selectedQuestion}
        onDelete={handleDeleteBookmark}
        onPractice={practiceQuestion}
      />

      {/* Custom styles */}
      <style>{`
        @keyframes modal-enter {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-modal-enter {
          animation: modal-enter 0.2s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default BookmarksPage;