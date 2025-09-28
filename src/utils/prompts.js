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
      questionTypes = ['MCQ'],
      immediateFeedback = true
    } = config || {};
    
    const sourceSnippet = chunks?.[0]?.text || text || '';
    
    // Handle minimal content by expanding the topic
    let expandedContent = sourceSnippet;
    if (sourceSnippet.length < 50) {
      expandedContent = `Topic: ${sourceSnippet}. Generate questions about this topic using your knowledge.`;
    }
    
    const safeSource = trimAndCap(expandedContent, 5500);
    
    return `You are generating a quiz about the following topic. Create educational questions that test understanding of key concepts.
  
  Topic/Content: "${safeSource}"
  
  Generate exactly ${questionCount} questions with these constraints:
  - Question types MUST be one of: ${questionTypes.join(', ')}
  - Difficulty: ${difficulty}
  - Each MCQ needs exactly 4 options, with one marked as correct.
  - Each True/False needs exactly 2 options: [{ "text": "True", "isCorrect": boolean }, { "text": "False", "isCorrect": boolean }], with one marked as correct.
  
  Return ONLY valid JSON with this exact structure:
  {
    "questions": [
      {
        "type": "MCQ",
        "question": "Clear question text here?",
        "options": [
          { "text": "Option A", "isCorrect": true },
          { "text": "Option B", "isCorrect": false },
          { "text": "Option C", "isCorrect": false },
          { "text": "Option D", "isCorrect": false }
        ],
        "explanation": "Why this is correct",
        "difficulty": "${difficulty}",
        "subject": "${title || 'General'}"
      }
    ]
  }`;
  }
  

export function buildEvaluatePrompt({ question, canonical, userAnswer }) {
    const questionText = question?.question || question?.stem || '';
    const correctAnswer = question?.correctAnswer || canonical;
    const safeUser = (userAnswer || '').slice(0, 1500);

    return `You evaluate a learner's answer using the rubric below. Be strict but fair.
  
  Rubric:
  - Compare key ideas to reference answer
  - Accept equivalent wording
  - Penalize missing core concepts or contradictions
  
  Return JSON with this EXACT structure:
  {
    "isCorrect": boolean,
    "score": number, // 0.0 to 1.0
    "feedback": {
      "message": "string (brief assessment)",
      "explanation": "string (detailed explanation)"
    },
    "explanation": "string (why this answer is/isn't correct)"
  }
  
  Question: "${questionText}"
  Correct Answer: "${correctAnswer}"
  Student Answer: "${safeUser}"
  
  Return valid JSON only:`.trim();
}

export function buildRecommendPrompt({ summary }) {
    const compact = JSON.stringify(summary || {}).slice(0, 5500);

    return `You are a study coach. Read the quiz performance summary and produce a study plan.
  
  Performance summary: ${compact}
  
  Return JSON with this EXACT structure:
  {
    "strengths": ["string", "string"],
    "weaknesses": ["string", "string"], 
    "nextSteps": ["string", "string", "string"]
  }
  
  Each array should contain 2-4 concise items.
  Return valid JSON only:`.trim();
}
