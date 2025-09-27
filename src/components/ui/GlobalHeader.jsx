import React, { useState } from 'react';

// Centralized icon management function for consistency
const getIcon = (iconName, isActive = false) => {
    const className = `w-5 h-5 transition-colors ${isActive ? 'text-amber-600' : 'text-slate-500'}`;
    const desktopClassName = `w-5 h-5 transition-colors ${isActive ? 'text-amber-700' : 'text-slate-600'}`;
    const mobileMenuClassName = `w-6 h-6 text-gray-600`;
    const userIconClassName = `w-5 h-5 text-gray-600`;

    switch (iconName) {
        case 'home':
            return (
                <svg className={isActive ? className : desktopClassName} fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            );
        case 'bookmark':
            return (
                <svg className={isActive ? className : desktopClassName} fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
            );
        case 'pause':
            return (
                <svg className={isActive ? className : desktopClassName} fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        case 'plus':
            return (
                <svg className={isActive ? className : desktopClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
            );
        case 'menu':
            return (
                <svg className={mobileMenuClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            );
        case 'user':
             return (
                <svg className={userIconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            );
        default:
            return null;
    }
};

const GlobalHeader = ({ userName, currentPage = 'home', onNavigate }) => {
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Restored navigation items from the original code
    const navigationItems = [
        { id: 'home', label: 'Home', icon: 'home', action: () => onNavigate('home') },
        { id: 'bookmarks', label: 'Bookmarks', icon: 'bookmark', action: () => onNavigate('bookmarks') },
        { id: 'paused', label: 'Paused', icon: 'pause', action: () => onNavigate('paused') },
        { id: 'quiz', label: 'New Quiz', icon: 'plus', action: () => onNavigate('home', { openQuizSetup: true }) },
    ];

    return (
        <>
            <header className="fixed h-[4rem] top-4 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-max">
                {/* The main floating "island" container */}
                <div className="bg-white/80 backdrop-blur-lg h-full rounded-[1.25rem] shadow-lg flex items-center justify-between p-2">
                    {/* Logo - always visible */}
                    <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="flex items-center space-x-2.5 pl-3 pr-2 flex-shrink-0">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-sm">EB</span>
                            </div>
                        </div>
                        <span className="font-bold text-xl text-gray-800">Buddy</span>
                    </a>

                    {/* Right-side container for nav and actions */}
                    <div className="flex items-center">
                        
                        {/* Large Screen Navigation (lg and up) - Icons and Text */}
                        <nav className="hidden lg:flex items-center space-x-1 border-l border-gray-200 ml-2 pl-2">
                            {navigationItems.map((item) => {
                                const isActive = currentPage === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={item.action}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                            isActive
                                                ? 'bg-amber-100 text-amber-700 shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                        }`}
                                    >
                                        {getIcon(item.icon, isActive)}
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                        
                        {/* Medium Screen Navigation (md to lg) - Icons Only */}
                        <nav className="hidden md:flex lg:hidden items-center space-x-1 border-l border-gray-200 ml-2 pl-2">
                             {navigationItems.map((item) => {
                                const isActive = currentPage === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={item.action}
                                        aria-label={item.label}
                                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                                            isActive
                                                ? 'bg-amber-100 text-amber-700 shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {getIcon(item.icon, isActive)}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* User Profile Icon (md and up) */}
                        <div className="hidden md:flex items-center pl-3 pr-1">
                            <button
                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                                aria-label={userName ? `Profile: ${userName}` : 'Profile'}
                            >
                                {userName ? (
                                    <span className="font-semibold text-gray-700 uppercase">
                                        {userName.charAt(0)}
                                    </span>
                                ) : (
                                    getIcon('user')
                                )}
                            </button>
                        </div>

                        {/* Mobile Menu Button (sm and down) */}
                        <div className="md:hidden">
                            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
                                {getIcon('menu')}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay & Dropdown */}
            {showMobileMenu && (
                <div
                    className="fixed inset-0 z-30 bg-black/10 backdrop-blur-sm"
                    onClick={() => setShowMobileMenu(false)}
                    aria-hidden="true"
                >
                    <div
                        className="fixed top-24 left-4 right-4 z-40 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/80 p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <nav className="flex flex-col space-y-2">
                            {navigationItems.map((item) => {
                                const isActive = currentPage === item.id;
                                return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        item.action();
                                        setShowMobileMenu(false);
                                    }}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-base font-medium transition-colors ${
                                        isActive
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {getIcon(item.icon, isActive)}
                                    <span>{item.label}</span>
                                </button>
                            )})}

                            <div className="border-t border-gray-200 pt-4 mt-2">
                                <button
                                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-base font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    {userName ? (
                                        <>
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="font-semibold text-gray-700 uppercase">{userName.charAt(0)}</span>
                                            </div>
                                            <span>{userName}</span>
                                        </>
                                    ) : (
                                        <>
                                            {getIcon('user')}
                                            <span>Log In / Profile</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
};

export default GlobalHeader;