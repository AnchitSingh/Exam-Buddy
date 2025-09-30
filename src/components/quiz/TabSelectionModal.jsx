import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const TabSelectionModal = ({ isOpen, onClose, onSelectTab, selectedTabId }) => {
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTabs = async () => {
      try {
        setLoading(true);
        const allTabs = await chrome.tabs.query({ 
          currentWindow: true 
        });
        
        // Filter out extension pages, devtools, etc.
        const userTabs = allTabs.filter(tab => 
          !tab.url.startsWith('chrome-extension://') && 
          !tab.url.startsWith('chrome://') && 
          !tab.url.startsWith('devtools://') &&
          tab.title !== ''
        );
        
        setTabs(userTabs);
        setError(null);
      } catch (err) {
        console.error('Error fetching tabs:', err);
        setError('Failed to load tabs. Please try again.');
        setTabs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTabs();
  }, [isOpen]);

  const handleTabSelect = (tab) => {
    onSelectTab(tab);
    onClose();
  };

  const getFaviconUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.origin}/favicon.ico`;
    } catch {
      return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Tab" size="lg">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-600 text-sm">{error}</p>
            <Button 
              onClick={onClose} 
              className="mt-4"
              variant="secondary"
            >
              Close
            </Button>
          </div>
        ) : tabs.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-600 text-sm">No accessible tabs found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tabs.map((tab) => {
              const isSelected = selectedTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    isSelected 
                      ? 'border-amber-400 bg-amber-50' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {tab.favIconUrl ? (
                      <img 
                        src={tab.favIconUrl} 
                        alt="" 
                        className="w-6 h-6 rounded-sm"
                        onError={(e) => {
                          e.target.src = getFaviconUrl(tab.url);
                        }}
                      />
                    ) : (
                      <img 
                        src={getFaviconUrl(tab.url)} 
                        alt="" 
                        className="w-6 h-6 rounded-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                      {tab.title}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {tab.url}
                    </div>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="flex gap-3 pt-4 mt-4 border-t border-slate-200">
        <Button 
          onClick={onClose} 
          variant="secondary"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default TabSelectionModal;