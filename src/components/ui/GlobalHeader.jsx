import React, { useState } from 'react';

// Tooltip Component
const Tooltip = ({ children, content }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
        <div 
            className="relative group"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <div 
                className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg transition-opacity duration-200 z-50 ${
                    isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
            >
                {content}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800"></div>
            </div>
        </div>
    );
};

// Centralized icon management function for consistency
const getIcon = (iconName, isActive = false) => {
    const className = `w-5 h-5 transition-colors ${isActive ? 'text-amber-600' : 'text-slate-500'}`;
    const desktopClassName = `w-5 h-5 transition-colors ${isActive ? 'text-amber-700' : 'text-slate-600'}`;
    const mobileMenuClassName = `w-6 h-6 text-gray-600`;
    const userIconClassName = `w-5 h-5 text-gray-600`;

    switch (iconName) {
        case 'home':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" color="#000000" fill="none">
                    <path d="M2 10L11.1076 2.80982C11.3617 2.60915 11.6761 2.5 12 2.5C12.3239 2.5 12.6383 2.60915 12.8924 2.80982L16.5 5.65789V4C16.5 3.44772 16.9477 3 17.5 3H18.5C19.0523 3 19.5 3.44771 19.5 4V8.02632L22 10" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 11.5V15.5C20 18.3284 20 19.7426 19.1213 20.6213C18.2426 21.5 16.8284 21.5 14 21.5H10C7.17157 21.5 5.75736 21.5 4.87868 20.6213C4 19.7426 4 18.3284 4 15.5V11.5" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15.0011 15.5C14.2016 16.1224 13.1513 16.5 12.0011 16.5C10.8509 16.5 9.80062 16.1224 9.0011 15.5" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'bookmark':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" color="#000000" fill="none">
                    <path d="M20 22H6C4.89543 22 4 21.1046 4 20M4 20C4 18.8954 4.89543 18 6 18H18C19.1046 18 20 17.1046 20 16V2C20 3.10457 19.1046 4 18 4L10 4C7.17157 4 5.75736 4 4.87868 4.87868C4 5.75736 4 7.17157 4 10V20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M9 4V12L12 9L15 12V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M18.5 18C18.5 18 17.5 18.7628 17.5 20C17.5 21.2372 18.5 22 18.5 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
            );
        case 'pause':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" color="#000000" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"></circle>
                    <path d="M9.5 9L9.5 15M14.5 9V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
            );
        case 'plus':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" color="#000000" fill="none">
                    <path d="M12 2.00012C17.5228 2.00012 22 6.47727 22 12.0001C22 17.523 17.5228 22.0001 12 22.0001C6.47715 22.0001 2 17.523 2 12.0001M8.909 2.48699C7.9 2.8146 6.96135 3.29828 6.12153 3.90953M3.90943 6.12162C3.29806 6.9616 2.81432 7.90044 2.4867 8.90964" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M12 8.00012V16.0001M16 12.0001L8 12.0001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
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
    // State for mobile menu is kept in case it's needed in the future, though not currently used
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
                    {/* Logo - always visible with "Buddy" text only on medium screens and larger */}
                    <a href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="flex items-center space-x-2.5 pl-3 pr-2 flex-shrink-0">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-sm">EB</span>
                            </div>
                        </div>
                        <span className="font-bold text-xl text-gray-800 hidden sm:block">Buddy</span>
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

                        {/* Mobile View Navigation - Icons in a row with tooltips */}
                        <div className="md:hidden flex items-center space-x-1 border-l border-gray-200 ml-2 pl-2">
                            {/* Navigation Icons for Mobile */}
                            {navigationItems.map((item) => {
                                const isActive = currentPage === item.id;
                                return (
                                    <Tooltip key={item.id} content={item.label} isVisible={true}>
                                        <button
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
                                    </Tooltip>
                                );
                            })}
                            
                            {/* Profile Icon for Mobile with tooltip */}
                            <Tooltip content={userName ? `Profile: ${userName}` : 'Profile'} isVisible={true}>
                                <button
                                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors ml-2"
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
                            </Tooltip>
                        </div>
                        
                        {/* Hidden mobile menu button to maintain functionality if needed */}
                        <div className="md:hidden hidden">
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
            
            {/* Mobile menu overlay is hidden as we now show navigation icons in the header */}
        </>
    );
};

export default GlobalHeader;