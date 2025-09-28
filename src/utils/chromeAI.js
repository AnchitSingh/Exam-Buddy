// src/utils/chromeAI.js

import { buildQuizPrompt, buildEvaluatePrompt, buildRecommendPrompt } from './prompts';
import { parseWithRepair } from './jsonGuard';
import { validateQuiz, validateEvaluation, validateRecommendations } from './schema';

// Preference keys are implementation hints; Prompt API specifics may vary by channel/version.
const SESSION_OPTIONS = {
  // temperature, topK may be supported depending on build; keep conservative defaults.
  temperature: 0.3,
  topK: 32
};

let session = null;

async function getModelSurface() {
  // Try window.ai (web Prompt API) first, then chrome.ai.* (extensions) if exposed.
  // This keeps code robust across channels while remaining extension-friendly.
  const hasWindowAI = typeof window !== 'undefined' && window.ai && window.ai.languageModel;
  const hasChromeAI = typeof chrome !== 'undefined' && chrome.ai && chrome.ai.languageModel;
  return { hasWindowAI, hasChromeAI };
}

async function checkAvailability() {
  const { hasWindowAI, hasChromeAI } = await getModelSurface();
  try {
    if (hasWindowAI) {
      const caps = await window.ai.languageModel.capabilities();
      return { available: caps?.available === 'readily' || caps?.available === 'after-download', detail: caps };
    }
    if (hasChromeAI) {
      const caps = await chrome.ai.languageModel.capabilities();
      return { available: caps?.available === 'readily' || caps?.available === 'after-download', detail: caps };
    }
    return { available: false, detail: null };
  } catch (e) {
    return { available: false, detail: null, error: e?.message || 'Availability check failed' };
  }
}

async function createSessionIfNeeded() {
  if (session) return session;
  const { hasWindowAI, hasChromeAI } = await getModelSurface();
  if (hasWindowAI) {
    session = await window.ai.languageModel.create({ ...SESSION_OPTIONS });
    return session;
  }
  if (hasChromeAI) {
    session = await chrome.ai.languageModel.create({ ...SESSION_OPTIONS });
    return session;
  }
  throw new Error('Prompt API not available');
}

async function promptRaw(text) {
  const s = await createSessionIfNeeded();
  // Unified prompt method name for both surfaces.
  if (typeof s.prompt === 'function') {
    return await s.prompt(text);
  }
  if (typeof s.generate === 'function') {
    const res = await s.generate(text);
    return typeof res === 'string' ? res : (res?.output || '');
  }
  throw new Error('Unknown session interface for Prompt API');
}

async function promptJSON({ text, schema, validate, repairInstruction }) {
  const raw = await promptRaw(text);
  const repaired = await parseWithRepair({
    raw,
    schema,
    validate,
    repairFn: async (broken) => {
      const repairPrompt = `${repairInstruction}\n\n---\nSchema:\n${JSON.stringify(schema, null, 2)}\n---\nBroken:\n${broken}\n---\nReturn corrected JSON only.`;
      return await promptRaw(repairPrompt);
    }
  });
  return repaired;
}

// Public API

export async function available() {
  return await checkAvailability();
}

export async function generateQuizJSON({ extractedSource, config }) {
  const prompt = buildQuizPrompt({ extractedSource, config });
  const repairInstruction = 'The previous output was not valid JSON. Repair it to exactly match the schema and return JSON only.';
  const data = await promptJSON({
    text: prompt,
    schema: { type: 'object', required: ['questions'], properties: {} }, // minimal anchor; validator enforces shape
    validate: validateQuiz,
    repairInstruction
  });
  return data;
}

export async function evaluateSubjectiveJSON({ question, canonical, userAnswer }) {
  const prompt = buildEvaluatePrompt({ question, canonical, userAnswer });
  const repairInstruction = 'Return valid JSON only that conforms to the evaluation schema.';
  const data = await promptJSON({
    text: prompt,
    schema: { type: 'object', required: ['isCorrect', 'rationale'], properties: {} },
    validate: validateEvaluation,
    repairInstruction
  });
  return data;
}

export async function recommendPlanJSON({ summary }) {
  const prompt = buildRecommendPrompt({ summary });
  const repairInstruction = 'Return valid JSON only that conforms to the recommendations schema.';
  const data = await promptJSON({
    text: prompt,
    schema: { type: 'object', required: ['strengths', 'weaknesses', 'nextSteps'], properties: {} },
    validate: validateRecommendations,
    repairInstruction
  });
  return data;
}

export default {
  available,
  generateQuizJSON,
  evaluateSubjectiveJSON,
  recommendPlanJSON
};
