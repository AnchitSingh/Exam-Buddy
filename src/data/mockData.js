export const mockQuizData = {
    title: "Physics Quiz",
    subject: "Physics",
    totalQuestions: 10,
    timeLimit: 600, // 10 minutes in seconds
    questions: [
      {
        id: 1,
        question: "What is the primary function of mitochondria in eukaryotic cells?",
        options: [
          { text: "Protein synthesis and cellular communication", isCorrect: false },
          { text: "Energy production through cellular respiration", isCorrect: true },
          { text: "DNA storage and genetic information processing", isCorrect: false },
          { text: "Waste removal and cellular detoxification", isCorrect: false }
        ],
        explanation: "Mitochondria are indeed the powerhouses of the cell, responsible for producing ATP through cellular respiration.",
        difficulty: "medium",
        subject: "Biology"
      },
      {
        id: 2,
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
        id: 3,
        question: "Which of the following is a renewable energy source?",
        options: [
          { text: "Coal", isCorrect: false },
          { text: "Natural gas", isCorrect: false },
          { text: "Solar energy", isCorrect: true },
          { text: "Nuclear energy", isCorrect: false }
        ],
        explanation: "Solar energy is renewable because it comes from the sun, which is an inexhaustible source of energy on human timescales.",
        difficulty: "easy",
        subject: "Environmental Science"
      }
    ]
  };
  
  export const mockUserProgress = {
    currentQuestion: 1,
    answers: [],
    bookmarkedQuestions: [],
    timeRemaining: 545,
    score: 0
  };
  
  
  
  export const mockPausedQuizzes = [
    {
      id: 1,
      title: "Thermodynamics Quiz",
      subject: "Physics",
      progress: 47,
      currentQuestion: 7,
      totalQuestions: 15,
      timeRemaining: 765, // 12:45
      score: { correct: 6, total: 7 },
      difficulty: "Medium",
      pausedAt: "2h ago"
    },
    {
      id: 2,
      title: "Linear Algebra Quiz",
      subject: "Math",
      progress: 15,
      currentQuestion: 3,
      totalQuestions: 20,
      timeRemaining: 1530, // 25:30
      score: { correct: 2, total: 3 },
      difficulty: "Hard",
      pausedAt: "1d ago"
    }
  ];
  