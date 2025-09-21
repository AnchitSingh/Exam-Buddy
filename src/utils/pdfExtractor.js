// src/utils/pdfExtractor.js
// Client-side PDF text extraction via PDF.js; expects pdfjs-dist to be installed or available. 

let pdfjsLib;

async function ensurePdfJs() {
  if (pdfjsLib) return pdfjsLib;
  try {
    // Prefer local bundle if installed
    pdfjsLib = await import('pdfjs-dist/build/pdf');
    const worker = await import('pdfjs-dist/build/pdf.worker.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = worker;
  } catch (e) {
    // As a fallback, try CDN (optional: you can remove this to force local install)
    throw new Error('PDF.js not available; install pdfjs-dist or configure worker.');
  }
  return pdfjsLib;
}

export async function extractTextFromPDF(input) {
  const lib = await ensurePdfJs();

  // Support File/Blob/ArrayBuffer/URL
  let data;
  if (input instanceof Blob) {
    data = await input.arrayBuffer();
  } else if (typeof input === 'string') {
    data = input; // URL string
  } else if (input instanceof ArrayBuffer) {
    data = input;
  } else {
    throw new Error('Unsupported PDF input; provide File/Blob/ArrayBuffer/URL.');
  }

  const loadingTask = lib.getDocument(data);
  const pdf = await loadingTask.promise;
  const meta = { pageCount: pdf.numPages };

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => it.str).filter(Boolean);
    fullText += strings.join(' ') + '\n\n';
  }

  return {
    text: fullText.trim(),
    meta
  };
}
