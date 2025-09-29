import { buildQuizPrompt, buildEvaluatePrompt, buildRecommendPrompt, buildOverallStreamingPrompt, buildRecommendationsPrompt } from './prompts';
import { validateQuiz, validateEvaluation, validateRecommendations } from './schema';

let session = null;
let modelParams = null;

// Get the LanguageModel API surface (web or extension)
function getLanguageModel() {
  // Standard web API (Chrome 127+)
  if (globalThis.LanguageModel) return globalThis.LanguageModel;
  // Extension origin trial (experimental)
  if (typeof chrome !== 'undefined' && chrome?.aiOriginTrial?.languageModel) {
    return chrome.aiOriginTrial.languageModel;
  }
  return null;
}

// Check model availability using official status strings
async function checkAvailability() {
  try {
    const LM = getLanguageModel();
    if (!LM) return { available: false, status: 'no-api', detail: null };
    
    const availability = await LM.availability();
    return { 
      available: availability !== 'unavailable', 
      status: availability, 
      detail: null 
    };
  } catch (error) {
    return { 
      available: false, 
      status: 'error', 
      detail: null, 
      error: error?.message || 'Availability check failed' 
    };
  }
}

// Create session with proper parameter clamping and user activation handling
async function createSessionIfNeeded() {
  if (session) return session;
  
  const LM = getLanguageModel();
  if (!LM) throw new Error('Prompt API not available');
  
  const availability = await LM.availability();
  if (availability === 'unavailable') {
    throw new Error('Model unavailable on this device/configuration');
  }
  
  if (!modelParams) {
    modelParams = await LM.params();
  }
  
  session = await LM.create({
    temperature: Math.min(0.3, modelParams.maxTemperature || 1.0),
    topK: Math.min(8, modelParams.maxTopK || 40),
    expectedOutputs: [
      { type: "text", languages: ["en"] }
    ],
    monitor(monitor) {
      monitor.addEventListener('downloadprogress', (e) => {
        console.log(`Model download: ${Math.round(e.loaded * 100)}%`);
      });
    }
  });
  
  return session;
}


// Prompt with structured JSON output using responseConstraint
async function promptJSON({ text, schema, validate, fallbackRepair = true }) {
  try {
    const s = await createSessionIfNeeded();
    
    // Try structured output first (Chrome 137+)
    const result = await s.prompt(text, {
      responseConstraint: schema,
      omitResponseConstraintInput: true
    });
    
    const parsed = JSON.parse(result);
    
    // Validate with custom validator if provided
    if (validate && !validate(parsed)) {
      if (!fallbackRepair) throw new Error('Validation failed');
      // Fallback to repair prompt if validation fails
      return await promptJSONWithRepair({ text, schema, validate });
    }
    
    return parsed;
  } catch (error) {
    // Fallback to repair approach for older versions or validation failures
    if (fallbackRepair && error.name !== 'NotSupportedError') {
      console.warn('Structured output failed, attempting repair approach:', error.message);
      return await promptJSONWithRepair({ text, schema, validate });
    }
    throw error;
  }
}

// Fallback repair approach for compatibility
async function promptJSONWithRepair({ text, schema, validate }) {
  const s = await createSessionIfNeeded();
  
  const enhancedPrompt = `${text}

IMPORTANT: Respond with valid JSON only that matches this schema:
${JSON.stringify(schema, null, 2)}`;
  
  const raw = await s.prompt(enhancedPrompt);
  
  try {
    const parsed = JSON.parse(raw);
    if (validate && !validate(parsed)) {
      throw new Error('Validation failed');
    }
    return parsed;
  } catch (parseError) {
    // Attempt repair
    const repairPrompt = `The following output was not valid JSON or didn't match the required schema. Please fix it and return valid JSON only:

Schema:
${JSON.stringify(schema, null, 2)}

Broken output:
${raw}

Return corrected JSON only:`;
    
    const repaired = await s.prompt(repairPrompt);
    const repairedParsed = JSON.parse(repaired);
    
    if (validate && !validate(repairedParsed)) {
      throw new Error('Repair validation failed');
    }
    
    return repairedParsed;
  }
}

