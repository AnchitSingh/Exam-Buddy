// src/utils/contentCleaner.js
/**
 * Content Cleaner for On-Device LLM Processing
 * Cleans web-selected text (especially scientific/Wikipedia content) 
 * to prevent crashes and improve quiz generation quality.
 * 
 * @module contentCleaner
 * @version 2.1.0 - BUGFIX RELEASE
 */

// ============================================================================
// BASIC TEXT NORMALIZATION
// ============================================================================

/**
 * Normalizes whitespace characters in text
 * @param {string} text - Input text
 * @returns {string} Normalized text
 */
export function normalizeWhitespace(text) {
  if (!text) return '';
  return text
    .replace(/\u00A0/g, ' ')      // non-breaking space
    .replace(/\s+\n/g, '\n')      // trim trailing spaces on lines
    .replace(/\n{3,}/g, '\n\n')   // collapse excessive blank lines
    .replace(/[ \t]{2,}/g, ' ')   // collapse multiple spaces/tabs
    .trim();
}

/**
 * Creates an excerpt from text with smart truncation
 * @param {string} text - Input text
 * @param {number} max - Maximum length (default: 240)
 * @returns {string} Truncated excerpt
 */
export function buildExcerpt(text, max = 240) {
  if (!text) return '';
  const clean = normalizeWhitespace(text);
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const cutPoint = lastSpace > max * 0.5 ? lastSpace : max;

  return `${cut.slice(0, cutPoint).trim()}…`;
}

/**
 * Removes duplicate lines while preserving structure
 * FIXED: Now preserves blank lines for readability
 * @param {string} text - Input text
 * @returns {string} De-duplicated text
 */
export function dedupeRepeatingLines(text) {
  const lines = normalizeWhitespace(text).split('\n');
  const seen = new Set();
  const out = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Always keep empty lines (for paragraph structure)
    if (!trimmed) {
      // But don't allow more than 2 consecutive empty lines
      const lastTwo = out.slice(-2);
      if (lastTwo.every(l => !l.trim())) {
        continue; // Skip this empty line
      }
      out.push(line);
      continue;
    }

    // Dedupe non-empty lines (case-insensitive)
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(line);
    }
  }

  return out.join('\n');
}

/**
 * General purpose cleaning - combines normalization and deduplication
 * @param {string} text - Input text
 * @returns {string} Cleaned text
 */
export function cleanToPromptReady(text) {
  if (!text) return '';
  return normalizeWhitespace(dedupeRepeatingLines(text));
}

// ============================================================================
// SPECIALIZED CLEANERS
// ============================================================================

/**
 * Removes invisible/zero-width characters that break tokenizers
 * @param {string} text - Input text
 * @returns {string} Text without invisible characters
 */
function removeInvisibleChars(text) {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Zero-width spaces
    .replace(/\u00AD/g, '')                  // Soft hyphens
    .replace(/[\u202A-\u202E]/g, '');        // RTL/LTR marks
}

/**
 * Removes HTML tags and decodes entities
 * OPTIMIZED: No longer recreates RegExp objects
 * @param {string} text - Input text
 * @returns {string} Text without HTML artifacts
 */
function cleanHtmlArtifacts(text) {
  // Remove HTML/XML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities (optimized)
  const entities = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
    '&mdash;': '--',
    '&ndash;': '-',
    '&hellip;': '...',
    '&#39;': "'",
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
    '&middot;': '*',
    '&bull;': '*',
    '&deg;': ' degrees',  // FIXED: Added degree symbol
  };

  // Use split/join instead of RegExp for literal strings (faster)
  for (const [entity, replacement] of Object.entries(entities)) {
    text = text.split(entity).join(replacement);
  }

  // Decode numeric HTML entities
  text = text.replace(/&#(\d+);/g, (match, dec) => {
    try {
      return String.fromCharCode(parseInt(dec, 10));
    } catch {
      return ' ';
    }
  });

  // Decode hex entities
  text = text.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return ' ';
    }
  });

  return text;
}


/**
 * Removes Wikipedia-specific navigation and citation artifacts
 * @param {string} text - Input text
 * @returns {string} Text without Wikipedia artifacts
 */
