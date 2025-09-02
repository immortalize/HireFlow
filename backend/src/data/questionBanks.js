// Centralized question banks for all assessment types
// This file contains comprehensive question banks for different assessment types

const COGNITIVE_QUESTIONS = {
  logic: [
    {
      id: 'logic_1',
      question: 'Complete the sequence: 2, 4, 8, 16, __',
      options: ['24', '32', '30', '28'],
      correctAnswer: 1,
      category: 'logic',
      difficulty: 2
    },
    {
      id: 'logic_2',
      question: 'If all Bloops are Razzles and all Razzles are Lazzles, then all Bloops are definitely Lazzles.',
      options: ['True', 'False', 'Cannot be determined'],
      correctAnswer: 0,
      category: 'logic',
      difficulty: 3
    },
    {
      id: 'logic_3',
      question: 'A sequence follows the pattern: 2, 6, 12, 20, 30, ? What comes next?',
      options: ['40', '42', '44', '46'],
      correctAnswer: 1,
      category: 'logic',
      difficulty: 3
    },
    {
      id: 'logic_4',
      question: 'If A = 1, B = 2, C = 3, then what does CAB equal?',
      options: ['312', '321', '123', '213'],
      correctAnswer: 0,
      category: 'logic',
      difficulty: 2
    },
    {
      id: 'logic_5',
      question: 'Which figure comes next in the sequence: Circle, Square, Triangle, Circle, Square, ?',
      options: ['Circle', 'Square', 'Triangle', 'Rectangle'],
      correctAnswer: 2,
      category: 'logic',
      difficulty: 1
    },
    {
      id: 'logic_6',
      question: 'If 3 workers can complete a task in 6 hours, how many hours would it take 2 workers to complete the same task?',
      options: ['4 hours', '6 hours', '9 hours', '12 hours'],
      correctAnswer: 2,
      category: 'logic',
      difficulty: 3
    },
    {
      id: 'logic_7',
      question: 'If all roses are flowers and some flowers are red, which of the following must be true?',
      options: ['All roses are red', 'Some roses are red', 'All red things are roses', 'None of the above'],
      correctAnswer: 1,
      category: 'logic',
      difficulty: 3
    },
    {
      id: 'logic_8',
      question: 'A clock shows 3:15. What is the angle between the hour and minute hands?',
      options: ['7.5°', '15°', '22.5°', '30°'],
      correctAnswer: 0,
      category: 'logic',
      difficulty: 4
    },
    {
      id: 'logic_9',
      question: 'If today is Monday, what day will it be in 25 days?',
      options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      correctAnswer: 3,
      category: 'logic',
      difficulty: 2
    },
    {
      id: 'logic_10',
      question: 'Which number comes next: 1, 3, 6, 10, 15, ?',
      options: ['18', '20', '21', '25'],
      correctAnswer: 2,
      category: 'logic',
      difficulty: 2
    }
  ],
  math: [
    {
      id: 'math_1',
      question: 'What is 15% of 200?',
      options: ['20', '25', '30', '35'],
      correctAnswer: 2,
      category: 'math',
      difficulty: 1
    },
    {
      id: 'math_2',
      question: 'If a train travels 120 miles in 2 hours, what is its speed in miles per hour?',
      options: ['40', '50', '60', '70'],
      correctAnswer: 2,
      category: 'math',
      difficulty: 1
    },
    {
      id: 'math_3',
      question: 'If x + 3 = 7, what is x?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
      category: 'math',
      difficulty: 1
    },
    {
      id: 'math_4',
      question: 'What is the average of 8, 12, 16, and 20?',
      options: ['12', '14', '16', '18'],
      correctAnswer: 1,
      category: 'math',
      difficulty: 2
    },
    {
      id: 'math_5',
      question: 'If a rectangle has a length of 8 and width of 6, what is its area?',
      options: ['14', '28', '48', '56'],
      correctAnswer: 2,
      category: 'math',
      difficulty: 1
    },
    {
      id: 'math_6',
      question: 'What is 2^3 × 3^2?',
      options: ['36', '54', '72', '108'],
      correctAnswer: 2,
      category: 'math',
      difficulty: 3
    },
    {
      id: 'math_7',
      question: 'If a shirt costs $25 and is discounted by 20%, what is the final price?',
      options: ['$15', '$18', '$20', '$22'],
      correctAnswer: 2,
      category: 'math',
      difficulty: 2
    },
    {
      id: 'math_8',
      question: 'What is the square root of 144?',
      options: ['10', '11', '12', '13'],
      correctAnswer: 2,
      category: 'math',
      difficulty: 1
    },
    {
      id: 'math_9',
      question: 'If 5 workers can build a wall in 10 days, how many days would it take 10 workers?',
      options: ['2 days', '5 days', '10 days', '20 days'],
      correctAnswer: 1,
      category: 'math',
      difficulty: 3
    },
    {
      id: 'math_10',
      question: 'What is 25% of 80?',
      options: ['15', '20', '25', '30'],
      correctAnswer: 1,
      category: 'math',
      difficulty: 1
    }
  ],
  verbal: [
    {
      id: 'verbal_1',
      question: 'Choose the word that best completes the sentence: The weather was so _____ that we decided to stay indoors.',
      options: ['pleasant', 'terrible', 'mild', 'warm'],
      correctAnswer: 1,
      category: 'verbal',
      difficulty: 1
    },
    {
      id: 'verbal_2',
      question: 'What is the opposite of "ubiquitous"?',
      options: ['rare', 'common', 'expensive', 'difficult'],
      correctAnswer: 0,
      category: 'verbal',
      difficulty: 3
    },
    {
      id: 'verbal_3',
      question: 'Choose the word that best completes the analogy: Book is to Reading as Fork is to:',
      options: ['Eating', 'Cooking', 'Kitchen', 'Food'],
      correctAnswer: 0,
      category: 'verbal',
      difficulty: 2
    },
    {
      id: 'verbal_4',
      question: 'Which word is most similar in meaning to "Eloquent"?',
      options: ['Quiet', 'Articulate', 'Fast', 'Loud'],
      correctAnswer: 1,
      category: 'verbal',
      difficulty: 3
    },
    {
      id: 'verbal_5',
      question: 'Complete the sentence: "The weather was so _____ that we decided to stay indoors."',
      options: ['pleasant', 'inclement', 'warm', 'sunny'],
      correctAnswer: 1,
      category: 'verbal',
      difficulty: 3
    },
    {
      id: 'verbal_6',
      question: 'What is the opposite of "Benevolent"?',
      options: ['Kind', 'Generous', 'Malevolent', 'Friendly'],
      correctAnswer: 2,
      category: 'verbal',
      difficulty: 3
    },
    {
      id: 'verbal_7',
      question: 'Which word does not belong with the others?',
      options: ['Apple', 'Orange', 'Banana', 'Carrot'],
      correctAnswer: 3,
      category: 'verbal',
      difficulty: 1
    },
    {
      id: 'verbal_8',
      question: 'What is the meaning of "Ephemeral"?',
      options: ['Eternal', 'Temporary', 'Important', 'Beautiful'],
      correctAnswer: 1,
      category: 'verbal',
      difficulty: 4
    },
    {
      id: 'verbal_9',
      question: 'Choose the correct synonym for "Diligent":',
      options: ['Lazy', 'Hardworking', 'Intelligent', 'Friendly'],
      correctAnswer: 1,
      category: 'verbal',
      difficulty: 2
    },
    {
      id: 'verbal_10',
      question: 'What is the plural form of "Criterion"?',
      options: ['Criterions', 'Criteria', 'Criterias', 'Criterion'],
      correctAnswer: 1,
      category: 'verbal',
      difficulty: 3
    }
  ]
}