// Streaming prompt for long responses
async function promptStreaming(text) {
  const s = await createSessionIfNeeded();
  return s.promptStreaming(text);
}

// Session management
export async function resetSession() {
  if (session) {
    session.destroy();
    session = null;
  }
}

export async function cloneSession() {
  if (!session) throw new Error('No active session to clone');
  return await session.clone();
}

// Public API
export async function available() {
  return await checkAvailability();
}

export async function generateQuizJSON({ extractedSource, config }) {
  const prompt = buildQuizPrompt({ extractedSource, config });
  const schema = {
    type: 'object',
    required: ['questions'],
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['type', 'question', 'options', 'explanation'],
          properties: {
            type: { type: 'string' },
            question: { type: 'string' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                required: ['text', 'isCorrect'],
                properties: {
                  text: { type: 'string' },
                  isCorrect: { type: 'boolean' }
                }
              }
            },
            explanation: { type: 'string' },
            difficulty: { type: 'string' },
            subject: { type: 'string' }
          }
        }
      }
    }
  };
  
  return await promptJSON({
    text: prompt,
    schema,
    validate: validateQuiz
  });
}

export async function evaluateSubjectiveJSON({ question, canonical, userAnswer }) {
  const prompt = buildEvaluatePrompt({ question, canonical, userAnswer });
  const schema = {
    type: 'object',
    required: ['isCorrect', 'rationale'],
    properties: {
      isCorrect: { type: 'boolean' },
      rationale: { type: 'string' },
      score: { type: 'number', minimum: 0, maximum: 100 }
    }
  };
  
  return await promptJSON({
    text: prompt,
    schema,
    validate: validateEvaluation
  });
}

export async function recommendPlanJSON({ summary }) {
  const prompt = buildRecommendPrompt({ summary });
  const schema = {
    type: 'object',
    required: ['strengths', 'weaknesses', 'nextSteps'],
    properties: {
      strengths: { type: 'array', items: { type: 'string' } },
      weaknesses: { type: 'array', items: { type: 'string' } },
      nextSteps: { type: 'array', items: { type: 'string' } },
      priority: { type: 'string', enum: ['high', 'medium', 'low'] }
    }
  };
  
  return await promptJSON({
    text: prompt,
    schema,
    validate: validateRecommendations
  });
}

export async function streamOverallFeedback({ quizMeta, stats }) {
  const prompt = buildOverallStreamingPrompt({ quizMeta, stats });
  const s = await createSessionIfNeeded();
  return s.promptStreaming(prompt);
}

export async function getQuizRecommendationsJSON({ quizMeta, stats }) {
  const prompt = buildRecommendationsPrompt({ quizMeta, stats });
  const schema = {
    type: 'object',
    required: ['recommendations'],
    properties: {
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          required: ['topic', 'reason', 'suggested_count', 'types'],
          properties: {
            topic: { type: 'string' },
            reason: { type: 'string' },
            suggested_count: { type: 'number' },
            types: { type: 'array', items: { type: 'string', enum: ["MCQ","TrueFalse","Subjective","FillUp"] } }
          }
        }
      }
    }
  };
  
  const validate = (data) => {
      return data && Array.isArray(data.recommendations) && data.recommendations.every(r => r.topic && r.reason && typeof r.suggested_count === 'number');
  };

  return await promptJSON({
    text: prompt,
    schema,
    validate
  });
}

// Additional utilities
export async function getModelInfo() {
  const LM = getLanguageModel();
  if (!LM) return null;
  
  try {
    const params = await LM.params();
    return {
      defaultTemperature: params.defaultTemperature,
      maxTemperature: params.maxTemperature,
      defaultTopK: params.defaultTopK,
      maxTopK: params.maxTopK
    };
  } catch {
    return null;
  }
}

export default {
  available,
  generateQuizJSON,
  evaluateSubjectiveJSON,
  recommendPlanJSON,
  promptStreaming,
  resetSession,
  cloneSession,
  getModelInfo,
  streamOverallFeedback,
  getQuizRecommendationsJSON
};
