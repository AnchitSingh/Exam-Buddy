// src/utils/textChunker.js
// Splits long text into prompt-sized chunks with small overlap to preserve context.

function estimateTokens(text) {
    // Rough heuristic: ~1.3 tokens per word.
    const words = text.trim().split(/\s+/).length;
    return Math.round(words * 1.3);
  }
  
  export function chunkText(text, {
    maxChars = 4500,
    minChars = 2000,
    overlap = 200
  } = {}) {
    const chunks = [];
    const clean = text || '';
    let i = 0;
    while (i < clean.length) {
      let end = Math.min(i + maxChars, clean.length);
      // Prefer cut at paragraph boundary if possible
      const slice = clean.slice(i, end);
      const lastBreak = slice.lastIndexOf('\n\n');
      const cut = (lastBreak >= minChars) ? i + lastBreak : end;
      const part = clean.slice(i, cut);
      chunks.push({
        id: `chunk_${chunks.length + 1}`,
        text: part,
        start: i,
        end: cut,
        tokenEstimate: estimateTokens(part)
      });
      if (cut >= clean.length) break;
      i = Math.max(0, cut - overlap);
    }
    return chunks;
  }
  