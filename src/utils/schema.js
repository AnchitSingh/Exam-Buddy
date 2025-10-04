// src/utils/schema.js
function isString(x) { return typeof x === 'string'; }
function isBool(x) { return typeof x === 'boolean'; }
function isNum(x) { return typeof x === 'number' && Number.isFinite(x); }
function isArray(x) { return Array.isArray(x); }
function isObject(x) { return x && typeof x === 'object' && !Array.isArray(x); }

export function validateQuiz(obj) {
  if (!isObject(obj)) return false;
  if (!isArray(obj.questions)) return false;
  
  for (const q of obj.questions) {
    if (!isObject(q)) return false;
    // id is not expected from AI, but type is.
    if (!isString(q.type) || !isString(q.question)) return false;
    
    if (q.type === 'MCQ' || q.type === 'True/False') {
      if (!isArray(q.options) || q.options.length < 2) return false;
      for (const option of q.options) {
        if (!isObject(option) || !isString(option.text) || !isBool(option.isCorrect)) return false;
      }
    }
    
    if (!isString(q.explanation)) return false;
    // Optional fields
    if (q.difficulty && !isString(q.difficulty)) return false;
    if (q.subject && !isString(q.subject)) return false;
    if (q.tags && !isArray(q.tags)) return false;
    if (q.tags && q.tags.some(tag => !isString(tag))) return false;
  }
  
  return true;
}

export function validateEvaluation(obj) {
  if (!isObject(obj)) return false;
  if (typeof obj.isCorrect !== 'boolean') return false;
  if (!isNum(obj.score)) return false;
  
  // Match api.js expectations: feedback object with message and explanation
  if (!isObject(obj.feedback)) return false;
  if (!isString(obj.feedback.message)) return false;
  if (!isString(obj.explanation)) return false;
  
  return true;
}

export function validateRecommendations(obj) {
  if (!isObject(obj)) return false;
  if (!isArray(obj.strengths)) return false;
  if (!isArray(obj.weaknesses)) return false;
  if (!isArray(obj.nextSteps)) return false;
  
  // Validate string arrays
  for (const strength of obj.strengths) {
    if (!isString(strength)) return false;
  }
  for (const weakness of obj.weaknesses) {
    if (!isString(weakness)) return false;
  }
  for (const step of obj.nextSteps) {
    if (!isString(step)) return false;
  }
  
  return true;
}