function cleanWikipediaArtifacts(text) {
  return text
    .replace(/Jump to (navigation|search|content)/gi, '')
    .replace(/From Wikipedia, the free encyclopedia/gi, '')
    .replace(/\[edit\]/gi, '')
    .replace(/\[citation needed\]/gi, '')
    .replace(/\[clarification needed\]/gi, '')
    .replace(/\[when\?\]/gi, '')
    .replace(/\[who\?\]/gi, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[[\d,\s]+\]/g, '')
    .replace(/^\s*\^.*/gm, '')
    .replace(/^\s*Main article:\s*.*/gmi, '')
    .replace(/^\s*See also:\s*.*/gmi, '');
}


/**
 * Removes inline mathematical expressions (LaTeX delimiters)
 * @param {string} text - Input text
 * @returns {string} Text with equations replaced
 */
function cleanInlineMath(text) {
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, ' [equation] ')
    .replace(/\$[^$\n]{1,200}\$/g, ' [equation] ')
    .replace(/\\\([\s\S]*?\\\)/g, ' [equation] ')
    .replace(/\\\[[\s\S]*?\\\]/g, ' [equation] ');
}

/**
 * Removes LaTeX and scientific notation
 * FIXED: Better handling of nested braces with iterative approach
 * @param {string} text - Input text
 * @returns {string} Text with scientific notation cleaned
 */
function cleanScientificText(text) {
  // Step 1: Remove LaTeX display blocks ({\displaystyle ...})
  text = text.replace(/\{\\displaystyle[\s\S]*?\}/g, ' [equation] ');

  // Step 2: Remove common LaTeX environments
  text = text.replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, ' [equation] ');

  // Step 3: Remove LaTeX commands (\mathbf, \nabla, etc.)
  text = text.replace(/\\[a-zA-Z]+(\[[^\]]*\])?(\{[^}]*\})?/g, ' ');

  // Step 4: Clean nested braces iteratively
  let prevText;
  let iterations = 0;
  do {
    prevText = text;
    // Remove innermost braces with LaTeX-like content
    text = text.replace(/\{[^{}]*\\[a-zA-Z]+[^{}]*\}/g, ' [math] ');
    text = text.replace(/\{[^{}]*\}/g, ' ');
    iterations++;
  } while (prevText !== text && iterations < 5); // Safety limit

  // Step 5: Remove any remaining backslash commands
  text = text.replace(/\\[a-zA-Z]+/g, '');
  text = text.replace(/\\/g, '');

  // Step 6: Filter out equation fragment lines
  const lines = text.split('\n');
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();

    // Keep substantial lines
    if (trimmed.length < 3) return false;

    // Count actual words (2+ letters)
    const words = (trimmed.match(/\b[a-zA-Z]{2,}\b/g) || []);
    if (words.length === 0) return false;

    // Check letter-to-total ratio
    const letters = (trimmed.match(/[a-zA-Z]/g) || []).length;
    const ratio = letters / trimmed.length;

    // Keep lines with reasonable text content
    if (ratio < 0.3) return false;

    // Skip if it's mostly equation placeholders
    if (trimmed.match(/\[equation\]/g)?.length > 3) return false;

    return true;
  });

  return cleanedLines.join('\n');
}

/**
 * Normalizes Unicode mathematical symbols to ASCII equivalents
 * FIXED: Added missing Greek letters, special symbols, and smarter superscript handling
 * @param {string} text - Input text
 * @returns {string} Text with normalized math symbols
 */
