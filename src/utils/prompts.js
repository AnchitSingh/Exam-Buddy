// src/utils/prompts.js

function trimAndCap(text, max = 6000) {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }
  
  export function buildQuizPrompt({ extractedSource, config }) {
    const {
      title, domain, chunks = [], text = ''
    } = extractedSource || {};
    const {
      questionCount = 5,
      difficulty = 'medium',
      questionTypes = ['MCQ'], // MCQ | True/False | Short Answer | Fill in Blank
      immediateFeedback = true
    } = config || {};
  
    // Prefer first chunk to stay small/on-device-friendly; caller can iterate for more coverage if needed.
    const sourceSnippet = chunks?.[0]?.text || text || '';
    const safeSource = trimAndCap(sourceSnippet, 5500);
  
    return `
  You are generating an adaptive quiz from the provided source text. Use only the information in the text. Keep questions concise and unambiguous.
  
  Constraints:
  - number_of_questions: ${questionCount}
  - allowed_types: ${questionTypes.join(', ')}
  - difficulty: ${difficulty}
  - output: JSON only, no prose.
  
  JSON schema (shape and keys to follow):
  {
    "questions": [
      {
        "id": "string",
        "type": "MCQ | True/False | Short Answer | Fill in Blank",
        "stem": "string",
        "options": [{"text": "string", "isCorrect": boolean}]  // required for MCQ/True/False
        "correctAnswer": 0, // index for MCQ or True/False
        "canonicalAnswers": ["string", "..."], // for Short Answer / Fill in Blank
        "explanation": "string",
        "tags": ["string"]
      }
    ],
    "meta": {
      "sourceTitle": "${title || ''}",
      "sourceDomain": "${domain || ''}"
    }
  }
  
  Source:
  """
  ${safeSource}
  """
  Return JSON only.
  `.trim();
  }
  
  export function buildEvaluatePrompt({ question, canonical, userAnswer }) {
    const stem = question?.stem || '';
    const canonicalList = Array.isArray(canonical) ? canonical : (question?.canonicalAnswers || []);
    const safeCanon = canonicalList.slice(0, 6).join('\n- ');
    const safeUser = (userAnswer || '').slice(0, 1500);
  
    return `
  You evaluate a learner's short answer using the rubric below. Be strict but fair and concise.
  
  Rubric:
  - Compare key ideas to reference answer.
  - Accept equivalent wording.
  - Penalize missing core concepts or contradictions.
  
  Return JSON only:
  {
    "isCorrect": boolean,
    "score": number, // 0.0 to 1.0
    "rationale": "string", // <= 2 sentences
    "tip": "string" // 1 actionable suggestion
  }
  
  Question:
  "${stem}"
  
  Reference key points:
  - ${safeCanon}
  
  Learner answer:
  "${safeUser}"
  
  Return JSON only.
  `.trim();
  }
  
  export function buildRecommendPrompt({ summary }) {
    // summary includes per-tag accuracy, list of misses, and short section names.
    const compact = JSON.stringify(summary || {}).slice(0, 5500);
  
    return `
  You are a study coach. Read the quiz performance summary and produce a concise study plan.
  
  Performance summary (JSON):
  ${compact}
  
  Return JSON only:
  {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "nextSteps": [
      { "topic": "string", "action": "string", "count": 3 }
    ]
  }
  `.trim();
  }
  