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
    
    // Try fenced code blocks first
    const fenceMatch = text.match(/``````/i);
    if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim();
    
    // Find first complete JSON object/array
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    const start = (firstBrace >= 0 && (firstBrace < firstBracket || firstBracket < 0)) 
      ? firstBrace : firstBracket;
    
    if (start < 0) return text.trim();
    
    // Scan for matching closing bracket/brace
    let depth = 0;
    let end = start;
    const startChar = text[start];
    const endChar = startChar === '{' ? '}' : ']';
    
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (c === startChar) depth++;
      if (c === endChar) depth--;
      if (depth === 0) { 
        end = i + 1; 
        break; 
      }
    }
    
    return text.slice(start, end).trim();
  }
  
  function normalizeQuotes(jsonish) {
    return (jsonish || '')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'");
  }
  
  export async function parseWithRepair({ raw, schema, validate, repairFn }) {
    // Attempt 1: direct parse + validate
    let p = tryParse(raw);
    if (p.ok && validate && validate(p.value)) return p.value;
    if (p.ok && !validate) return p.value;
    
    // Attempt 2: extract JSON block and normalize quotes
    const block = normalizeQuotes(extractJsonBlock(raw));
    p = tryParse(block);
    if (p.ok && validate && validate(p.value)) return p.value;
    if (p.ok && !validate) return p.value;
    
    // Attempt 3: model-assisted repair if provided
    if (typeof repairFn === 'function') {
      try {
        const repairedText = await repairFn(block || raw);
        const r1 = tryParse(repairedText);
        if (r1.ok && (!validate || validate(r1.value))) return r1.value;
        
        const repairedBlock = normalizeQuotes(extractJsonBlock(repairedText));
        const r2 = tryParse(repairedBlock);
        if (r2.ok && (!validate || validate(r2.value))) return r2.value;
      } catch (repairError) {
        console.warn('Repair function failed:', repairError);
      }
    }
    
    // Final: throw with context
    const preview = (raw || '').slice(0, 400);
    throw new Error(`Failed to parse/validate JSON response. Preview:\n${preview}`);
  }
  