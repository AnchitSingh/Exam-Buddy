// src/content.js

// IMPORTANT: This file is a content script, it runs in the context of the webpage.
// It communicates with the rest of the extension via chrome.runtime.onMessage.

// Use the same message type constants as the rest of the app
const MSG = {
    EXTRACT_DOM_HTML: 'EXTRACT_DOM_HTML',
    EXTRACT_SELECTION: 'EXTRACT_SELECTION',
    EXTRACT_META: 'EXTRACT_META',
    PING_CONTENT: 'PING_CONTENT'
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Return true to indicate you wish to send a response asynchronously.
    // This is required in Manifest V3, even for synchronous responses.
    let isResponseAsync = false;

    switch (message.type) {
        case 'GET_SELECTION':
            sendResponse({ text: window.getSelection().toString() });
            break;

        case MSG.PING_CONTENT:
            sendResponse({ success: true, message: 'pong' });
            break;

        case MSG.EXTRACT_DOM_HTML:
            sendResponse({
                html: document.documentElement.outerHTML,
                title: document.title,
                url: window.location.href
            });
            break;

        case MSG.EXTRACT_SELECTION:
            sendResponse({
                text: window.getSelection().toString(),
                title: document.title,
                url: window.location.href
            });
            break;

        case MSG.EXTRACT_META:
            sendResponse({
                title: document.title,
                url: window.location.href,
                language: document.documentElement.lang
            });
            break;

        // Legacy message type for backward compatibility, can be removed later.
        case 'EXTRACT_CONTENT': {
            const scripts = document.querySelectorAll('script, style');
            scripts.forEach(el => el.remove());
            const content = document.body.innerText || document.body.textContent || '';
            sendResponse({
              url: window.location.href,
              title: document.title,
              content: content.slice(0, 10000), // Limit content size
              wordCount: content.split(' ').length
            });
            break;
        }

        default:
            // Optional: handle unknown message types if necessary
            break;
    }

    return isResponseAsync;
});

// A log to confirm the script is injected and running during development.
