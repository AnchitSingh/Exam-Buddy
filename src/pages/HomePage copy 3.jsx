import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import QuizSetupModal from '../components/quiz/QuizSetupModal';
import examBuddyAPI from '../services/api';
import { extractFromCurrentPage, extractFromPDFResult, normalizeManualTopic } from '../utils/contentExtractor';
import { extractTextFromPDF } from '../utils/pdfExtractor';
import { SOURCE_TYPE } from '../utils/messages';

const HomePage = ({ onNavigate, navigationData }) => {
    const [showQuizSetup, setShowQuizSetup] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [pausedQuizzes, setPausedQuizzes] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredTab, setHoveredTab] = useState(null);
    const [sliderPosition, setSliderPosition] = useState({ left: 0, width: 0 });
    const [displayContent, setDisplayContent] = useState('continue'); // For showing content preview
    const tabRefs = useRef({});

    const tabs = [
        { id: 'continue', label: 'Continue Learning', path: 'paused', icon: 'play' },
        { id: 'bookmarks', label: 'Bookmarks', path: 'bookmarks', icon: 'bookmark' },
        { id: 'stories', label: 'Stories', path: 'stories', icon: 'book' }
    ];

    useEffect(() => {
        if (navigationData?.openQuizSetup) {
            setShowQuizSetup(true);
        }
    }, [navigationData]);

    useEffect(() => {
        let mounted = true;

        const loadUserData = async () => {
            try {
                setIsLoading(true);
                const [profileResponse, pausedResponse, bookmarksResponse] = await Promise.all([
                    examBuddyAPI.getUserProfile(),
                    examBuddyAPI.getPausedQuizzes(),
                    examBuddyAPI.getBookmarks()
                ]);

                if (mounted) {
                    if (profileResponse.success) {
                        setUserProfile(profileResponse.data);
                    }

                    if (pausedResponse.success) {
                        setPausedQuizzes(pausedResponse.data);
                    }

                    if (bookmarksResponse.success) {
                        setBookmarks(bookmarksResponse.data);
                    }
                }
            } catch (err) {
                console.error('Error loading user data:', err);
                if (mounted) {
                    toast.error('Unable to load your data. Using offline mode.');
                    // Fallback data for demo purposes
                    setPausedQuizzes([
                        {
                            id: 'demo1',
                            title: "React Advanced Concepts",
                            progress: 60,
                            questionsLeft: 4,
                            totalQuestions: 10,
                            lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000)
                        },
                        {
                            id: 'demo2',
                            title: "JavaScript Design Patterns",
                            progress: 30,
                            questionsLeft: 7,
                            totalQuestions: 10,
                            lastAccessed: new Date(Date.now() - 24 * 60 * 60 * 1000)
                        }
                    ]);
                    setBookmarks([
                        { id: 'b1', title: 'React Hooks Guide', savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
                        { id: 'b2', title: 'State Management Patterns', savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
                    ]);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        loadUserData();
        return () => { mounted = false; };
    }, []);

    const handleTabHover = (tabId) => {
        setHoveredTab(tabId);
        const element = tabRefs.current[tabId];
        if (element) {
            setSliderPosition({
                left: element.offsetLeft,
                width: element.offsetWidth
            });
        }
    };

    const handleTabClick = (tab) => {
        setDisplayContent(tab.id);
        // Navigate after a short delay to show the animation
        setTimeout(() => {
            onNavigate(tab.path);
        }, 150);
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
            toast.success('Generating your quiz...');
            onNavigate('quiz', { quizConfig: finalQuizConfig });

        } catch (error) {
            console.error('Failed to prepare quiz source:', error);
            toast.error('Failed to prepare quiz source');
        }
    };

    const handleContinueQuiz = (quizId) => {
        const quiz = pausedQuizzes.find(q => q.id === quizId);
        if (quiz) {
            toast.success(`Resuming: ${quiz.title}`);
            onNavigate('quiz', { resumeQuizId: quizId });
        }
    };

    const handleOpenBookmark = (bookmarkId) => {
        const bookmark = bookmarks.find(b => b.id === bookmarkId);
        if (bookmark) {
            toast.success(`Opening: ${bookmark.title}`);
            onNavigate('quiz', { bookmarkId: bookmarkId });
        }
    };

    const formatTimeAgo = (date) => {
        const now = Date.now();
        const then = new Date(date).getTime();
        const seconds = Math.floor((now - then) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return new Date(date).toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
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
            {/* Enhanced Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-br from-amber-300/20 to-orange-300/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-br from-orange-300/20 to-amber-300/20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
                <div className="absolute top-3/4 left-1/2 w-72 h-72 bg-gradient-to-br from-amber-200/10 to-orange-200/10 rounded-full blur-3xl animate-pulse-slow animation-delay-4000" />
            </div>

            <main className="mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center py-12 relative z-10">
                <div className="min-h-[70vh] flex flex-col justify-center">
                {/* Header Section */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-5xl sm:text-6xl font-display font-bold tracking-tight mb-4">
                        <span className="text-slate-800">Welcome back{userProfile?.name ? `, ${userProfile.name}` : ''}</span>
                        <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">.</span>
                    </h1>
                    <p className="text-lg text-slate-500">What would you like to learn today?</p>
                </div>

                {/* Main CTA Button */}
                <div className="flex justify-center mb-12 animate-fade-in-up">
                    <button
                        onClick={() => setShowQuizSetup(true)}
                        className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl shadow-xl shadow-amber-600/25 hover:shadow-amber-600/40 hover:scale-105 transform transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 min-h-[3rem]"
                    >
                        Start New Quiz
                    </button>
                </div>
                </div>
                {/* Recommendation Section */}
                <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
    <div className="overflow-hidden w-full">
        <div className="flex gap-12 animate-scroll-horizontal">
            {/* First set of cards */}
            <div className="group relative w-64 h-64 p-[0.65rem] bg-white rounded-[3.65rem] shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-100/50 overflow-hidden transform hover:scale-[1.02] z-10 flex-shrink-0">
                <div className="w-full h-44 bg-[rgb(255_251_241_/_72%)] rounded-[3rem]">
                    <img
                        alt="Quiz mascot"
                        src="assets/i4.png"
                        className="h-[112%] mx-auto"
                    />
                    <h6 className="text-[1.2rem] font-[700] text-[#68634e]">
                        Grandpa Stories
                    </h6>
                </div>
            </div>
            
            <div className="group relative w-64 h-64 p-[0.65rem] bg-white rounded-[3.65rem] shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-100/50 overflow-hidden transform hover:scale-[1.02] z-10 flex-shrink-0">
                <div className="w-full h-44 bg-[rgb(255_251_241_/_72%)] rounded-[3rem]">
                    <img
                        alt="Quiz mascot"
                        src="assets/i4.png"
                        className="h-[112%] mx-auto"
                    />
                    <h6 className="text-[1.2rem] font-[700] text-[#68634e]">
                        Math Wizard
                    </h6>
                </div>
            </div>
            
            <div className="group relative w-64 h-64 p-[0.65rem] bg-white rounded-[3.65rem] shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-100/50 overflow-hidden transform hover:scale-[1.02] z-10 flex-shrink-0">
                <div className="w-full h-44 bg-[rgb(255_251_241_/_72%)] rounded-[3rem]">
                    <img
                        alt="Quiz mascot"
                        src="assets/i4.png"
                        className="h-[112%] mx-auto"
                    />
                    <h6 className="text-[1.2rem] font-[700] text-[#68634e]">
                        Science Explorer
                    </h6>
                </div>
            </div>

            {/* Duplicate set for seamless loop */}
            <div className="group relative w-64 h-64 p-[0.65rem] bg-white rounded-[3.65rem] shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-100/50 overflow-hidden transform hover:scale-[1.02] z-10 flex-shrink-0">
                <div className="w-full h-44 bg-[rgb(255_251_241_/_72%)] rounded-[3rem]">
                    <img
                        alt="Quiz mascot"
                        src="assets/i4.png"
                        className="h-[112%] mx-auto"
                    />
                    <h6 className="text-[1.2rem] font-[700] text-[#68634e]">
                        Grandpa Stories
                    </h6>
                </div>
            </div>
            
            <div className="group relative w-64 h-64 p-[0.65rem] bg-white rounded-[3.65rem] shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-100/50 overflow-hidden transform hover:scale-[1.02] z-10 flex-shrink-0">
                <div className="w-full h-44 bg-[rgb(255_251_241_/_72%)] rounded-[3rem]">
                    <img
                        alt="Quiz mascot"
                        src="assets/i4.png"
                        className="h-[112%] mx-auto"
                    />
                    <h6 className="text-[1.2rem] font-[700] text-[#68634e]">
                        Math Wizard
                    </h6>
                </div>
            </div>
            
            <div className="group relative w-64 h-64 p-[0.65rem] bg-white rounded-[3.65rem] shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-100/50 overflow-hidden transform hover:scale-[1.02] z-10 flex-shrink-0">
                <div className="w-full h-44 bg-[rgb(255_251_241_/_72%)] rounded-[3rem]">
                    <img
                        alt="Quiz mascot"
                        src="assets/i4.png"
                        className="h-[112%] mx-auto"
                    />
                    <h6 className="text-[1.2rem] font-[700] text-[#68634e]">
                        Science Explorer
                    </h6>
                </div>
            </div>
        </div>
    </div>
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
            @keyframes scroll-horizontal {
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(-50%);
    }
}

.animate-scroll-horizontal {
    animation: scroll-horizontal 20s linear infinite;
}

.animate-scroll-horizontal:hover {
    animation-play-state: paused;
}
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          0% { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        @keyframes pulse-slow {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.5; 
            transform: scale(1.05); 
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out both;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </div>
    );
};

export default HomePage;