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
    if (!isString(q.id) || !isString(q.type) || !isString(q.stem)) return false;
    if (q.type === 'MCQ' || q.type === 'True/False') {
      if (!isArray(q.options) || q.options.length < 2) return false;
      if (typeof q.correctAnswer !== 'number') return false;
      for (const o of q.options) {
        if (!isObject(o) || !isString(o.text) || typeof o.isCorrect !== 'boolean') return false;
      }
    } else {
      if (!isArray(q.canonicalAnswers) || q.canonicalAnswers.length === 0) return false;
    }
    if (!isString(q.explanation)) return false;
    if (!isArray(q.tags)) return false;
  }
  return true;
}

export function validateEvaluation(obj) {
  if (!isObject(obj)) return false;
  if (typeof obj.isCorrect !== 'boolean') return false;
  if (!isNum(obj.score)) return false;
  if (!isString(obj.rationale)) return false;
  if (!isString(obj.tip)) return false;
  return true;
}

export function validateRecommendations(obj) {
  if (!isObject(obj)) return false;
  if (!isArray(obj.strengths)) return false;
  if (!isArray(obj.weaknesses)) return false;
  if (!isArray(obj.nextSteps)) return false;
  for (const step of obj.nextSteps) {
    if (!isObject(step)) return false;
    if (!isString(step.topic) || !isString(step.action)) return false;
    if (!isNum(step.count)) return false;
  }
  return true;
}