function normalizeUnicodeMath(text) {
  // FIRST: Convert multi-character superscript/subscript sequences
  // This prevents 10²³ from becoming 10^2^3
  text = text.replace(/([0-9.]+)([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾]+)/g, (match, base, superscripts) => {
    const superMap = {
      '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
      '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
      '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')'
    };
    const converted = superscripts.split('').map(c => superMap[c] || c).join('');
    return `${base}^${converted}`;
  });

  text = text.replace(/([a-zA-Z0-9.]+)([₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]+)/g, (match, base, subscripts) => {
    const subMap = {
      '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
      '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
      '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')'
    };
    const converted = subscripts.split('').map(c => subMap[c] || c).join('');
    return `${base}_${converted}`;
  });

  // THEN: Apply individual character replacements
  const mathMap = {
    // Greek letters (lowercase)
    'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
    'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta',
    'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda',
    'μ': 'mu', 'µ': 'mu',  // FIXED: Both mu variants
    'ν': 'nu', 'ξ': 'xi', 'π': 'pi', 'ρ': 'rho',
    'σ': 'sigma', 'ς': 'sigma', 'τ': 'tau', 'υ': 'upsilon',
    'φ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega',

    // Greek letters (uppercase) - FIXED: Added missing ones
    'Α': 'Alpha', 'Β': 'Beta', 'Γ': 'Gamma', 'Δ': 'Delta',
    'Ε': 'Epsilon', 'Ζ': 'Zeta', 'Η': 'Eta', 'Θ': 'Theta',
    'Ι': 'Iota', 'Κ': 'Kappa', 'Λ': 'Lambda', 'Μ': 'Mu',
    'Ν': 'Nu', 'Ξ': 'Xi', 'Π': 'Pi', 'Ρ': 'Rho',
    'Σ': 'Sigma', 'Τ': 'Tau', 'Υ': 'Upsilon', 'Φ': 'Phi',
    'Χ': 'Chi', 'Ψ': 'Psi', 'Ω': 'Omega',  // FIXED: Added Psi

    // Math operators
    '∫': 'integral', '∬': 'double-integral', '∭': 'triple-integral',
    '∑': 'sum', '∏': 'product',
    '√': 'sqrt', '∛': 'cbrt', '∜': 'fourthrt',
    '∞': 'infinity', '∂': 'partial', '∇': 'nabla', '∆': 'delta',

    // Relations
    '≈': '~', '≠': '!=', '≤': '<=', '≥': '>=',
    '≡': '===', '≢': '!==',
    '±': '+/-', '∓': '-/+',
    '×': 'x', '·': '*', '÷': '/',

    // Arrows
    '→': '->', '←': '<-', '↔': '<->',
    '⇒': '=>', '⇐': '<=', '⇔': '<=>',
    '↑': '^', '↓': 'v',

    // Special symbols - FIXED: Added these
    '°': ' degrees',  // Degree symbol
    '℃': ' degrees C', '℉': ' degrees F',
    '℃': 'C', '℉': 'F',
    '℮': 'e',
    'ℏ': 'h-bar',  // FIXED: Added h-bar (Planck constant)
    'ℓ': 'l',
    'ℕ': 'N', 'ℤ': 'Z', 'ℚ': 'Q', 'ℝ': 'R', 'ℂ': 'C',

    // Other common symbols
    '′': "'", '″': '"', '‴': "'''",
    '∅': 'empty-set', '∈': 'in', '∉': 'not-in',
    '⊂': 'subset', '⊃': 'superset',
    '∀': 'forall', '∃': 'exists',
    '∧': 'and', '∨': 'or', '¬': 'not',

    // Remaining individual super/subscripts (fallback)
    '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4',
    '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9',
    '⁺': '^+', '⁻': '^-', '⁼': '^=',

    '₀': '_0', '₁': '_1', '₂': '_2', '₃': '_3', '₄': '_4',
    '₅': '_5', '₆': '_6', '₇': '_7', '₈': '_8', '₉': '_9',
    '₊': '_+', '₋': '_-', '₌': '_=',
  };

  for (const [unicode, replacement] of Object.entries(mathMap)) {
    text = text.split(unicode).join(replacement);
  }

  return text;
}

/**
 * Removes table artifacts and formatting
 * @param {string} text - Input text
 * @returns {string} Text without table formatting
 */
function cleanTableArtifacts(text) {
  const lines = text.split('\n');
  const cleaned = lines.filter(line => {
    const trimmed = line.trim();

    // Remove pure separator lines (---, ===, |--|--|)
    if (/^[\s\-=|:+]+$/.test(trimmed)) return false;

    // Remove lines with excessive pipes (likely table rows)
    const pipeCount = (trimmed.match(/\|/g) || []).length;
    if (pipeCount > 2) return false;

    return true;
  });

  // Remove remaining stray pipes and plus signs from tables
  return cleaned.join('\n')
    .replace(/\|/g, ' ')
    .replace(/\+/g, ' ');
}

/**
 * Removes emoji and other pictographs
 * @param {string} text - Input text
 * @returns {string} Text without emoji
 */
function removeEmoji(text) {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')  // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')  // Misc Symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')  // Transport
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '')  // Alchemical
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')  // Geometric Shapes
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')  // Arrows-C
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')  // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')  // Chess
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')  // Extended-A
    .replace(/[\u{2600}-\u{26FF}]/gu, '')    // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '');   // Dingbats
}

