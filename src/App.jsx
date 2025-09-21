import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import BookmarksPage from './pages/BookmarksPage';
import PausedQuizzesPage from './pages/PausedQuizzesPage';
import './index.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState(() => {
    const hasVisited = localStorage.getItem('exambuddy_visited');
    return hasVisited ? 'home' : 'landing';
  });
  
  const [navigationData, setNavigationData] = useState(null); // Store navigation data
  const [hasInitialized, setHasInitialized] = useState(false);

  React.useEffect(() => {
    if (hasInitialized) return;
    
    console.log('=== EXAM BUDDY INIT ===');
    const hasVisited = localStorage.getItem('exambuddy_visited');
    console.log('hasVisited:', hasVisited);
    
    if (!hasVisited) {
      console.log('First time user - showing landing');
      setCurrentPage('landing');
    } else {
      console.log('Returning user - showing home');
      setCurrentPage('home');
    }
    
    setHasInitialized(true);
  }, [hasInitialized]);

  const navigateTo = (page, data = null) => {
    console.log('Navigating from', currentPage, 'to', page, data ? 'with data' : '');
    
    if (currentPage === 'landing' && page === 'home') {
      localStorage.setItem('exambuddy_visited', 'true');
      console.log('Marked user as visited');
    }
    
    // Store navigation data
    setNavigationData(data);
    setCurrentPage(page);
  };

  const resetApp = () => {
    localStorage.removeItem('exambuddy_visited');
    setHasInitialized(false);
    setCurrentPage('landing');
    setNavigationData(null);
    console.log('App reset - cleared localStorage');
  };

  return (
    <>
      {/* Debug Controls - Remove for production */}
      <div className="fixed top-2 right-2 z-50 bg-black/80 text-white p-2 rounded text-xs">
        <div>Page: <strong>{currentPage}</strong></div>
        <div>Visited: {localStorage.getItem('exambuddy_visited') || 'null'}</div>
        <div>Data: {navigationData ? 'Yes' : 'No'}</div>
        <button onClick={resetApp} className="bg-red-500 px-2 py-1 rounded mt-1 text-xs">
          Reset App
        </button>
      </div>
      
      {currentPage === 'landing' && (
        <LandingPage onGetStarted={() => navigateTo('home')} />
      )}
      
      {currentPage === 'home' && (
        <HomePage onNavigate={navigateTo} />
      )}
      
      {currentPage === 'quiz' && (
        <QuizPage 
          onNavigate={navigateTo} 
          quizConfig={navigationData?.quizConfig}
        />
      )}
      
      {currentPage === 'bookmarks' && (
        <BookmarksPage onNavigate={navigateTo} />
      )}
      
      {currentPage === 'paused' && (
        <PausedQuizzesPage onNavigate={navigateTo} />
      )}
    </>
  );
};

export default App;