const ENGLISH_QUESTIONS = [
  {
    id: 'eng_1',
    question: 'Choose the correct form: "She _____ to the store yesterday."',
    options: ['go', 'goes', 'went', 'going'],
    correctAnswer: 2,
    category: 'grammar',
    difficulty: 1
  },
  {
    id: 'eng_2',
    question: 'What is the meaning of "ubiquitous"?',
    options: ['rare', 'common', 'expensive', 'difficult'],
    correctAnswer: 1,
    category: 'vocabulary',
    difficulty: 3
  },
  {
    id: 'eng_3',
    question: 'Which sentence is grammatically correct?',
    options: [
      'Me and him went to the store',
      'Him and I went to the store',
      'He and I went to the store',
      'I and he went to the store'
    ],
    correctAnswer: 2,
    category: 'grammar',
    difficulty: 2
  },
  {
    id: 'eng_4',
    question: 'Choose the correct preposition: "She is responsible _____ the project."',
    options: ['for', 'to', 'with', 'by'],
    correctAnswer: 0,
    category: 'grammar',
    difficulty: 2
  },
  {
    id: 'eng_5',
    question: 'What is the past participle of "write"?',
    options: ['wrote', 'written', 'writed', 'writing'],
    correctAnswer: 1,
    category: 'grammar',
    difficulty: 2
  },
  {
    id: 'eng_6',
    question: 'Which word is a synonym for "enormous"?',
    options: ['small', 'huge', 'quick', 'bright'],
    correctAnswer: 1,
    category: 'vocabulary',
    difficulty: 1
  },
  {
    id: 'eng_7',
    question: 'Complete the sentence: "The team _____ working on the project for months."',
    options: ['is', 'are', 'has been', 'have been'],
    correctAnswer: 2,
    category: 'grammar',
    difficulty: 3
  },
  {
    id: 'eng_8',
    question: 'What is the meaning of "procrastinate"?',
    options: ['to hurry', 'to delay', 'to complete', 'to start'],
    correctAnswer: 1,
    category: 'vocabulary',
    difficulty: 3
  },
  {
    id: 'eng_9',
    question: 'Which sentence uses the correct tense?',
    options: [
      'I have been working here since 2 years',
      'I have been working here for 2 years',
      'I am working here since 2 years',
      'I work here for 2 years'
    ],
    correctAnswer: 1,
    category: 'grammar',
    difficulty: 3
  },
  {
    id: 'eng_10',
    question: 'What is the comparative form of "good"?',
    options: ['gooder', 'more good', 'better', 'best'],
    correctAnswer: 2,
    category: 'grammar',
    difficulty: 2
  }
]

