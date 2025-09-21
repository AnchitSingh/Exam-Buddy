// Different quiz templates based on topics/subjects
// This simulates what the AI would generate for different inputs
const quizTemplates = {
    physics: {
        questions: [
            {
                id: 'phys_1',
                type: 'MCQ',
                question: "What is Newton's Second Law of Motion?",
                options: [
                    { text: "F = ma", isCorrect: true },
                    { text: "F = m/a", isCorrect: false },
                    { text: "F = a/m", isCorrect: false },
                    { text: "F = m + a", isCorrect: false }
                ],
                explanation: "Newton's Second Law states that the force acting on an object is equal to the mass of that object times its acceleration (F = ma).",
                difficulty: "easy",
                subject: "Physics"
            },
            {
                id: 'phys_2',
                type: 'True/False',
                question: "Velocity is a scalar quantity.",
                options: [
                    { text: "True", isCorrect: false },
                    { text: "False", isCorrect: true }
                ],
                explanation: "Velocity is a vector quantity because it has both magnitude and direction, unlike speed which is a scalar quantity.",
                difficulty: "medium",
                subject: "Physics"
            },
            {
                id: 'phys_3',
                type: 'Short Answer',
                question: "Explain what happens to kinetic energy when an object's speed doubles.",
                correctAnswers: [
                    "kinetic energy increases by a factor of 4",
                    "kinetic energy becomes 4 times greater",
                    "KE = 1/2mv^2, so doubling speed quadruples kinetic energy"
                ],
                explanation: "Since kinetic energy is proportional to the square of velocity (KE = ½mv²), doubling the speed results in four times the kinetic energy.",
                difficulty: "hard",
                subject: "Physics"
            },
            {
                id: 'phys_4',
                type: 'Fill in Blank',
                question: "The law of conservation of energy states that energy cannot be _______ or _______, only transformed from one form to another.",
                blanks: ["created", "destroyed"],
                acceptableAnswers: [
                    ["created", "destroyed"],
                    ["made", "destroyed"],
                    ["generated", "eliminated"]
                ],
                explanation: "The law of conservation of energy is a fundamental principle stating that energy cannot be created or destroyed, only transformed.",
                difficulty: "medium",
                subject: "Physics"
            }
        ]
    },

    mathematics: {
        questions: [
            {
                id: 'math_1',
                question: "What is the derivative of f(x) = 3x² + 2x - 5?",
                options: [
                    { text: "f'(x) = 6x + 2", isCorrect: true },
                    { text: "f'(x) = 3x + 2", isCorrect: false },
                    { text: "f'(x) = 6x - 5", isCorrect: false },
                    { text: "f'(x) = x² + x", isCorrect: false }
                ],
                explanation: "Using the power rule: d/dx(ax^n) = n·ax^(n-1), so f'(x) = 6x + 2.",
                difficulty: "medium",
                subject: "Mathematics",
                timeToAnswer: 75
            },
            // Add more math questions...
        ]
    },

    biology: {
        questions: [
            {
                id: 'bio_1',
                question: "What is the primary function of mitochondria in eukaryotic cells?",
                options: [
                    { text: "Protein synthesis and cellular communication", isCorrect: false },
                    { text: "Energy production through cellular respiration", isCorrect: true },
                    { text: "DNA storage and genetic information processing", isCorrect: false },
                    { text: "Waste removal and cellular detoxification", isCorrect: false }
                ],
                explanation: "Mitochondria are the powerhouses of the cell, responsible for producing ATP through cellular respiration.",
                difficulty: "easy",
                subject: "Biology",
                timeToAnswer: 50
            },
            // Add more biology questions...
        ]
    },

    // Default fallback
    general: {
        questions: [
            {
                id: 'gen_1',
                question: "This is a sample question about your topic.",
                options: [
                    { text: "Option A", isCorrect: false },
                    { text: "Option B", isCorrect: true },
                    { text: "Option C", isCorrect: false },
                    { text: "Option D", isCorrect: false }
                ],
                explanation: "This explanation would be generated based on your specific topic and content.",
                difficulty: "medium",
                subject: "General",
                timeToAnswer: 60
            }
        ]
    }
};

export const getQuizByTopic = (topic) => {
    const lowerTopic = topic.toLowerCase();

    if (lowerTopic.includes('physics') || lowerTopic.includes('mechanics') || lowerTopic.includes('thermodynamics')) {
        return quizTemplates.physics;
    }

    if (lowerTopic.includes('math') || lowerTopic.includes('calculus') || lowerTopic.includes('algebra')) {
        return quizTemplates.mathematics;
    }

    if (lowerTopic.includes('biology') || lowerTopic.includes('cell') || lowerTopic.includes('genetics')) {
        return quizTemplates.biology;
    }

    return null; // Will use default
};

export const getDefaultQuiz = () => quizTemplates.general;

export const getAllTemplates = () => quizTemplates;

export default {
    getQuizByTopic,
    getDefaultQuiz,
    getAllTemplates
};

// Update the generate quiz logic in API
export const generateQuizFromConfig = (config, template) => {
    const allQuestions = template.questions;

    // Filter questions by selected types
    const filteredQuestions = allQuestions.filter(q =>
        config.questionTypes.includes(q.type)
    );

    // If not enough questions of selected types, add MCQ as fallback
    let selectedQuestions = filteredQuestions.slice(0, config.questionCount);
    if (selectedQuestions.length < config.questionCount) {
        const mcqQuestions = allQuestions.filter(q => q.type === 'MCQ');
        const needed = config.questionCount - selectedQuestions.length;
        selectedQuestions = [
            ...selectedQuestions,
            ...mcqQuestions.slice(0, needed)
        ];
    }

    return selectedQuestions;
};