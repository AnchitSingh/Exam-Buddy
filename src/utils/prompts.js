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

  let expandedContent = sourceSnippet || '';
  if (expandedContent.length < 50) {
    expandedContent = `Topic: ${expandedContent}. Generate questions about this topic using your knowledge.`;
  }

  const safeSource = trimAndCap(expandedContent, 5500);

  // Normalize allowed types to a strict set
  const normalize = (t) => {
    const s = String(t || '').toLowerCase().replace(/[\s/_-]+/g, '');
    if (s === 'mcq' || s === 'multiplechoice') return 'MCQ';
    if (s === 'truefalse' || s === 'tf' || s === 'true' || s === 'false') return 'TrueFalse';
    if (s === 'subjective' || s === 'shortanswer') return 'Subjective';
    if (s === 'fillup' || s === 'fillintheblank' || s === 'fillintheblankss' || s === 'fillups' || s === 'fitb' || s === 'fillinblank') return 'FillUp';
    return 'MCQ';
  };

  const dedup = (arr) => Array.from(new Set(arr));
  const types = dedup((questionTypes || []).map(normalize));
  const finalTypes = types.length ? types : ['MCQ'];

  // Even distribution with remainder to early types
  const base = Math.floor(questionCount / finalTypes.length);
  const remainder = questionCount - base * finalTypes.length;
  const typeDistribution = finalTypes.map((type, i) => ({
    type,
    count: base + (i < remainder ? 1 : 0),
  }));
  const distributionText = typeDistribution.map(x => `${x.count} ${x.type}`).join(', ');

  // Few-shot examples (only for requested types)
  const exFillGood = `{
  "id": "exF1",
  "type": "FillUp",
  "text": "The constancy of the speed of light is a postulate of _____.",
  "answer": "special relativity",
  "explanation": "Special relativity is built on the postulate that light speed in vacuum is constant.",
  "difficulty": "${difficulty}",
  "topic": "${title || 'General'}"
}`;

  const exFillBadThenFixed = `BAD (do not output this):
{
  "id": "bad1",
  "type": "Fill in Blank",
  "question": "Special relativity states that the speed of light is constant for all observers.",
  "options": []
}
GOOD (corrected form):
{
  "id": "exF2",
  "type": "FillUp",
  "text": "According to special relativity, time dilation increases with higher _____.",
  "answer": "velocity",
  "explanation": "Greater relative velocity increases time dilation.",
  "difficulty": "${difficulty}",
  "topic": "${title || 'General'}"
}`;

  const exMCQ = `{
  "id": "exM1",
  "type": "MCQ",
  "text": "Which structure follows FIFO?",
  "options": [
    {"text": "Queue", "correct": true},
    {"text": "Stack", "correct": false},
    {"text": "Tree", "correct": false},
    {"text": "Graph", "correct": false}
  ],
  "explanation": "A queue is first-in, first-out.",
  "difficulty": "${difficulty}",
  "topic": "${title || 'General'}"
}`;

  const exTF = `{
  "id": "exT1",
  "type": "TrueFalse",
  "text": "Bubble sort has average complexity O(n^2).",
  "options": [
    {"text": "True", "correct": true},
    {"text": "False", "correct": false}
  ],
  "explanation": "Average is quadratic.",
  "difficulty": "${difficulty}",
  "topic": "${title || 'General'}"
}`;

  const exSubj = `{
  "id": "exS1",
  "type": "Subjective",
  "text": "Explain spacetime curvature in 30–50 words.",
  "answer": "Mass-energy curves spacetime; objects follow geodesics in this curved geometry, producing gravitational effects without invoking a force in the Newtonian sense.",
  "explanation": "Must mention mass-energy, curvature, geodesics.",
  "difficulty": "${difficulty}",
  "topic": "${title || 'General'}"
}`;

  const examples = []
    .concat(finalTypes.includes('FillUp') ? [exFillGood, exFillBadThenFixed] : [])
    .concat(finalTypes.includes('MCQ') ? [exMCQ] : [])
    .concat(finalTypes.includes('TrueFalse') ? [exTF] : [])
    .concat(finalTypes.includes('Subjective') ? [exSubj] : [])
    .join('\n\n');

  return `<start_of_turn>user
Act as a quiz generator for the following content. Generate educational questions that test understanding of key concepts.

CONTENT:
"${safeSource}"

STRICT REQUIREMENTS:
- Generate EXACTLY ${questionCount} questions with this distribution: ${distributionText}
- Do NOT generate any other question types beyond: ${finalTypes.join(', ')}
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
- FillUp must:
  - Use type value EXACTLY "FillUp" (no synonyms like "Fill in Blank", "Fill-in-the-Blank", "FITB").
  - Include EXACTLY one blank placeholder "_____" in "text".
  - NOT include "options".
  - Include a non-empty "answer" string (canonical fill).

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

export function buildOverallStreamingPrompt({ quizMeta, stats }) {
  // quizMeta: { title, subject, difficulty }
  // stats: { total_questions, total_correct, overall_accuracy, average_time_sec,
  //          per_topic: [{ topic, correct, total, accuracy }],
  //          per_type: [{ type, correct, total, accuracy }],
  //          subjective: { graded, pending, avg_score }, fillup: { graded, pending, avg_score },
  //          top_missed_topics: [{ topic, accuracy, wrong }],
  //          examples: [{ type, topic, difficulty, text, was_correct, user_answer?, correct_answer?, ai_score? }]
  const title = (quizMeta?.title || 'Quiz').slice(0, 120);
  const subject = (quizMeta?.subject || 'General').slice(0, 60);
  const difficulty = (quizMeta?.difficulty || 'mixed').slice(0, 20);
  const compactStats = JSON.stringify(stats).slice(0, 12000);

  // For Gemma 3n engines that prefer chat markers, you may wrap this content in a single user turn.
  return `Act as a concise, supportive coach and write overall feedback based strictly on the metrics below.
Subject: ${subject}
Title: ${title}
Difficulty: ${difficulty}

Write 5–7 short paragraphs or bullet-style lines covering:
- Overall score and performance profile.
- 3 strengths (what went well).
- 3 weaknesses (what to improve).
- Any misconceptions observed.
- Immediate next steps for study.

Rules:
- Plain text only. No markdown, no JSON, no code fences.
- Base everything ONLY on the provided metrics. Do not invent facts.
- Keep sentences short and specific; avoid generic advice.
- If subjective/fill-ups are pending, mention it and base the score on graded items only.

METRICS_JSON:
${compactStats}

Write the feedback now in plain text only.`;
}

export function buildRecommendationsPrompt({ quizMeta, stats }) {
  const subject = (quizMeta?.subject || 'General').slice(0, 60);
  const compactStats = JSON.stringify(stats).slice(0, 8000);

  return `Based strictly on the metrics, return ONLY valid JSON matching EXACTLY:
{
  "recommendations": [
    { "topic": "string", "reason": "string", "suggested_count": number, "types": ["MCQ","TrueFalse","Subjective","FillUp"] }
  ]
}
Constraints:
- 3 to 5 items, ranked by priority.
- Each "reason" must cite an observed weakness (low accuracy, slow time, repeated error).
- "suggested_count" between 3 and 8 (integer).
- Use only the listed "types" enum values.
- JSON only. No markdown, no prose.

SUBJECT: "${subject}"
METRICS_JSON:
${compactStats}`;
}