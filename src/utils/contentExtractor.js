// src/utils/contentExtractor.js
// Orchestrates extraction for: current page, selection, and PDF, returning a normalized source.

import { cleanToPromptReady, buildExcerpt } from './contentCleaner';
import { chunkText } from './textChunker';
import { extractReadableFromHTML } from './readabilityClient';
import { SOURCE_TYPE } from './messages';
import extractionService from '../services/extraction';

function finalizeSource({ sourceType, title, url, rawText, meta = {} }) {
  const text = cleanToPromptReady(rawText || '');
  const wordCount = text ? text.split(/\s+/).length : 0;
  const excerpt = buildExcerpt(text);
  const chunks = chunkText(text);
  const domain = (() => {
    try { return url ? new URL(url).hostname : ''; } catch { return ''; }
  })();

  return {
    sourceType,
    title: title || 'Untitled',
    url: url || '',
    domain,
    excerpt,
    wordCount,
    chunks,
    text,
    meta
  };
}

export async function extractFromCurrentPage() {
  // Ask content script for DOM HTML, then run Readability in our context.
  const { html, title, url } = await extractionService.getDOMHTML();
  const readable = extractReadableFromHTML(html, url);
  return finalizeSource({
    sourceType: SOURCE_TYPE.PAGE,
    title: readable.title || title,
    url,
    rawText: readable.text,
    meta: { byline: readable.byline || '', length: readable.length || 0 }
  });
}

export async function extractFromSelection() {
  const { text, title, url } = await extractionService.getSelectionText();
  return finalizeSource({
    sourceType: SOURCE_TYPE.SELECTION,
    title: title || 'Selection',
    url,
    rawText: text
  });
}

export async function extractFromPDFResult({ text, fileName, pageCount = 0 }) {
  // This variant accepts already-extracted PDF text (use pdfExtractor in UI flow).
  return finalizeSource({
    sourceType: SOURCE_TYPE.PDF,
    title: fileName || 'PDF Document',
    url: '',
    rawText: text,
    meta: { pageCount, fileName }
  });
}

export function normalizeManualTopic(topic = '', context = '') {
  // Normalize manual input into the same source shape (no automatic text).
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
    meta: {}
  };
}
