import React, { useState } from 'react';

const HomePage = ({ onStartQuiz }) => {
    const [activeTab, setActiveTab] = useState('continue'); // 'continue' or 'bookmarks'
    
    // Minimal sample data
    const pausedQuiz = {
        title: "React Advanced Concepts",
        progress: 60,
        questionsLeft: 4
    };

    return (
        <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
            {/* Subtle Background Elements */}
            <div className="absolute inset-0 -z-10 opacity-50">
                <div className="absolute top-1/3 -left-20 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 -right-20 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl"></div>
            </div>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center py-12">
                
                {/* Simple Header */}
                <div className="text-center mb-16 animate-fade-in">
                    <h1 className="text-5xl sm:text-6xl font-display font-bold tracking-tight mb-4">
                        <span className="text-slate-800">Welcome back</span>
                        <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">.</span>
                    </h1>
                    <p className="text-lg text-slate-500">What would you like to learn today?</p>
                </div>

                {/* Main Action - Start Quiz */}
                <div className="flex justify-center mb-20 animate-fade-in-up">
                    <button 
                        onClick={onStartQuiz}
                        className="group relative px-12 py-6 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-amber-100/50"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="relative flex items-center space-x-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors duration-500">
                                <svg className="w-7 h-7 text-amber-700 group-hover:text-white transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                            </svg>
                        </div>
                    </button>
                </div>

                {/* Secondary Section - Minimal Tabs */}
                <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                    {/* Tab Headers */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex p-1 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20">
                            <button
                                onClick={() => setActiveTab('continue')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    activeTab === 'continue' 
                                        ? 'bg-white text-amber-700 shadow-md' 
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Continue Learning
                            </button>
                            <button
                                onClick={() => setActiveTab('bookmarks')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    activeTab === 'bookmarks' 
                                        ? 'bg-white text-amber-700 shadow-md' 
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Bookmarks
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="max-w-2xl mx-auto">
                        {activeTab === 'continue' ? (
                            // Paused Quiz - Single, Clean Card
                            pausedQuiz ? (
                                <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 border border-white/50 hover:scale-[1.02]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-2">{pausedQuiz.title}</h3>
                                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                                                <span>{pausedQuiz.questionsLeft} questions left</span>
                                                <span>•</span>
                                                <span>{pausedQuiz.progress}% complete</span>
                                            </div>
                                            
                                            {/* Simple Progress Bar */}
                                            <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
                                                <div 
                                                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all duration-700"
                                                    style={{width: `${pausedQuiz.progress}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                        
                                        <button className="ml-6 p-3 bg-amber-50 hover:bg-amber-100 rounded-xl text-amber-700 transition-all duration-300 group-hover:scale-110">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                    </svg>
                                    <p className="text-sm">No quizzes in progress</p>
                                </div>
                            )
                        ) : (
                            // Bookmarks - Simple List
                            <div className="space-y-3">
                                {[1, 2].map((item) => (
                                    <div key={item} className="group bg-white/60 backdrop-blur-sm rounded-xl p-4 hover:bg-white/80 transition-all duration-300 border border-white/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">React Hooks Guide</p>
                                                    <p className="text-sm text-slate-500">Saved 2 days ago</p>
                                                </div>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 text-amber-600 hover:text-amber-700 transition-all duration-300">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Subtle Recommendation */}
                <div className="mt-16 text-center animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                    <p className="text-sm text-slate-400 mb-2">Recommended for you</p>
                    <button className="text-amber-600 hover:text-amber-700 font-medium transition-colors duration-300 inline-flex items-center group">
                        <span>Advanced React Patterns</span>
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
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