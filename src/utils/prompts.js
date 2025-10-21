import cleanSelectionText from "./contentCleaner";

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
    allowedTags = [],
    immediateFeedback = true
  } = config || {};

  let expandedContent = text || '';
  if (!expandedContent && chunks?.[0]?.text) {
    expandedContent = chunks[0].text;
  }

  if (expandedContent.length < 50) {
    expandedContent = `Topic: ${expandedContent}. Generate questions about this topic using your knowledge.`;
  }

  console.log("Expanded Content (before cleanup):", expandedContent);
  const safeSource = cleanSelectionText(trimAndCap(expandedContent, 5500));
  console.log("Safe Source (after cleanup):", safeSource);

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

  const base = Math.floor(questionCount / finalTypes.length);
  const remainder = questionCount - base * finalTypes.length;
  const typeDistribution = finalTypes.map((type, i) => ({
    type,
    count: base + (i < remainder ? 1 : 0),
  }));

  const distributionText = typeDistribution.map(x => `${x.count} ${x.type}`).join(', ');

  // SIMPLIFIED EXAMPLES
  const getExampleForType = (type) => {
    const examples = {
      FillUp: [
        `{
  "question": "The constancy of the speed of light is a postulate of _____.",
  "answer": "special relativity",
  "tags": ["relativity", "speed-of-light"]
}`
      ],
      MCQ: [
        `{
  "question": "Which structure follows FIFO?",
  "options": ["Queue", "Stack", "Tree", "Graph"],
  "correct_answer": 0,
  "tags": ["data-structures", "queue"]
}`
      ],
      TrueFalse: [
        `{
  "question": "Bubble sort has average complexity O(n^2).",
  "options": ["True", "False"],
  "correct_answer": 0,
  "tags": ["algorithms", "sorting"]
}`
      ],
      Subjective: [
        `{
  "question": "Explain spacetime curvature in 30-50 words.",
  "answer": "Mass-energy curves spacetime; objects follow geodesics...",
  "tags": ["relativity", "spacetime"]
}`
      ]
    };
    return examples[type] || [];
  };

  // SIMPLIFIED RULES
  const getRulesForType = (type) => {
    const rules = {
      MCQ: '- MCQ must have "options" array with 4 strings and "correct_answer" as index (0-3).',
      TrueFalse: '- TrueFalse must have "options": ["True", "False"] and "correct_answer" as 0 or 1.',
      Subjective: '- Subjective must NOT include options; use "answer" field.',
      FillUp: '- FillUp must include EXACTLY one "_____" in question and "answer" field.'
    };
    return rules[type] || '';
  };

  // SIMPLIFIED SCHEMA
  const getSchemaForType = (type) => {
    const schemas = {
      MCQ: ` {
  "question": "question text",
  "options": ["option1", "option2", "option3", "option4"],
  "correct_answer": 0,
  "tags": ["tag-1", "tag-2"]
}`,
      TrueFalse: ` {
  "question": "question text",
  "options": ["True", "False"],
  "correct_answer": 0,
  "tags": ["tag-1", "tag-2"]
}`,
      Subjective: ` {
  "question": "question text",
  "answer": "expected answer",
  "tags": ["tag-1", "tag-2"]
}`,
      FillUp: ` {
  "question": "question text with _____",
  "answer": "canonical fill",
  "tags": ["tag-1", "tag-2"]
}`
    };
    return schemas[type] || schemas.MCQ;
  };

  const examples = finalTypes
    .flatMap(type => getExampleForType(type))
    .join('\n\n');

  const typeSpecificRules = finalTypes
    .map(type => getRulesForType(type))
    .filter(Boolean)
    .join('\n');

  const schemaExample = finalTypes.length === 1
    ? getSchemaForType(finalTypes[0])
    : ` {
  "question": "question text",
  "options": ["option1", "option2", ...], // for MCQ/TrueFalse only
  "correct_answer": 0, // for MCQ/TrueFalse only
  "answer": "for Subjective/FillUp only",
  "tags": ["tag-1", "tag-2"]
}`;

  const allowedTagText = (allowedTags && allowedTags.length)
    ? `ALLOWED_TAGS: ${allowedTags.map(t => `"${String(t).toLowerCase().trim().replace(/\s+/g, '-')}"`).join(', ')}`
    : `ALLOWED_TAGS: [] // infer 1-3 tags from content`;

  return `user

Act as a quiz generator. Generate educational questions that test understanding of key concepts.

CONTENT:
"${safeSource}"

STRICT REQUIREMENTS:
- Generate EXACTLY ${questionCount} questions: ${distributionText}
- Question type(s): ${finalTypes.join(', ')}
- Output ONLY valid JSON. No markdown, no code fences, no prose.
- NO "id", "type", "explanation", "difficulty", or "topic" fields
- Include "tags": array of 1-3 lowercase kebab-case tags per question

${allowedTagText}

SIMPLIFIED SCHEMA:
{
  "questions": [
${schemaExample}
  ]
}

TYPE-SPECIFIC RULES:
${typeSpecificRules}

- Options format (MCQ/TrueFalse):
  - "options" MUST be array of strings (NOT objects)
  - "correct_answer" MUST be the index (0-based)

EXAMPLES:
${examples}

Return the final JSON for ${distributionText}.

model
`;
}