/**
 * Ensures text is safe for JSON serialization
 * @param {string} text - Input text
 * @returns {string} JSON-safe text
 */
function escapeForJson(text) {
  return text
    // Remove control characters (except newline and tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove any null bytes
    .replace(/\0/g, '');
}

/**
 * Validates that cleaned text has sufficient meaningful content
 * @param {string} text - Cleaned text
 * @param {number} minWords - Minimum word count
 * @returns {Object} Validation result
 */
function validateCleanedText(text, minWords = 10) {
  const words = (text.match(/\b[a-zA-Z]{2,}\b/g) || []);
  const wordCount = words.length;

  const placeholders = (text.match(/\[(equation|math|code|link|email)\]/gi) || []);
  const placeholderCount = placeholders.length;

  const result = {
    valid: true,
    wordCount,
    placeholderCount,
    warnings: [],
  };

  if (wordCount < minWords) {
    result.valid = false;
    result.warnings.push('Insufficient words: ' + wordCount + ' < ' + minWords);
  }

  if (wordCount > 0 && placeholderCount / wordCount > 0.5) {
    result.warnings.push('High placeholder ratio: ' + placeholderCount + '/' + wordCount);
  }

  if (text.trim().length < 50) {
    result.valid = false;
    result.warnings.push('Cleaned text too short');
  }

  return result;
}

