// src/services/extraction.js
// Frontend extraction service for communicating with the content script (DOM/selection/meta).

import { MSG } from '../utils/messages';

function isExtensionContext() {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.tabs;
}

async function getActiveTabId() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || !tabs[0]) throw new Error('No active tab found.');
    return tabs[0].id;
}

async function sendToActiveTab(message) {
    if (!isExtensionContext()) {
        throw new Error('Extraction requires Chrome extension context with content script loaded.');
    }
    const tabId = await getActiveTabId();
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            const err = chrome.runtime.lastError;
            if (err) return reject(new Error(err.message || 'Failed to reach content script.'));
            resolve(response);
        });
    });
}

async function pingContent() {
    try {
        const res = await sendToActiveTab({ type: MSG.PING_CONTENT });
        return !!res;
    } catch {
        return false;
    }
}

async function getDOMHTML() {
    const ok = await pingContent();
    if (!ok) throw new Error('Content script not available on this page.');
    const res = await sendToActiveTab({ type: MSG.EXTRACT_DOM_HTML });
    if (!res || !res.html) throw new Error('Failed to extract DOM HTML.');
    return res; // { html, title, url }
}

async function getSelectionText() {
    const ok = await pingContent();
    if (!ok) throw new Error('Content script not available on this page.');
    const res = await sendToActiveTab({ type: MSG.EXTRACT_SELECTION });
    if (!res || !res.text) throw new Error('No selection text found.');
    return res; // { text, title, url }
}

async function getMeta() {
    const ok = await pingContent();
    if (!ok) throw new Error('Content script not available on this page.');
    const res = await sendToActiveTab({ type: MSG.EXTRACT_META });
    return res || {};
}

const extractionService = {
    pingContent,
    getDOMHTML,
    getSelectionText,
    getMeta
};

export default extractionService;
