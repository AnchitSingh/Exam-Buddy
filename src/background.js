let pendingSelectionText = null;

chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    
    // Create context menu
    chrome.contextMenus.create({
      id: "start-quiz-from-selection",
      title: "Start Quiz with Exam Buddy",
      contexts: ["selection"]
    });
  });
  
  // Listener for the context menu
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "start-quiz-from-selection" && info.selectionText) {
      // Store the selection text for the handshake, in case the panel is not yet open.
      pendingSelectionText = info.selectionText;
      
      // Try sending the message immediately, in case the panel is already open and listening.
      chrome.runtime.sendMessage({
        type: 'START_QUIZ_FROM_SELECTION',
        text: info.selectionText
      });
      
      // Open the side panel. If it's already open, this does nothing.
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  });
  
  chrome.action.onClicked.addListener(async (tab) => {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  });
  
  // Listen for messages from content or side panel scripts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SIDEPANEL_READY') {
      if (pendingSelectionText) {
        chrome.runtime.sendMessage({
          type: 'START_QUIZ_FROM_SELECTION',
          text: pendingSelectionText
        });
        pendingSelectionText = null; // Clear after sending
      }
    } else if (message.type === 'EXTRACT_CONTENT') {
      // Handle content extraction
      sendResponse({ success: true });
    }
  });
  