const SITUATIONAL_JUDGMENT_QUESTIONS = [
  {
    id: 'sj_1',
    question: 'A team member consistently misses deadlines. How would you handle this?',
    options: [
      'Immediately report them to HR',
      'Have a private conversation to understand the issue',
      'Ignore the problem',
      'Take over their work'
    ],
    correctAnswer: 1,
    category: 'teamwork',
    difficulty: 2
  },
  {
    id: 'sj_2',
    question: 'You discover a colleague has made a significant error in their work. What do you do?',
    options: [
      'Report them to management immediately',
      'Point out the error privately and offer help',
      'Fix the error yourself without telling them',
      'Ignore it since it\'s not your responsibility'
    ],
    correctAnswer: 1,
    category: 'professionalism',
    difficulty: 2
  },
  {
    id: 'sj_3',
    question: 'Your manager asks you to work overtime on a project you\'re not familiar with. How do you respond?',
    options: [
      'Decline immediately',
      'Accept but ask for training or guidance',
      'Accept without question',
      'Ask someone else to do it'
    ],
    correctAnswer: 1,
    category: 'communication',
    difficulty: 2
  },
  {
    id: 'sj_4',
    question: 'A client is unhappy with your work and becomes confrontational. What do you do?',
    options: [
      'Defend your work aggressively',
      'Listen to their concerns and work on a solution',
      'Walk away from the situation',
      'Blame someone else'
    ],
    correctAnswer: 1,
    category: 'customer_service',
    difficulty: 2
  },
  {
    id: 'sj_5',
    question: 'You notice a potential safety issue in the workplace. What\'s your first step?',
    options: [
      'Report it to your supervisor immediately',
      'Fix it yourself',
      'Tell your coworkers',
      'Ignore it if it\'s not affecting you'
    ],
    correctAnswer: 0,
    category: 'safety',
    difficulty: 1
  },
  {
    id: 'sj_6',
    question: 'Your team is behind schedule on an important project. What do you do?',
    options: [
      'Work extra hours to catch up',
      'Ask for help from other team members',
      'Request an extension from the client',
      'All of the above'
    ],
    correctAnswer: 3,
    category: 'project_management',
    difficulty: 2
  },
  {
    id: 'sj_7',
    question: 'A colleague takes credit for your work in a meeting. How do you handle this?',
    options: [
      'Confront them publicly in the meeting',
      'Speak to them privately after the meeting',
      'Report them to HR',
      'Let it go to avoid conflict'
    ],
    correctAnswer: 1,
    category: 'professionalism',
    difficulty: 3
  },
  {
    id: 'sj_8',
    question: 'You receive conflicting instructions from two different managers. What do you do?',
    options: [
      'Follow the instructions of the more senior manager',
      'Ask both managers to clarify the priorities',
      'Choose the easier task to complete',
      'Ignore both and do what you think is best'
    ],
    correctAnswer: 1,
    category: 'communication',
    difficulty: 3
  },
  {
    id: 'sj_9',
    question: 'Your company is implementing a new system that you think is inefficient. What do you do?',
    options: [
      'Complain to your coworkers',
      'Provide constructive feedback to management',
      'Refuse to use the new system',
      'Quit your job'
    ],
    correctAnswer: 1,
    category: 'change_management',
    difficulty: 2
  },
  {
    id: 'sj_10',
    question: 'You\'re asked to work on a project outside your area of expertise. How do you respond?',
    options: [
      'Decline immediately',
      'Accept and learn as you go',
      'Ask for training before starting',
      'Recommend someone more qualified'
    ],
    correctAnswer: 2,
    category: 'learning',
    difficulty: 2
  }
]