function cleanCodeBlocks(text) {
  return text
    .replace(/```[\w]*\n[\s\S]*?\n```/g, ' [code block] ')
    .replace(/```[\s\S]*?```/g, ' [code block] ')
    .replace(/`[^`\n]+`/g, ' ')
    .replace(/\n {4,}.+/g, '');
}

function cleanUrls(text) {
  // Replace URLs with placeholder or remove
  text = text.replace(/https?:\/\/[^\s]+/g, ' [link] ');

  // Remove email addresses too
  text = text.replace(/[\w.-]+@[\w.-]+\.\w+/g, ' [email] ');

  return text;
}

// ============================================================================
// MAIN CLEANING FUNCTION
// ============================================================================

/**
 * Main function to clean web-selected text for on-device LLM processing.
 * Handles scientific papers, Wikipedia, code, tables, and general web content.
 * 
 * @param {string} text - Raw selected text from web page
 * @param {Object} options - Configuration options
 * @param {number} options.maxLength - Maximum output length (default: 5000)
 * @param {number} options.minWords - Minimum words to consider valid (default: 10)
 * @param {boolean} options.aggressiveUnicode - Remove all non-ASCII (default: false)
 * @param {boolean} options.preserveEquations - Keep equation context (default: false)
 * @param {boolean} options.silent - Suppress warnings (default: false)
 * @returns {string} Cleaned text ready for LLM prompting
 */
export function cleanSelectionText(text, options = {}) {
  const {
    maxLength = 5000,
    minWords = 10,
    aggressiveUnicode = false,
    preserveEquations = false,
    silent = false,
  } = options;

  // Early return for empty input
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Store original for fallback
  const originalLength = text.length;
  let cleaned = text;

  try {
    // Phase 1: Remove invisible/problematic characters
    cleaned = removeInvisibleChars(cleaned);
    cleaned = escapeForJson(cleaned);

    // Phase 2: Remove HTML and web artifacts
    cleaned = cleanHtmlArtifacts(cleaned);
    cleaned = cleanUrls(cleaned);

    // Phase 3: Remove content-specific structures
    cleaned = cleanCodeBlocks(cleaned);
    cleaned = cleanTableArtifacts(cleaned);
    cleaned = cleanWikipediaArtifacts(cleaned);

    // Phase 4: Clean mathematical/scientific content
    cleaned = cleanInlineMath(cleaned);
    cleaned = cleanScientificText(cleaned);

    if (!preserveEquations) {
      cleaned = normalizeUnicodeMath(cleaned);
    }

    // Phase 5: Remove emoji and pictographs
    cleaned = removeEmoji(cleaned);

    // Phase 6: Aggressive Unicode removal (if requested)
    if (aggressiveUnicode) {
      cleaned = cleaned.replace(/[^\x00-\x7F]/g, '');
    }

    // Phase 7: Final text normalization
    cleaned = cleanToPromptReady(cleaned);

    // Phase 8: Length limiting (with smart truncation)
    if (cleaned.length > maxLength) {
      const truncated = cleaned.substring(0, maxLength);
      const lastPeriod = truncated.lastIndexOf('.');
      const lastNewline = truncated.lastIndexOf('\n');
      const cutPoint = Math.max(lastPeriod, lastNewline);

      if (cutPoint > maxLength * 0.8) {
        cleaned = truncated.substring(0, cutPoint + 1);
      } else {
        cleaned = truncated + '...';
      }
    }

    // Phase 9: Validation
    const validation = validateCleanedText(cleaned, minWords);

    if (!validation.valid) {
      if (!silent) {
        console.warn('[cleanSelectionText] Validation failed:', validation.warnings);
      }

      // Fallback: return truncated original if cleaning destroyed content
      const fallback = text.substring(0, maxLength);
      return normalizeWhitespace(fallback);
    }

    // Log warnings if any
    if (!silent && validation.warnings.length > 0) {
      console.info('[cleanSelectionText] Warnings:', validation.warnings);
    }

    return cleaned;

  } catch (error) {
    // Safety net: return original text on any error
    if (!silent) {
      console.error('[cleanSelectionText] Error during cleaning:', error);
    }
    return normalizeWhitespace(text.substring(0, maxLength));
  }
}

// ============================================================================
// TESTING & DEBUGGING UTILITIES
// ============================================================================

/**
 * Exports internal functions for testing purposes
 * Usage: import { __testing__ } from './contentCleaner.js'
 */
export const __testing__ = {
  removeInvisibleChars,
  cleanHtmlArtifacts,
  cleanWikipediaArtifacts,
  cleanUrls,
  cleanInlineMath,
  cleanScientificText,
  normalizeUnicodeMath,
  cleanCodeBlocks,
  cleanTableArtifacts,
  removeEmoji,
  escapeForJson,
  validateCleanedText,
};

/**
 * Analyzes text and returns detailed cleaning statistics
 * Useful for debugging and understanding what was cleaned
 * 
 * @param {string} originalText - Original text
 * @param {string} cleanedText - Cleaned text
 * @returns {Object} Detailed statistics
 */
export function analyzeCleaningImpact(originalText, cleanedText) {
  const stats = {
    original: {
      length: originalText.length,
      lines: originalText.split('\n').length,
      words: (originalText.match(/\b\w+\b/g) || []).length,
    },
    cleaned: {
      length: cleanedText.length,
      lines: cleanedText.split('\n').length,
      words: (cleanedText.match(/\b\w+\b/g) || []).length,
    },
    removed: {
      length: originalText.length - cleanedText.length,
      percentage: ((1 - cleanedText.length / originalText.length) * 100).toFixed(1),
    },
    placeholders: {
      equations: (cleanedText.match(/\[equation\]/g) || []).length,
      math: (cleanedText.match(/\[math\]/g) || []).length,
      code: (cleanedText.match(/\[code/g) || []).length,
      links: (cleanedText.match(/\[link\]/g) || []).length,
    },
  };

  return stats;
}

/**
 * Debugging helper: Shows step-by-step cleaning process
 * @param {string} text - Input text
 * @returns {Object} Step-by-step results
 */
export function debugCleaningSteps(text) {
  const steps = {};

  steps.original = text;
  steps.afterInvisible = removeInvisibleChars(text);
  steps.afterHtml = cleanHtmlArtifacts(steps.afterInvisible);
  steps.afterUrls = cleanUrls(steps.afterHtml);
  steps.afterCode = cleanCodeBlocks(steps.afterUrls);
  steps.afterTables = cleanTableArtifacts(steps.afterCode);
  steps.afterWikipedia = cleanWikipediaArtifacts(steps.afterTables);
  steps.afterInlineMath = cleanInlineMath(steps.afterWikipedia);
  steps.afterScientific = cleanScientificText(steps.afterInlineMath);
  steps.afterUnicodeMath = normalizeUnicodeMath(steps.afterScientific);
  steps.afterEmoji = removeEmoji(steps.afterUnicodeMath);
  steps.afterJson = escapeForJson(steps.afterEmoji);
  steps.final = cleanToPromptReady(steps.afterJson);

  return steps;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default cleanSelectionText;
