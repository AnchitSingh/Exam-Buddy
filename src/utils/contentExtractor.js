// src/utils/contentExtractor.js

// Enhanced extractor with summarization integration

import { cleanToPromptReady, buildExcerpt } from './contentCleaner';
import { chunkText, shouldSummarize } from './textChunker';
import { processChunks, assembleSummaries, checkSummarizerAvailability } from './summaryProcessor';
import { extractReadableFromHTML } from './readabilityClient';
import { SOURCE_TYPE } from './messages';
import extractionService from '../services/extraction';

async function finalizeSource({ 
  sourceType, 
  title, 
  url, 
  rawText, 
  meta = {},
  quizConfig = {},
  onProgress = null
}) {
  console.log('🎯 finalizeSource: Starting extraction process');
  console.log('📊 Input text length:', rawText?.length, 'characters');
  console.log('📊 Input word count:', rawText ? rawText.split(/\s+/).length : 0, 'words');
  
  const text = cleanToPromptReady(rawText || '');
  const wordCount = text ? text.split(/\s+/).length : 0;
  const excerpt = buildExcerpt(text);
  const chunks = chunkText(text);
  
  console.log('📊 Chunks created:', chunks.length);
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}: ${chunk.text.length} chars, needsSummarization: ${chunk.needsSummarization}`);
  });

  const domain = (() => {
    try { return url ? new URL(url).hostname : ''; } catch { return ''; }
  })();

  let finalText = text;
  let processingMeta = { 
    chunksCreated: chunks.length,
    originalWordCount: wordCount,
    summarizationAttempted: false,
    summarizationSucceeded: false
  };

  // Check if summarization is needed and available
  const needsSummarization = shouldSummarize(chunks);
  console.log('🎯 Summarization needed:', needsSummarization);
  
  if (needsSummarization) {
    console.log('🎯 Proceeding with summarization...');
    try {
      if (onProgress) {
        onProgress({ 
          status: 'checking-summarizer', 
          message: 'Checking AI summarizer availability...' 
        });
      }

      const availability = await checkSummarizerAvailability();
      console.log('🎯 Summarizer availability:', availability);
      
      if (availability.available) {
        console.log('🎯 Summarizer is available, proceeding with chunk processing');
        if (onProgress) {
          onProgress({ 
            status: 'summarizing', 
            message: `Processing ${chunks.length} chunks with AI...`,
            chunks: chunks.length
          });
        }

        processingMeta.summarizationAttempted = true;
        
        const summaryResults = await processChunks(chunks, quizConfig, (progress) => {
          console.log('🎯 Chunk processing progress:', progress);
          if (onProgress) {
            onProgress({
              status: 'summarizing-chunk',
              message: `Processing chunk ${progress.current}/${progress.total}...`,
              progress: Math.round((progress.current / progress.total) * 100)
            });
          }
        });

        console.log('🎯 Summary results received:', summaryResults.length, 'results');
        const assembled = assembleSummaries(summaryResults);
        console.log('🎯 Assembled summary:', {
          wordCount: assembled.wordCount,
          textLength: assembled.text?.length,
          meta: assembled.meta
        });
        
        if (assembled.text && assembled.wordCount > 50) {
          finalText = assembled.text;
          processingMeta = {
            ...processingMeta,
            summarizationSucceeded: true,
            ...assembled.meta,
            finalWordCount: assembled.wordCount
          };

          console.log('🎯 Summarization successful! Final word count:', assembled.wordCount);
          if (onProgress) {
            onProgress({ 
              status: 'summarization-complete', 
              message: `Summarized to ${assembled.wordCount} words (${Math.round(assembled.meta.compressionRatio)}x compression)` 
            });
          }
        } else {
          console.log('🎯 Summarization result was too short, falling back to first chunk');
        }
      } else {
        console.warn('🎯 Summarizer not available:', availability.reason);
        if (onProgress) {
          onProgress({ 
            status: 'summarizer-unavailable', 
            message: `AI summarizer unavailable: ${availability.reason}. Using first chunk.`,
            warning: true
          });
        }
        // Fallback to first chunk
        finalText = chunks[0]?.text || text.slice(0, 12000);
      }
    } catch (error) {
      console.error('🎯 Summarization failed:', error);
      if (onProgress) {
        onProgress({ 
          status: 'summarization-failed', 
          message: `Summarization failed: ${error.message}. Using first chunk.`,
          error: true
        });
      }
      // Fallback to first chunk
      finalText = chunks[0]?.text || text.slice(0, 12000);
    }
  } else {
    // Small content, use as-is
    console.log('🎯 Content is small enough, no summarization needed');
    if (onProgress) {
      onProgress({ 
        status: 'no-summarization-needed', 
        message: 'Content is small enough, no summarization needed.' 
      });
    }
  }

  // Rechunk the final text for quiz generation
  const finalChunks = chunkText(finalText);
  console.log('🎯 Final text length after processing:', finalText.length, 'characters');
  console.log('🎯 Final word count after processing:', finalText.split(/\s+/).length, 'words');
  console.log('🎯 Final chunks count after processing:', finalChunks.length);

  return {
    sourceType,
    title: title || 'Untitled',
    url: url || '',
    domain,
    excerpt: buildExcerpt(finalText),
    wordCount: finalText.split(/\s+/).length,
    chunks: finalChunks,
    text: finalText,
    meta: {
      ...meta,
      processing: processingMeta
    }
  };
}

export async function extractFromCurrentPage(quizConfig = {}, onProgress = null) {
  if (onProgress) {
    onProgress({ status: 'extracting-dom', message: 'Extracting page content...' });
  }

  // Check if a specific tab was selected
  let extractionResult;
  if (quizConfig.selectedTab && quizConfig.selectedTab.id) {
    // Extract from the specific selected tab
    extractionResult = await extractionService.getDOMHTML(quizConfig.selectedTab.id);
  } else {
    // Extract from the current active tab
    extractionResult = await extractionService.getDOMHTML();
  }
  
  const { html, title, url } = extractionResult;
  
  if (onProgress) {
    onProgress({ 
      status: 'processing-readability', 
      message: `Processing with Readability...`,
      tabTitle: quizConfig.selectedTab?.title || title
    });
  }

  const readable = extractReadableFromHTML(html, url);

  return finalizeSource({
    sourceType: SOURCE_TYPE.PAGE,
    title: readable.title || title || (quizConfig.selectedTab?.title),
    url: url || quizConfig.selectedTab?.url || '',
    rawText: readable.text,
    meta: { 
      byline: readable.byline || '', 
      length: readable.length || 0,
      selectedTab: quizConfig.selectedTab // Include selected tab info in meta
    },
    quizConfig,
    onProgress
  });
}

export async function extractFromSelection(quizConfig = {}, onProgress = null) {
  if (onProgress) {
    onProgress({ status: 'extracting-selection', message: 'Getting selected text...' });
  }

  const { text, title, url } = await extractionService.getSelectionText();

  return finalizeSource({
    sourceType: SOURCE_TYPE.SELECTION,
    title: title || 'Selection',
    url,
    rawText: text,
    quizConfig,
    onProgress
  });
}

export async function extractFromPDFResult({ text, fileName, pageCount = 0 }, quizConfig = {}, onProgress = null) {
  if (onProgress) {
    onProgress({ status: 'processing-pdf', message: `Processing PDF: ${fileName}` });
  }

  return finalizeSource({
    sourceType: SOURCE_TYPE.PDF,
    title: fileName || 'PDF Document',
    url: '',
    rawText: text,
    meta: { pageCount, fileName },
    quizConfig,
    onProgress
  });
}

export function normalizeManualTopic(topic = '', context = '', quizConfig = {}, onProgress = null) {
  // Manual topics don't need summarization
  if (onProgress) {
    onProgress({ status: 'processing-manual-topic', message: 'Processing custom topic...' });
  }
  
  const text = cleanToPromptReady(context || topic);
  const chunks = chunkText(text);

  return {
    sourceType: SOURCE_TYPE.MANUAL,
    title: topic || 'Custom Topic',
    url: '',
    domain: '',
    excerpt: buildExcerpt(text),
    wordCount: text ? text.split(/\s+/).length : 0,
    chunks,
    text,
    meta: {
      processing: {
        chunksCreated: chunks.length,
        originalWordCount: text.split(/\s+/).length,
        summarizationAttempted: false,
        summarizationSucceeded: false
      }
    }
  };
}

// Helper for checking summarizer status
export { checkSummarizerAvailability };
