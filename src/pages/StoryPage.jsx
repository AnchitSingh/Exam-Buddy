import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GlobalHeader from '../components/ui/GlobalHeader';
import BackgroundEffects from '../components/ui/BackgroundEffects';
import Button from '../components/ui/Button';

const StoryPage = ({ storyContent, onNavigate }) => {
  const { title, content, style } = storyContent || {};
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);
  const contentEndRef = useRef(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [followUpQuestion]);

  const handleSendFollowUp = async () => {
    if (!followUpQuestion.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    // TODO: Implement follow-up API call
    console.log('Sending follow-up:', followUpQuestion);
    
    // Simulate API call
    setTimeout(() => {
      setFollowUpQuestion('');
      setIsSubmitting(false);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendFollowUp();
    }
  };

  if (!storyContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading story...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen flex flex-col">
      <BackgroundEffects />
      <GlobalHeader currentPage="story" onNavigate={onNavigate} />

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto pt-24 pb-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Story Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-amber-200 shadow-sm mb-4">
              <span className="text-2xl">📖</span>
              <span className="text-sm font-medium text-amber-800">{style || 'Story Mode'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-4 mb-2">
              {title || 'Your Story'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Just now</span>
            </div>
          </div>

          {/* Story Content - Direct Display */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg p-6 sm:p-8">
            <div className="prose prose-slate prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for markdown elements
                  h1: ({ node, ...props }) => (
                    <h1 className="text-3xl font-bold text-slate-900 mt-8 mb-4 first:mt-0" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-2xl font-bold text-slate-800 mt-6 mb-3 first:mt-0" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-xl font-semibold text-slate-800 mt-5 mb-2 first:mt-0" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-slate-700 leading-relaxed mb-4 last:mb-0" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside space-y-2 text-slate-700 my-4" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside space-y-2 text-slate-700 my-4" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-slate-700 leading-relaxed" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-amber-400 pl-4 py-2 my-4 italic text-slate-600 bg-amber-50/50 rounded-r-lg" {...props} />
                  ),
                  code: ({ node, inline, ...props }) => 
                    inline ? (
                      <code className="px-2 py-1 bg-slate-100 text-amber-700 rounded text-sm font-mono" {...props} />
                    ) : (
                      <code className="block p-4 bg-slate-900 text-slate-100 rounded-lg text-sm font-mono overflow-x-auto my-4" {...props} />
                    ),
                  pre: ({ node, ...props }) => (
                    <pre className="bg-slate-900 rounded-lg overflow-hidden my-4" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a className="text-amber-600 hover:text-amber-700 underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-bold text-slate-900" {...props} />
                  ),
                  em: ({ node, ...props }) => (
                    <em className="italic text-slate-700" {...props} />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="my-8 border-t-2 border-slate-200" {...props} />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-slate-50" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="px-4 py-2 text-left text-sm font-semibold text-slate-900" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="px-4 py-2 text-sm text-slate-700 border-t border-slate-200" {...props} />
                  ),
                }}
              >
                {content || 'No content generated.'}
              </ReactMarkdown>
            </div>
          </div>

          {/* Scroll anchor */}
          <div ref={contentEndRef} />
        </div>
      </main>

      {/* Floating Island Input Area */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="pointer-events-auto bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-5 sm:p-6 transition-all duration-300 hover:shadow-amber-200/50"
               style={{
                 boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.15), 0 10px 25px -10px rgba(251, 191, 36, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.6)',
               }}>
            
            {/* Quick Suggestions */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setFollowUpQuestion('Can you explain this in simpler terms?')}
                className="group px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-700 text-xs font-medium rounded-full border border-amber-200/50 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
              >
                <span className="flex items-center gap-1.5">
                  <span className="group-hover:scale-110 transition-transform">✨</span>
                  Simplify this
                </span>
              </button>
              <button
                onClick={() => setFollowUpQuestion('Can you give me more details?')}
                className="group px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 text-xs font-medium rounded-full border border-blue-200/50 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
              >
                <span className="flex items-center gap-1.5">
                  <span className="group-hover:scale-110 transition-transform">🔍</span>
                  More details
                </span>
              </button>
              <button
                onClick={() => setFollowUpQuestion('Can you give me an example?')}
                className="group px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 text-xs font-medium rounded-full border border-purple-200/50 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
              >
                <span className="flex items-center gap-1.5">
                  <span className="group-hover:scale-110 transition-transform">💡</span>
                  Give example
                </span>
              </button>
            </div>

            {/* Input Container */}
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <textarea
                  ref={textareaRef}
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow-up question..."
                  className="relative w-full px-5 py-4 pr-16 bg-white/90 border-2 border-slate-200 rounded-2xl resize-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100/50 focus:bg-white transition-all duration-200 max-h-32 overflow-y-auto placeholder:text-slate-400 shadow-inner"
                  rows={1}
                  style={{ minHeight: '56px' }}
                />
                <div className="absolute right-4 bottom-4 flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100/80 rounded-lg backdrop-blur-sm">
                    <kbd className="text-[10px] font-semibold text-slate-500 font-mono">↵</kbd>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleSendFollowUp}
                disabled={!followUpQuestion.trim() || isSubmitting}
                loading={isSubmitting}
                className="relative bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 h-[56px] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:shadow-lg group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                {isSubmitting ? (
                  <svg className="relative w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="relative w-[22px] h-[22px] transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" color="#ffffff" fill="none">
                    <path d="M21.0477 3.05293C18.8697 0.707363 2.48648 6.4532 2.50001 8.551C2.51535 10.9299 8.89809 11.6617 10.6672 12.1581C11.7311 12.4565 12.016 12.7625 12.2613 13.8781C13.3723 18.9305 13.9301 21.4435 15.2014 21.4996C17.2278 21.5892 23.1733 5.342 21.0477 3.05293Z" stroke="#ffffff" strokeWidth="1.5"></path>
                    <path d="M11.5 12.5L15 9" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                )}
              </Button>
            </div>

            {/* Helper Text */}
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[10px] text-slate-600 border border-slate-200">Enter</kbd> to send
                <span className="hidden sm:inline">
                  , <kbd className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[10px] text-slate-600 border border-slate-200">Shift + Enter</kbd> for new line
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryPage;