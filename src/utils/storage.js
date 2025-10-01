// src/utils/storage.js

const storage = {
  get: (key, defaultValue = null) => {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('chrome.storage not available. Falling back to localStorage for this call.');
        try {
          const value = localStorage.getItem(key);
          resolve(value ? JSON.parse(value) : defaultValue);
        } catch (e) {
          resolve(defaultValue);
        }
        return;
      }
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          console.error(`Error getting item ${key} from chrome.storage.local`, chrome.runtime.lastError);
          resolve(defaultValue);
        } else {
          resolve(result[key] === undefined ? defaultValue : result[key]);
        }
      });
    });
  },

  set: (key, value) => {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('chrome.storage not available. Falling back to localStorage for this call.');
        try {
          localStorage.setItem(key, JSON.stringify(value));
          resolve(true);
        } catch (e) {
          resolve(false);
        }
        return;
      }
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error setting item ${key} in chrome.storage.local`, chrome.runtime.lastError);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  },

  remove: (key) => {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('chrome.storage not available. Falling back to localStorage for this call.');
        localStorage.removeItem(key);
        resolve(true);
        return;
      }
      chrome.storage.local.remove(key, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error removing item ${key} from chrome.storage.local`, chrome.runtime.lastError);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  },
};

export default storage;