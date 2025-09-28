// src/utils/prompts.js
function trimAndCap(text, max = 6000) {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function buildQuizPrompt({ extractedSource, config }) {
    const { title, domain, chunks = [], text = '' } = extractedSource || {};
    const {
        questionCount = 5,
        difficulty = 'medium',
        questionTypes = ['MCQ'],
        immediateFeedback = true
    } = config || {};

    const sourceSnippet = chunks?.[0]?.text || text || '';

    // Handle minimal content by expanding the topic
    let expandedContent = sourceSnippet;
    if ((sourceSnippet || '').length < 50) {
        expandedContent = `Topic: ${sourceSnippet}. Generate questions about this topic using your knowledge.`;
    }

    const safeSource = trimAndCap(expandedContent, 5500);

    // Normalize types to a constrained set Gemma can follow reliably
    const normalize = (t) => {
        const s = String(t || '').toLowerCase().replace(/[\s/_-]+/g, '');
        if (s === 'truefalse' || s === 'true' || s === 'tf') return 'TrueFalse';
        if (s === 'mcq' || s === 'multiplechoice') return 'MCQ';
        if (s === 'subjective' || s === 'shortanswer') return 'Subjective';
        if (s === 'fillup' || s === 'fillintheblank' || s === 'fillups' || s === 'fitb') return 'FillUp';
        return 'MCQ';
    };

    const allowedTypes = Array.from(new Set((questionTypes || []).map(normalize)));
    const types = allowedTypes.length ? allowedTypes : ['MCQ'];

    // Even distribution with stable remainder allocation
    const base = Math.floor(questionCount / types.length);
    const remainder = questionCount - base * types.length;
    const typeDistribution = types.map((type, i) => ({
        type,
        count: base + (i < remainder ? 1 : 0),
    }));

    const distributionText = typeDistribution.map(x => `${x.count} ${x.type}`).join(', ');

    // Conditional few-shot exemplars (short, flat, schema-conformant)
    const exMCQ = `{
    "id": "ex1",
    "type": "MCQ",
    "text": "Which data structure uses FIFO order?",
    "options": [
      {"text": "Queue", "correct": true},
      {"text": "Stack", "correct": false},
      {"text": "Tree", "correct": false},
      {"text": "Graph", "correct": false}
    ],
    "explanation": "A queue processes elements in first-in, first-out order.",
    "difficulty": "${difficulty}",
    "topic": "${title || 'General'}"
  }`;

    const exTF = `{
    "id": "ex2",
    "type": "TrueFalse",
    "text": "Bubble sort has an average time complexity of O(n^2).",
    "options": [
      {"text": "True", "correct": true},
      {"text": "False", "correct": false}
    ],
    "explanation": "Bubble sort is quadratic on average.",
    "difficulty": "${difficulty}",
    "topic": "${title || 'General'}"
  }`;

    const exSubj = `{
    "id": "ex3",
    "type": "Subjective",
    "text": "Explain the difference between supervised and unsupervised learning in 40–60 words.",
    "answer": "Supervised learning uses labeled data to learn input-output mappings for tasks like classification or regression, while unsupervised learning finds structure in unlabeled data through methods like clustering or dimensionality reduction. The key difference is the presence of labels guiding the learning objective.",
    "explanation": "Answer should mention labels, mapping vs structure discovery, and examples.",
    "difficulty": "${difficulty}",
    "topic": "${title || 'General'}"
  }`;

    const exFill = `{
    "id": "ex4",
    "type": "FillUp",
    "text": "The bias–variance trade‑off is central to model _____.",
    "answer": "generalization",
    "explanation": "It relates to how well a model generalizes to unseen data.",
    "difficulty": "${difficulty}",
    "topic": "${title || 'General'}"
  }`;

    const examples = []
        .concat(types.includes('MCQ') ? [exMCQ] : [])
        .concat(types.includes('TrueFalse') ? [exTF] : [])
        .concat(types.includes('Subjective') ? [exSubj] : [])
        .concat(types.includes('FillUp') ? [exFill] : [])
        .join('\n\n');

    // Build Gemma-style chat prompt with explicit turn markers
    // If using HF apply_chat_template, pass only the inner user content instead of these markers.
    return `<start_of_turn>user
  Act as a quiz generator for the following content. Generate educational questions that test understanding of key concepts.
  
  CONTENT:
  "${safeSource}"
  
  STRICT REQUIREMENTS:
  - Generate EXACTLY ${questionCount} questions with this distribution: ${distributionText}
  - Do NOT generate any other question types beyond: ${types.join(', ')}
  - Difficulty for all questions: ${difficulty}
  - Output ONLY valid JSON. No markdown, no code fences, no prose outside JSON.
  - Use the exact schema below. Do not add or rename properties.
  - Use IDs "q1"..."q${questionCount}" in order.
  
  SCHEMA (one JSON object):
  {
    "questions": [
      {
        "id": "q1",
        "type": "MCQ|TrueFalse|Subjective|FillUp",
        "text": "question text",
        "options": [{"text": "option", "correct": true/false}],
        "answer": "for non-MCQ types only",
        "explanation": "brief reason or feedback",
        "difficulty": "${difficulty}",
        "topic": "${title || 'General'}"
      }
    ]
  }
  
  NOTES:
  - MCQ must have EXACTLY 4 options with exactly one correct=true.
  - TrueFalse must have EXACTLY these 2 options: [{"text":"True","correct":true/false}, {"text":"False","correct":true/false}] with exactly one correct=true.
  - Subjective must NOT include options; use "answer" as the expected answer.
  - FillUp must NOT include options; use "answer" as the canonical fill.
  
  EXAMPLES (format only; content is illustrative):
  ${examples}
  
  Now return the final JSON for ${distributionText} about the content above.
  <end_of_turn>
  <start_of_turn>model
  `;
}



export function buildEvaluatePrompt({ question, canonical, userAnswer }) {
    const questionText =
        question?.text ||
        question?.question ||
        question?.stem ||
        '';

    const referenceAnswer =
        question?.expected_answer ||
        question?.answer ||
        question?.correctAnswer ||
        canonical ||
        '';

    const safeQuestion = trimAndCap(String(questionText || ''), 1200);
    const safeReference = trimAndCap(String(referenceAnswer || ''), 1200);
    const safeUser = trimAndCap(String(userAnswer || ''), 1500);

    // If integrating with tokenizer.apply_chat_template, pass only the inner
    // user content (without <start_of_turn>/<end_of_turn> markers).
    return `<start_of_turn>user
  Act as a strict but fair grader for ONE subjective question. Evaluate the student's answer against the reference, focusing on key ideas and factual correctness.
  
  GRADING POLICY:
  - Accept equivalent wording, synonyms, and different order if meaning matches.
  - Penalize: missing core concepts, contradictions, fabricated facts, irrelevance.
  - Partial credit allowed if some key ideas are present.
  - If the student answer is blank/irrelevant, set isCorrect=false and score=0.0.
  - Scoring bands:
    - 0.90–1.00: fully correct and complete
    - 0.70–0.85: mostly correct; minor gaps
    - 0.40–0.65: partially correct; key gaps
    - 0.10–0.35: minimal understanding
    - 0.00: incorrect/off-topic/blank
  
  OUTPUT:
  Return ONLY valid JSON (no markdown, no prose) with EXACTLY this structure and fields:
  {
    "isCorrect": boolean,
    "score": number,           // 0.0 to 1.0 inclusive, at most two decimals
    "feedback": {
      "message": "string",     // brief, <= 160 chars
      "explanation": "string"  // 1–3 sentences, concise
    },
    "explanation": "string"    // 1–2 sentences: why correct/incorrect
  }
  - Do NOT add fields. Do NOT rename fields. Do NOT include examples in the output.
  
  QUESTION:
  "${safeQuestion}"
  
  REFERENCE:
  "${safeReference}"
  
  STUDENT:
  "${safeUser}"
  
  FORMAT EXAMPLES (for format only; DO NOT copy into your output):
  {
    "isCorrect": true,
    "score": 0.95,
    "feedback": {
      "message": "Accurate and complete.",
      "explanation": "Covers all core points with correct reasoning and no contradictions."
    },
    "explanation": "Matches the reference's key concepts and details."
  }
  
  {
    "isCorrect": false,
    "score": 0.30,
    "feedback": {
      "message": "Missing core ideas; partial relevance.",
      "explanation": "Touches on the topic but omits essential concepts stated in the reference."
    },
    "explanation": "Key required points are absent or misstated."
  }
  
  Now return ONLY the final JSON for this student answer.
  <end_of_turn>
  <start_of_turn>model
  `;
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