// Story prompt for Gemma 3n that outputs rich Markdown
// If the runtime already applies a chat template, pass only the inner user content.
// Otherwise, keep the <start_of_turn> markers below.

export function buildStoryPrompt({ extractedSource, config }) {
    const { text = '', title = '' } = extractedSource || {};
    const {
        storyStyle = 'Simple Words',
        topic = (title || 'the selected topic'),
    } = config || {};

    const safeSource = trimAndCap(String(text || ''), 8000);

    // Normalize style to a compact guide small models can follow
    const norm = (s) => String(s || '').toLowerCase().trim();
    const styleKey = norm(storyStyle);

    const STYLE_GUIDES = {
        'simple words': [
            'Use everyday words and short sentences.',
            'Explain any jargon the first time it appears.',
            'Prefer concrete examples and analogies.',
            'Friendly, clear tone; avoid rhetorical questions.',
        ].join(' '),

        'grandpa': [
            'Warm, conversational tone like a grandparent telling a story.',
            'Use gentle anecdotes and cozy imagery.',
            'Keep it kind and steady; explain terms as you go.',
            'End each section with a calm takeaway line.',
        ].join(' '),

        'deep dive': [
            'Structured, step-by-step explanation with precise terms.',
            'Define key concepts, then build causal links.',
            'Use 1-2 compact examples; keep math informal unless essential.',
            'Cohesive paragraphs; minimal fluff, maximum clarity.',
        ].join(' '),

        'eli5': [
            'Very short sentences and super simple words.',
            'Use playful comparisons and everyday objects.',
            'No jargon; if needed, explain with a toy example.',
            'Cheerful tone; keep paragraphs tiny.',
        ].join(' '),
    };

    const guide = STYLE_GUIDES[styleKey] || STYLE_GUIDES['simple words'];

    // Fixed Markdown layout the model must follow
    const MD_LAYOUT = `
# {{title}}

> {{hook}}

## Overview
{{overview}}

## Story
{{story_paragraphs}}

## Key ideas
- {{idea1}}
- {{idea2}}
- {{idea3}}
- {{idea4?}}

## Real‑world analogy
{{analogy}}

## Recap
- {{recap1}}
- {{recap2}}
- {{recap3}}
`.trim();

    return `<start_of_turn>user
Act as a storyteller‑teacher. Write an engaging explanation as rich Markdown. Do NOT ask questions and do NOT generate a quiz.

TOPIC:
"${topic}"

STYLE:
"${storyStyle}"

STYLE_GUIDE:
${guide}

SOURCE_CONTENT (context only — prioritize facts and useful ideas; ignore irrelevant parts):
"${safeSource}"

OUTPUT REQUIREMENTS:
- Return Markdown ONLY using this exact section order and headings:
  1) "# Title"
  2) blockquote hook (one sentence)
  3) "## Overview"
  4) "## Story"
  5) "## Key ideas" (3-4 bullets)
  6) "## Real‑world analogy"
  7) "## Recap" (3 bullets)
- Keep sentences tight; avoid long walls of text.
- Use minimal emphasis (italics or bold) sparingly; no tables or code blocks unless absolutely necessary.
- No questions, no lists outside "Key ideas" and "Recap".
- Length target: 600-900 words.

MARKDOWN_LAYOUT_TEMPLATE (follow the structure, fill the placeholders naturally; do not show placeholders):
${MD_LAYOUT}

Begin the Markdown now.
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
  - If the student answer is blank/irrelevant, set isCorrect=false
  
  OUTPUT:
  Return ONLY valid JSON (no markdown, no prose) with EXACTLY this structure and fields:
  {
    "isCorrect": boolean,
    "feedback": "string",     // brief, <= 160 chars
    "explanation": "string"    // 1-2 sentences: why correct/incorrect
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
    "feedback": "Accurate and complete.",
    "explanation": "Covers all core points with correct reasoning and no contradictions. Matches the reference's key concepts and details."
  }
  
  {
    "isCorrect": false,
    "feedback": "Missing core ideas; partial relevance.",
    "explanation": "Touches on the topic but omits essential concepts stated in the reference. Key required points are absent or misstated."
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

Write 5-7 short paragraphs or bullet-style lines covering:
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