const FIT_CHECK_QUESTIONS = [
  {
    id: 'fit_1',
    question: 'How do you prefer to work?',
    options: [
      'Independently',
      'In small teams',
      'In large teams',
      'Mixed approach'
    ],
    correctAnswer: null,
    category: 'work_style',
    difficulty: 1
  },
  {
    id: 'fit_2',
    question: 'What motivates you most in your work?',
    options: [
      'Financial rewards',
      'Recognition and praise',
      'Helping others',
      'Learning new skills'
    ],
    correctAnswer: null,
    category: 'motivation',
    difficulty: 1
  },
  {
    id: 'fit_3',
    question: 'How do you handle stress at work?',
    options: [
      'Take breaks and step away',
      'Work harder to get it done',
      'Ask for help from colleagues',
      'Ignore it and keep working'
    ],
    correctAnswer: null,
    category: 'stress_management',
    difficulty: 2
  },
  {
    id: 'fit_4',
    question: 'What type of work environment do you prefer?',
    options: [
      'Structured and organized',
      'Flexible and creative',
      'Fast-paced and dynamic',
      'Quiet and focused'
    ],
    correctAnswer: null,
    category: 'environment',
    difficulty: 1
  },
  {
    id: 'fit_5',
    question: 'How do you prefer to receive feedback?',
    options: [
      'Direct and immediate',
      'Private and constructive',
      'Written and detailed',
      'Informal and casual'
    ],
    correctAnswer: null,
    category: 'feedback',
    difficulty: 2
  },
  {
    id: 'fit_6',
    question: 'What is your preferred leadership style?',
    options: [
      'Directive and hands-on',
      'Supportive and coaching',
      'Delegating and trusting',
      'Collaborative and democratic'
    ],
    correctAnswer: null,
    category: 'leadership',
    difficulty: 2
  },
  {
    id: 'fit_7',
    question: 'How do you approach learning new skills?',
    options: [
      'Self-study and research',
      'Formal training programs',
      'Learning from others',
      'Trial and error'
    ],
    correctAnswer: null,
    category: 'learning_style',
    difficulty: 1
  },
  {
    id: 'fit_8',
    question: 'What is most important to you in a job?',
    options: [
      'Job security',
      'Career growth',
      'Work-life balance',
      'Making a difference'
    ],
    correctAnswer: null,
    category: 'values',
    difficulty: 1
  },
  {
    id: 'fit_9',
    question: 'How do you handle disagreements with colleagues?',
    options: [
      'Confront them directly',
      'Find a compromise',
      'Avoid the conflict',
      'Seek mediation'
    ],
    correctAnswer: null,
    category: 'conflict_resolution',
    difficulty: 2
  },
  {
    id: 'fit_10',
    question: 'What type of projects do you enjoy most?',
    options: [
      'Short-term, quick wins',
      'Long-term, strategic projects',
      'Creative, innovative work',
      'Analytical, data-driven work'
    ],
    correctAnswer: null,
    category: 'project_preference',
    difficulty: 1
  }
]

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Helper function to select random questions by type and count
function selectRandomQuestions(type, count = 25) {
  let allQuestions = []
  
  switch (type) {
    case 'COGNITIVE':
      Object.values(COGNITIVE_QUESTIONS).forEach(category => {
        allQuestions.push(...category)
      })
      break
    case 'ENGLISH':
      allQuestions = [...ENGLISH_QUESTIONS]
      break
    case 'SITUATIONAL_JUDGMENT':
      allQuestions = [...SITUATIONAL_JUDGMENT_QUESTIONS]
      break
    case 'FIT_CHECK':
      allQuestions = [...FIT_CHECK_QUESTIONS]
      break
    default:
      return []
  }
  
  const shuffled = shuffleArray(allQuestions)
  return shuffled.slice(0, Math.min(count, allQuestions.length))
}

