// src/utils/jsonGuard.js

function tryParse(jsonText) {
    try {
      return { ok: true, value: JSON.parse(jsonText) };
    } catch (e) {
      return { ok: false, error: e };
    }
  }
  
  function extractJsonBlock(text) {
    if (!text) return '';
    // Try fenced code blocks
    const fence = text.match(/``````/i);
    if (fence && fence[1]) return fence[1].trim();
  
    // Try first {...} or [...] block heuristically
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    const start = (firstBrace >= 0 && (firstBrace < firstBracket || firstBracket < 0)) ? firstBrace : firstBracket;
    if (start < 0) return text.trim();
    // naive scan to find matching end
    let depth = 0;
    let end = start;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (c === '{' || c === '[') depth++;
      if (c === '}' || c === ']') depth--;
      if (depth === 0) { end = i + 1; break; }
    }
    return text.slice(start, end).trim();
  }
  
  function normalizeQuotes(jsonish) {
    // Replace fancy quotes with ASCII to improve parsing.
    return (jsonish || '')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, '\'');
  }
  
  export async function parseWithRepair({ raw, schema, validate, repairFn }) {
    // Attempt 1: direct parse + validate
    let p = tryParse(raw);
    if (p.ok && validate(p.value)) return p.value;
  
    // Attempt 2: extract likely JSON block and normalize quotes
    const block = normalizeQuotes(extractJsonBlock(raw));
    p = tryParse(block);
    if (p.ok && validate(p.value)) return p.value;
  
    // Attempt 3: model-assisted repair if provided
    if (typeof repairFn === 'function') {
      const repairedText = await repairFn(block || raw);
      const r1 = tryParse(repairedText);
      if (r1.ok && validate(r1.value)) return r1.value;
  
      const repairedBlock = normalizeQuotes(extractJsonBlock(repairedText));
      const r2 = tryParse(repairedBlock);
      if (r2.ok && validate(r2.value)) return r2.value;
    }
  
    // Final: throw with helpful context
    const preview = (raw || '').slice(0, 400);
    throw new Error(`Failed to parse/validate JSON response. Preview:\n${preview}`);
  }
  