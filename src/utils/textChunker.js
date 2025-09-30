// src/utils/textChunker.js

// Updated chunker for summarization: 20K chars per chunk, 200 char overlap

function estimateTokens(text) {
  // More accurate: ~4 chars per token for Gemini Nano
  return Math.round((text || '').length / 4);
}

export function chunkText(text, {
  maxChars = 12000,  // Increased for summarization (fits ~5K tokens)
  minChars = 4000,   // Minimum viable chunk size
  overlap = 200,     // Small overlap for context continuity
  maxChunks = 2      // Limit chunks for performance
} = {}) {
  console.log('🎯 chunkText: Starting chunking process');
  console.log('🎯 chunkText: Input text length:', text?.length, 'characters');
  console.log('🎯 chunkText: Parameters - maxChars:', maxChars, 'minChars:', minChars, 'maxChunks:', maxChunks);
  
  const chunks = [];
  const clean = text || '';
  
  if (clean.length <= minChars) {
    console.log('🎯 chunkText: Text is smaller than minChars, creating single chunk');
    // Single small chunk - no need to split
    const singleChunk = {
      id: `chunk_1`,
      text: clean,
      start: 0,
      end: clean.length,
      tokenEstimate: estimateTokens(clean),
      needsSummarization: false
    };
    console.log('🎯 chunkText: Single chunk created:', singleChunk);
    return [singleChunk];
  }

  let i = 0;
  let chunkCount = 0;
  console.log('🎯 chunkText: Starting chunking loop');

  while (i < clean.length && chunkCount < maxChunks) {
    let end = Math.min(i + maxChars, clean.length);
    
    // Prefer cut at paragraph boundary if possible
    const slice = clean.slice(i, end);
    const lastBreak = slice.lastIndexOf('\n\n');
    const cut = (lastBreak >= minChars) ? i + lastBreak : end;
    
    const part = clean.slice(i, cut);
    const needsSum = part.length > minChars;
    
    console.log(`🎯 chunkText: Created chunk ${chunkCount + 1}, length: ${part.length} chars, needsSummarization: ${needsSum}`);
    
    chunks.push({
      id: `chunk_${chunks.length + 1}`,
      text: part,
      start: i,
      end: cut,
      tokenEstimate: estimateTokens(part),
      needsSummarization: needsSum // Flag for summarization
    });

    if (cut >= clean.length) {
      console.log('🎯 chunkText: Reached end of text, breaking loop');
      break;
    }
    i = Math.max(0, cut - overlap);
    chunkCount++;
  }
  
  console.log('🎯 chunkText: Final chunks created:', chunks.length);
  chunks.forEach((chunk, index) => {
    console.log(`  Chunk ${index + 1}: ${chunk.text.length} chars, needsSummarization: ${chunk.needsSummarization}`);
  });

  return chunks;
}

// Helper to determine if content needs summarization
export function shouldSummarize(chunks) {
  console.log('🎯 shouldSummarize: Checking if summarization is needed');
  console.log('🎯 shouldSummarize: Number of chunks:', chunks?.length || 0);
  
  if (!chunks || chunks.length === 0) {
    console.log('🎯 shouldSummarize: No chunks, returning false');
    return false;
  }
  if (chunks.length === 1 && chunks[0].text.length < 4000) {
    console.log('🎯 shouldSummarize: Single chunk under 4000 chars, returning false');
    return false;
  }
  
  const needsSum = chunks.some(chunk => chunk.needsSummarization);
  console.log('🎯 shouldSummarize: At least one chunk needs summarization:', needsSum);
  
  return needsSum;
}
