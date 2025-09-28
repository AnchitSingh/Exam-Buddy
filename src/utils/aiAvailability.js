// src/utils/aiAvailability.js

import chromeAI from './chromeAI';

export async function getAIStatus() {
    try {
        const st = await chromeAI.available();
        if (!st?.available) return { state: 'unavailable', detail: st?.detail || null };
        if (st?.detail?.available === 'after-download') return { state: 'downloading', detail: st.detail };
        return { state: 'ready', detail: st.detail };
    } catch (e) {
        return { state: 'error', error: e?.message || 'AI check failed' };
    }
}
