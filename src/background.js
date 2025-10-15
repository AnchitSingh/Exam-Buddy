let pendingSelectionText = null;
let pendingStoryText = null;

chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    
    // Create context menus
    chrome.contextMenus.create({
      id: "start-quiz-from-selection",
      title: "Start Quiz with Exam Buddy",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "start-story-from-selection",
      title: "Explain using Exam Buddy",
      contexts: ["selection"]
    });
  });
  
  // Listener for the context menu
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "start-quiz-from-selection" && info.selectionText) {
      // Note: Text cleaning will be handled in the App component when the message is received
      pendingSelectionText = info.selectionText;
      chrome.runtime.sendMessage({ type: 'START_QUIZ_FROM_SELECTION', text: info.selectionText });
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } else if (info.menuItemId === "start-story-from-selection" && info.selectionText) {
      // Note: Text cleaning will be handled in the App component when the message is received
      pendingStoryText = info.selectionText;
      chrome.runtime.sendMessage({ type: 'START_STORY_FROM_SELECTION', text: info.selectionText });
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
        chrome.runtime.sendMessage({ type: 'START_QUIZ_FROM_SELECTION', text: pendingSelectionText });
        pendingSelectionText = null; // Clear after sending
      } else if (pendingStoryText) {
        chrome.runtime.sendMessage({ type: 'START_STORY_FROM_SELECTION', text: pendingStoryText });
        pendingStoryText = null; // Clear after sending
      }
    } else if (message.type === 'EXTRACT_CONTENT') {
      // Handle content extraction
      sendResponse({ success: true });
    }
  });
  