import React, { useState } from 'react';

const ResultPage = ({ 
    score = 85, 
    totalQuestions = 10, 
    correctAnswers = 8,
    timeSpent = "12:34",
    onNewQuiz,
    onRetryQuiz 
}) => {
    const [showDetails, setShowDetails] = useState(false);
    
    // Calculate performance level
    const getPerformanceLevel = () => {
        if (score >= 90) return { text: "Outstanding!", color: "from-green-500 to-emerald-500" };
        if (score >= 75) return { text: "Great job!", color: "from-amber-500 to-orange-500" };
        if (score >= 60) return { text: "Good effort!", color: "from-blue-500 to-indigo-500" };
        return { text: "Keep practicing!", color: "from-purple-500 to-pink-500" };
    };

    const performance = getPerformanceLevel();

    return (
        <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
            {/* Subtle Background Elements */}
            <div className="absolute inset-0 -z-10 opacity-40">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl"></div>
            </div>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center py-12">
                
                {/* Score Display - Hero Section */}
                <div className="text-center mb-12 animate-fade-in">
                    {/* Animated Score Circle */}
                    <div className="relative inline-flex items-center justify-center mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 to-orange-200/20 rounded-full blur-2xl animate-pulse-slow"></div>
                        
                        <div className="relative bg-white rounded-full w-48 h-48 shadow-2xl flex flex-col items-center justify-center border border-amber-100/50">
                            <div className={`text-6xl font-bold bg-gradient-to-r ${performance.color} bg-clip-text text-transparent animate-scale-in`}>
                                {score}%
                            </div>
                            <p className="text-slate-500 text-sm mt-1">{correctAnswers}/{totalQuestions} correct</p>
                        </div>
                        
                        {/* Decorative Ring */}
                        <svg className="absolute inset-0 w-48 h-48 animate-rotate-slow">
                            <circle
                                cx="96"
                                cy="96"
                                r="94"
                                stroke="url(#gradient)"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray={`${score * 5.9} 590`}
                                strokeLinecap="round"
                                className="transform -rotate-90 origin-center"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#ea580c" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight mb-3">
                        <span className={`bg-gradient-to-r ${performance.color} bg-clip-text text-transparent`}>
                            {performance.text}
                        </span>
                    </h1>
                    <p className="text-lg text-slate-600">You've completed the quiz in {timeSpent}</p>
                </div>

                {/* Quick Stats - Minimal Cards */}
                <div className="grid grid-cols-3 gap-4 mb-12 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/50 hover:scale-105 transition-transform duration-300">
                        <div className="text-2xl font-bold text-amber-600">{correctAnswers}</div>
                        <p className="text-sm text-slate-500 mt-1">Correct</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/50 hover:scale-105 transition-transform duration-300">
                        <div className="text-2xl font-bold text-slate-400">{totalQuestions - correctAnswers}</div>
                        <p className="text-sm text-slate-500 mt-1">Incorrect</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/50 hover:scale-105 transition-transform duration-300">
                        <div className="text-2xl font-bold text-blue-600">{timeSpent}</div>
                        <p className="text-sm text-slate-500 mt-1">Time</p>
                    </div>
                </div>

                {/* AI Feedback - Clean Card */}
                <div className="mb-12 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                        <div className="flex items-start space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 mb-2">AI Evaluation</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    You showed strong understanding of React concepts, particularly in hooks and component lifecycle. 
                                    Consider reviewing state management patterns for even better results.
                                </p>
                                
                                {/* Expandable Details */}
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="mt-3 text-amber-600 hover:text-amber-700 text-sm font-medium inline-flex items-center transition-colors duration-300"
                                >
                                    {showDetails ? 'Hide' : 'Show'} detailed analysis
                                    <svg className={`w-4 h-4 ml-1 transform transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                                    </svg>
                                </button>
                                
                                {showDetails && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 animate-fade-in">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Strong areas:</span>
                                            <span className="text-green-600 font-medium">Hooks, Components</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Needs practice:</span>
                                            <span className="text-amber-600 font-medium">State Management</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Primary & Secondary */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                    <button 
                        onClick={onNewQuiz}
                        className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
                    >
                        <span className="flex items-center justify-center font-semibold">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                            Take New Quiz
                        </span>
                    </button>
                    
                    <button 
                        onClick={onRetryQuiz}
                        className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-slate-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 border border-amber-100/50"
                    >
                        <span className="flex items-center justify-center font-semibold">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            Retry Quiz
                        </span>
                    </button>
                </div>

                {/* Recommendations - Subtle Section */}
                <div className="animate-fade-in-up" style={{animationDelay: '0.5s'}}>
                    <h3 className="text-center text-sm font-medium text-slate-500 mb-6">Recommended next steps</h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <button className="group bg-white/60 backdrop-blur-sm rounded-xl p-4 hover:bg-white/80 transition-all duration-300 border border-white/50 text-left">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 text-sm">State Management Deep Dive</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Build on your knowledge</p>
                                </div>
                            </div>
                        </button>
                        
                        <button className="group bg-white/60 backdrop-blur-sm rounded-xl p-4 hover:bg-white/80 transition-all duration-300 border border-white/50 text-left">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 text-sm">React Best Practices Guide</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Recommended reading</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Share or Save - Minimal Footer Actions */}
                <div className="mt-12 flex justify-center space-x-4 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                    <button className="text-slate-400 hover:text-amber-600 transition-colors duration-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326"/>
                    </svg>
                </button>
                    <button className="text-slate-400 hover:text-amber-600 transition-colors duration-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                        </svg>
                    </button>
                    <button className="text-slate-400 hover:text-amber-600 transition-colors duration-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                    </button>
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
                
                @keyframes scaleIn {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                
                @keyframes rotateSlow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes pulseSlow {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.6; }
                }
                
                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out;
                }
                
                .animate-fade-in-up {
                    animation: fadeInUp 0.8s ease-out both;
                }
                
                .animate-scale-in {
                    animation: scaleIn 0.6s ease-out;
                }
                
                .animate-rotate-slow {
                    animation: rotateSlow 20s linear infinite;
                }
                
                .animate-pulse-slow {
                    animation: pulseSlow 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default ResultPage;