// Helper function to get questions by difficulty
function selectQuestionsByDifficulty(type, difficulty, count = 10) {
  let allQuestions = []
  
  switch (type) {
    case 'COGNITIVE':
      Object.values(COGNITIVE_QUESTIONS).forEach(category => {
        allQuestions.push(...category.filter(q => q.difficulty === difficulty))
      })
      break
    case 'ENGLISH':
      allQuestions = ENGLISH_QUESTIONS.filter(q => q.difficulty === difficulty)
      break
    case 'SITUATIONAL_JUDGMENT':
      allQuestions = SITUATIONAL_JUDGMENT_QUESTIONS.filter(q => q.difficulty === difficulty)
      break
    case 'FIT_CHECK':
      allQuestions = FIT_CHECK_QUESTIONS.filter(q => q.difficulty === difficulty)
      break
    default:
      return []
  }
  
  const shuffled = shuffleArray(allQuestions)
  return shuffled.slice(0, Math.min(count, allQuestions.length))
}

// Helper function to get question statistics
function getQuestionStats() {
  return {
    cognitive: {
      logic: COGNITIVE_QUESTIONS.logic.length,
      math: COGNITIVE_QUESTIONS.math.length,
      verbal: COGNITIVE_QUESTIONS.verbal.length,
      total: COGNITIVE_QUESTIONS.logic.length + COGNITIVE_QUESTIONS.math.length + COGNITIVE_QUESTIONS.verbal.length
    },
    english: ENGLISH_QUESTIONS.length,
    situational: SITUATIONAL_JUDGMENT_QUESTIONS.length,
    fitCheck: FIT_CHECK_QUESTIONS.length,
    total: COGNITIVE_QUESTIONS.logic.length + COGNITIVE_QUESTIONS.math.length + COGNITIVE_QUESTIONS.verbal.length + 
           ENGLISH_QUESTIONS.length + SITUATIONAL_JUDGMENT_QUESTIONS.length + FIT_CHECK_QUESTIONS.length
  }
}

module.exports = {
  COGNITIVE_QUESTIONS,
  ENGLISH_QUESTIONS,
  SITUATIONAL_JUDGMENT_QUESTIONS,
  FIT_CHECK_QUESTIONS,
  selectRandomQuestions,
  selectQuestionsByDifficulty,
  getQuestionStats,
  shuffleArray
}
