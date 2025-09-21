import React, { useState, useEffect } from 'react';

const AIProcessingFeedback = ({ 
  isVisible, 
  task = 'processing',
  onComplete 
}) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [dots, setDots] = useState('');

  const messages = {
    'quiz-generation': [
      "🧠 Analyzing your topic...",
      "📚 Consulting the knowledge base...", 
      "✨ Crafting perfect questions...",
      "🎯 Calibrating difficulty levels...",
      "🔮 Adding the magical touches...",
    ],
    'evaluation': [
      "🤔 Evaluating your answer...",
      "📊 Analyzing response patterns...",
      "💡 Generating personalized feedback...",
      "✅ Finalizing assessment...",
    ],
    'feedback': [
      "📝 Preparing detailed explanations...",
      "🎨 Crafting helpful insights...",
      "🚀 Almost ready to boost your learning...",
    ],
    'processing': [
      "⚡ Firing up the AI engines...",
      "🔄 Processing your request...",
      "🎯 Getting everything ready...",
    ]
  };

  const currentMessages = messages[task] || messages.processing;

  useEffect(() => {
    if (!isVisible) return;

    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => 
        prev < currentMessages.length - 1 ? prev + 1 : prev
      );
    }, 2000);

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Auto complete after showing all messages
    const autoCompleteTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, currentMessages.length * 2000 + 1000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(dotsInterval);
      clearTimeout(autoCompleteTimer);
    };
  }, [isVisible, currentMessages.length, onComplete]);

  useEffect(() => {
    if (isVisible) {
      setCurrentMessage(0);
      setDots('');
    }
  }, [isVisible, task]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl border border-white/20">
        
        {/* Animated Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          
          {/* Floating particles */}
          <div className="absolute -top-2 -left-2 w-3 h-3 bg-amber-300 rounded-full animate-bounce"></div>
          <div className="absolute -top-2 -right-2 w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-orange-300 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
        </div>

        {/* Current Message */}
        <div className="mb-4">
          <p className="text-lg font-semibold text-slate-800 mb-2">
            {currentMessages[currentMessage]}{dots}
          </p>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${((currentMessage + 1) / currentMessages.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Fun subtitle */}
        <p className="text-sm text-slate-500">
          Chrome's built-in AI is working its magic...
        </p>

        {/* Cancel button - optional */}
        <button 
          onClick={onComplete}
          className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline"
        >
          Skip animation
        </button>
      </div>
    </div>
  );
};

export default AIProcessingFeedback;
