import React, { useState, useEffect } from 'react';

const QuizPage = ({
    currentQuestion = 1,
    totalQuestions = 10,
    questionType = 'mcq', // 'mcq', 'trueFalse', 'fillUp', 'subjective'
    question = "What is the primary purpose of React's useEffect hook?",
    options = [
        "To manage component state",
        "To perform side effects in function components",
        "To optimize component performance",
        "To handle user events"
    ],
    onAnswer,
    onPause,
    onStop,
    onNext,
    onBookmark,
    onHint
}) => {
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [textAnswer, setTextAnswer] = useState('');
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [showStopModal, setShowStopModal] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [questionTime, setQuestionTime] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [showMobileNav, setShowMobileNav] = useState(false);

    // Timer logic
    useEffect(() => {
        const interval = setInterval(() => {
            setQuestionTime(prev => prev + 1);
            setTotalTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [currentQuestion]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Helper function to check if an answer is selected
    const hasAnswer = () => {
        if (questionType === 'mcq' || questionType === 'trueFalse') {
            return selectedAnswer !== null;
        }
        return textAnswer.trim() !== '';
    };

    // Render different question types
    const renderQuestionContent = () => {
        switch (questionType) {
            case 'mcq':
                return (
                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedAnswer(index)}
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                                    selectedAnswer === index
                                        ? 'border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg scale-[1.02]'
                                        : 'border-white/50 bg-white/60 hover:border-amber-200 hover:bg-white/80'
                                } backdrop-blur-sm`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                        selectedAnswer === index
                                            ? 'border-amber-500 bg-amber-500'
                                            : 'border-slate-300'
                                    }`}>
                                        {selectedAnswer === index && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`text-base ${selectedAnswer === index ? 'text-amber-700 font-medium' : 'text-slate-700'}`}>
                                        {option}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                );

            case 'trueFalse':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setSelectedAnswer('true')}
                            className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                                selectedAnswer === 'true'
                                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg scale-[1.02]'
                                    : 'border-white/50 bg-white/60 hover:border-green-200 hover:bg-white/80'
                            } backdrop-blur-sm`}
                        >
                            <svg className="w-10 h-10 mx-auto mb-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            <span className={`text-lg ${selectedAnswer === 'true' ? 'text-green-700 font-semibold' : 'text-slate-700'}`}>
                                True
                            </span>
                        </button>
                        
                        <button
                            onClick={() => setSelectedAnswer('false')}
                            className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                                selectedAnswer === 'false'
                                    ? 'border-red-500 bg-gradient-to-br from-red-50 to-pink-50 shadow-lg scale-[1.02]'
                                    : 'border-white/50 bg-white/60 hover:border-red-200 hover:bg-white/80'
                            } backdrop-blur-sm`}
                        >
                            <svg className="w-10 h-10 mx-auto mb-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            <span className={`text-lg ${selectedAnswer === 'false' ? 'text-red-700 font-semibold' : 'text-slate-700'}`}>
                                False
                            </span>
                        </button>
                    </div>
                );

            case 'fillUp':
                return (
                    <div className="space-y-4">
                        <p className="text-lg text-slate-700 leading-relaxed">
                            React's <input
                                type="text"
                                value={textAnswer}
                                onChange={(e) => setTextAnswer(e.target.value)}
                                placeholder="your answer"
                                className="inline-block mx-2 px-4 py-2 bg-white/80 backdrop-blur-sm border-b-2 border-amber-400 focus:border-amber-600 outline-none rounded-lg min-w-[150px] text-center font-medium text-amber-700 placeholder-amber-300"
                            /> hook is used to perform side effects.
                        </p>
                    </div>
                );

            case 'subjective':
                return (
                    <textarea
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full p-4 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-2xl focus:border-amber-400 outline-none resize-none h-40 text-slate-700 placeholder-slate-400"
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10 opacity-30">
                <div className="absolute top-1/3 -left-20 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 -right-20 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl"></div>
            </div>

            {/* Enhanced Header */}
            <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-amber-100/50 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        {/* Left: Progress and Question Number */}
                        <div className="flex items-center space-x-4 sm:space-x-6">
                            {/* Logo/Icon */}
                            <div className="hidden sm:block w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                            </div>
                            
                            {/* Progress Info */}
                            <div className="flex-1 sm:flex-none">
                                <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                                    <span className="text-xs sm:text-sm font-medium text-slate-600">Question</span>
                                    <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                        {currentQuestion}
                                    </span>
                                    <span className="text-xs sm:text-sm text-slate-500">of {totalQuestions}</span>
                                </div>
                                <div className="w-32 sm:w-48 bg-slate-200/50 rounded-full h-1.5 sm:h-2">
                                    <div 
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500 shadow-sm"
                                        style={{width: `${(currentQuestion / totalQuestions) * 100}%`}}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Center: Timers - Hidden on smallest screens */}
                        <div className="hidden md:flex items-center space-x-8">
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-md border border-white/50">
                                <p className="text-xs text-slate-500 text-center mb-1">Question Time</p>
                                <p className="text-xl font-mono font-bold text-amber-700">{formatTime(questionTime)}</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-md border border-white/50">
                                <p className="text-xs text-slate-500 text-center mb-1">Total Time</p>
                                <p className="text-xl font-mono font-bold text-slate-700">{formatTime(totalTime)}</p>
                            </div>
                        </div>

                        {/* Right: Control Buttons - Now with text on mobile too */}
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <button
                                onClick={() => setShowPauseModal(true)}
                                className="group flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/80 backdrop-blur-sm border-2 border-amber-200/50 text-amber-700 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span className="text-xs sm:text-base font-medium">Pause</span>
                            </button>
                            <button
                                onClick={() => setShowStopModal(true)}
                                className="group flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/80 backdrop-blur-sm border-2 border-red-200/50 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                                </svg>
                                <span className="text-xs sm:text-base font-medium">Stop</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Timer Bar - Shows on mobile only */}
                <div className="md:hidden px-4 pb-3">
                    <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-xl px-3 py-2">
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span className="text-xs text-slate-600">Question: <span className="font-mono font-bold text-amber-700">{formatTime(questionTime)}</span></span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span className="text-xs text-slate-600">Total: <span className="font-mono font-bold text-slate-700">{formatTime(totalTime)}</span></span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Question Navigation - Horizontal Scrollable */}
            <div className="lg:hidden px-4 pt-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-md border border-white/50">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-slate-700">Question Navigator</h3>
                        <button
                            onClick={() => setShowMobileNav(!showMobileNav)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <svg className={`w-5 h-5 transform transition-transform ${showMobileNav ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                    </div>
                    
                    {showMobileNav && (
                        <div className="animate-fade-in">
                            <div className="overflow-x-auto pb-2">
                                <div className="flex space-x-2 min-w-max">
                                    {[...Array(totalQuestions)].map((_, idx) => {
                                        const questionNumber = idx + 1;
                                        const isActive = questionNumber === currentQuestion;
                                        const isAnswered = questionNumber < currentQuestion;
                                        
                                        return (
                                            <button
                                                key={idx}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300 flex-shrink-0 ${
                                                    isActive 
                                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md scale-110' 
                                                        : isAnswered
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                            >
                                                {questionNumber}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {/* Compact Legend */}
                            <div className="flex items-center justify-center space-x-4 mt-2 text-xs">
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded"></div>
                                    <span className="text-slate-600">Current</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                                    <span className="text-slate-600">Answered</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-slate-50 border border-slate-200 rounded"></div>
                                    <span className="text-slate-600">Pending</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {!showMobileNav && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">
                                {currentQuestion - 1} answered • {totalQuestions - currentQuestion + 1} remaining
                            </span>
                            <span className="text-xs font-medium text-amber-600">
                                {Math.round((currentQuestion / totalQuestions) * 100)}% complete
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Quiz Content - Better Layout */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-6 animate-fade-in-up">
                        {/* Question Card */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6 sm:p-8">
                            {/* Question Header with Actions */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-xs sm:text-sm font-medium rounded-full">
                                            {questionType === 'mcq' ? 'Multiple Choice' : 
                                             questionType === 'trueFalse' ? 'True/False' :
                                             questionType === 'fillUp' ? 'Fill in the Blank' : 'Essay'}
                                        </span>
                                    </div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 leading-relaxed">
                                        {question}
                                    </h2>
                                </div>
                                <div className="flex items-center space-x-1 ml-4">
                                    <button
                                        onClick={() => setIsBookmarked(!isBookmarked)}
                                        className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 ${
                                            isBookmarked 
                                                ? 'text-amber-600 bg-amber-50 shadow-md' 
                                                : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                        }`}
                                    >
                                        <svg className="w-4 sm:w-5 h-4 sm:h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setShowHint(!showHint)}
                                        className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
                                    >
                                        <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Hint Box */}
                            {showHint && (
                                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl animate-fade-in">
                                    <div className="flex items-start space-x-2">
                                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                        <p className="text-sm text-blue-700">
                                            <span className="font-semibold">Hint:</span> Think about what happens after a component renders and needs to interact with external systems...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Question Content */}
                            <div className="mb-8">
                                {renderQuestionContent()}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                                <button className="text-slate-400 hover:text-slate-600 font-medium transition-colors duration-300 order-2 sm:order-1">
                                    Skip Question →
                                </button>
                                
                                <button
                                    onClick={onNext}
                                    disabled={!hasAnswer()}
                                    className={`px-6 sm:px-8 py-3 rounded-2xl font-semibold transition-all duration-300 transform order-1 sm:order-2 w-full sm:w-auto ${
                                        hasAnswer()
                                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    {currentQuestion === totalQuestions ? 'Finish Quiz' : 'Next Question'} →
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Sidebar - Question Navigation */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 sticky top-24">
                            <h3 className="font-semibold text-slate-900 mb-4">Questions</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[...Array(totalQuestions)].map((_, idx) => {
                                    const questionNumber = idx + 1;
                                    const isActive = questionNumber === currentQuestion;
                                    const isAnswered = questionNumber < currentQuestion;
                                    
                                    return (
                                        <button
                                            key={idx}
                                            className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                                                isActive 
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md scale-110' 
                                                    : isAnswered
                                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200'
                                            }`}
                                        >
                                            {questionNumber}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {/* Legend */}
                            <div className="mt-6 space-y-2 text-xs">
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded"></div>
                                    <span className="text-slate-600">Current</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                                    <span className="text-slate-600">Answered</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-slate-50 border border-slate-200 rounded"></div>
                                    <span className="text-slate-600">Not Visited</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Pause Modal */}
            {showPauseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowPauseModal(false)}></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full animate-scale-in">
                        <div className="text-center">
                            <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 sm:w-8 h-7 sm:h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Pause Quiz?</h3>
                            <p className="text-sm sm:text-base text-slate-600 mb-6">Your progress will be saved and you can continue later.</p>
                            
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowPauseModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors duration-300 font-medium text-sm sm:text-base"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onPause}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium text-sm sm:text-base"
                                >
                                    Yes, Pause
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stop Modal */}
            {showStopModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowStopModal(false)}></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full animate-scale-in">
                        <div className="text-center">
                            <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 sm:w-8 h-7 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Stop Quiz?</h3>
                            <p className="text-sm sm:text-base text-slate-600 mb-6">Your progress will be lost and you'll need to start over.</p>
                            
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowStopModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors duration-300 font-medium text-sm sm:text-base"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onStop}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-300 font-medium text-sm sm:text-base"
                                >
                                    Yes, Stop
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out;
                }
                
                .animate-scale-in {
                    animation: scaleIn 0.3s ease-out;
                }
                
                /* Hide scrollbar but keep functionality */
                .overflow-x-auto::-webkit-scrollbar {
                    height: 4px;
                }
                
                .overflow-x-auto::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                
                .overflow-x-auto::-webkit-scrollbar-thumb {
                    background: #fbbf24;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default QuizPage;