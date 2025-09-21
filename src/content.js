// Extract text content from current page
function extractPageContent() {
    // Remove script and style elements
    const scripts = document.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());
    
    // Get main content
    const content = document.body.innerText || document.body.textContent || '';
    
    return {
      url: window.location.href,
      title: document.title,
      content: content.slice(0, 10000), // Limit content size
      wordCount: content.split(' ').length
    };
  }
  
  // Listen for messages from extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTRACT_CONTENT') {
      const content = extractPageContent();
      sendResponse(content);
    }
  });
  