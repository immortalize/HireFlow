const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticateToken, requireRole } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// Question bank for cognitive ability tests
const COGNITIVE_QUESTIONS = {
  logic: [
    {
      id: 'logic_1',
      text: 'If all roses are flowers and some flowers are red, which of the following must be true?',
      options: [
        'All roses are red',
        'Some roses are red',
        'All red things are roses',
        'None of the above'
      ],
      correctAnswer: 1,
      category: 'logic'
    },
    {
      id: 'logic_2',
      text: 'A sequence follows the pattern: 2, 6, 12, 20, 30, ? What comes next?',
      options: ['40', '42', '44', '46'],
      correctAnswer: 1,
      category: 'logic'
    },
    {
      id: 'logic_3',
      text: 'If A = 1, B = 2, C = 3, then what does CAB equal?',
      options: ['312', '321', '123', '213'],
      correctAnswer: 0,
      category: 'logic'
    },
    {
      id: 'logic_4',
      text: 'Which figure comes next in the sequence: Circle, Square, Triangle, Circle, Square, ?',
      options: ['Circle', 'Square', 'Triangle', 'Rectangle'],
      correctAnswer: 2,
      category: 'logic'
    },
    {
      id: 'logic_5',
      text: 'If 3 workers can complete a task in 6 hours, how many hours would it take 2 workers to complete the same task?',
      options: ['4 hours', '6 hours', '9 hours', '12 hours'],
      correctAnswer: 2,
      category: 'logic'
    }
  ],
  math: [
    {
      id: 'math_1',
      text: 'What is 15% of 200?',
      options: ['20', '25', '30', '35'],
      correctAnswer: 2,
      category: 'math'
    },
    {
      id: 'math_2',
      text: 'If x + 3 = 7, what is x?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
      category: 'math'
    },
    {
      id: 'math_3',
      text: 'What is the average of 8, 12, 16, and 20?',
      options: ['12', '14', '16', '18'],
      correctAnswer: 1,
      category: 'math'
    },
    {
      id: 'math_4',
      text: 'If a rectangle has a length of 8 and width of 6, what is its area?',
      options: ['14', '28', '48', '56'],
      correctAnswer: 2,
      category: 'math'
    },
    {
      id: 'math_5',
      text: 'What is 2^3 × 3^2?',
      options: ['36', '54', '72', '108'],
      correctAnswer: 2,
      category: 'math'
    }
  ],
  verbal: [
    {
      id: 'verbal_1',
      text: 'Choose the word that best completes the analogy: Book is to Reading as Fork is to:',
      options: ['Eating', 'Cooking', 'Kitchen', 'Food'],
      correctAnswer: 0,
      category: 'verbal'
    },
    {
      id: 'verbal_2',
      text: 'Which word is most similar in meaning to "Eloquent"?',
      options: ['Quiet', 'Articulate', 'Fast', 'Loud'],
      correctAnswer: 1,
      category: 'verbal'
    },
    {
      id: 'verbal_3',
      text: 'Complete the sentence: "The weather was so _____ that we decided to stay indoors."',
      options: ['pleasant', 'inclement', 'warm', 'sunny'],
      correctAnswer: 1,
      category: 'verbal'
    },
    {
      id: 'verbal_4',
      text: 'What is the opposite of "Benevolent"?',
      options: ['Kind', 'Generous', 'Malevolent', 'Friendly'],
      correctAnswer: 2,
      category: 'verbal'
    },
    {
      id: 'verbal_5',
      text: 'Which word does not belong with the others?',
      options: ['Apple', 'Orange', 'Banana', 'Carrot'],
      correctAnswer: 3,
      category: 'verbal'
    }
  ]
}

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Helper function to select random questions
function selectRandomQuestions(type, count = 25) {
  const allQuestions = []
  
  // Add questions from each category
  Object.values(COGNITIVE_QUESTIONS).forEach(category => {
    allQuestions.push(...category)
  })
  
  // Shuffle and select the specified number
  const shuffled = shuffleArray(allQuestions)
  return shuffled.slice(0, count)
}

// Get all assessments (for employers)
router.get('/', authenticateToken, requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']), async (req, res) => {
  try {
    const { type, status, search } = req.query
    const userId = req.user.id

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    })

    if (!user.company) {
      return res.status(400).json({ error: 'User not associated with a company' })
    }

    const whereClause = {
      application: {
        job: {
          companyId: user.company.id
        }
      }
    }

    if (type) whereClause.type = type
    if (status) whereClause.status = status
    if (search) {
      whereClause.OR = [
        {
          application: {
            job: {
              title: { contains: search, mode: 'insensitive' }
            }
          }
        },
        {
          application: {
            candidate: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        }
      ]
    }

    const assessments = await prisma.assessment.findMany({
      where: whereClause,
      include: {
        application: {
          include: {
            job: {
              include: {
                company: true
              }
            },
            candidate: true
          }
        },
        _count: {
          select: {
            assessmentResults: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ assessments })
  } catch (error) {
    console.error('Error fetching assessments:', error)
    res.status(500).json({ error: 'Failed to fetch assessments' })
  }
})

// Get my assessments (for candidates)
router.get('/my', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const userId = req.user.id

    const assessments = await prisma.assessment.findMany({
      where: {
        application: {
          candidateId: userId
        }
      },
      include: {
        application: {
          include: {
            job: {
              include: {
                company: true
              }
            }
          }
        },
        assessmentResults: {
          where: {
            candidateId: userId
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ assessments })
  } catch (error) {
    console.error('Error fetching my assessments:', error)
    res.status(500).json({ error: 'Failed to fetch assessments' })
  }
})

// Get specific assessment with questions
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            job: {
              include: {
                company: true
              }
            },
            candidate: true
          }
        }
      }
    })

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' })
    }

    // Check if user has access to this assessment
    const isCandidate = req.user.role === 'CANDIDATE'
    const isEmployer = ['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER'].includes(req.user.role)

    if (isCandidate && assessment.application.candidateId !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (isEmployer) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: true }
      })
      
      if (assessment.application.job.companyId !== user.company.id) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    // For candidates, include randomized questions
    if (isCandidate && assessment.type === 'COGNITIVE') {
      const questions = selectRandomQuestions(assessment.type, 25)
      assessment.questions = questions
    }

    res.json({ assessment })
  } catch (error) {
    console.error('Error fetching assessment:', error)
    res.status(500).json({ error: 'Failed to fetch assessment' })
  }
})

// Create assessment
router.post('/create', authenticateToken, requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']), async (req, res) => {
  try {
    const { applicationId, type, timeLimit = 30 } = req.body
    const userId = req.user.id

    // Generate questions bank based on assessment type
    let questionsBank = {}
    if (type === 'COGNITIVE') {
      // Select random questions from the cognitive bank
      const selectedQuestions = selectRandomQuestions('COGNITIVE', 20)
      questionsBank = {
        questions: selectedQuestions,
        totalQuestions: selectedQuestions.length,
        timeLimit: timeLimit * 60 // Convert to seconds
      }
    } else if (type === 'ENGLISH') {
      questionsBank = {
        questions: [
          {
            id: 1,
            type: 'grammar',
            question: 'Choose the correct form: "She _____ to the store yesterday."',
            options: ['go', 'goes', 'went', 'going'],
            correctAnswer: 2
          },
          {
            id: 2,
            type: 'vocabulary',
            question: 'What is the meaning of "ubiquitous"?',
            options: ['rare', 'common', 'expensive', 'difficult'],
            correctAnswer: 1
          }
        ],
        totalQuestions: 2,
        timeLimit: timeLimit * 60
      }
    } else if (type === 'SITUATIONAL_JUDGMENT') {
      questionsBank = {
        questions: [
          {
            id: 1,
            type: 'scenario',
            question: 'A team member consistently misses deadlines. How would you handle this?',
            options: [
              'Immediately report them to HR',
              'Have a private conversation to understand the issue',
              'Ignore the problem',
              'Take over their work'
            ],
            correctAnswer: 1
          }
        ],
        totalQuestions: 1,
        timeLimit: timeLimit * 60
      }
    } else if (type === 'FIT_CHECK') {
      questionsBank = {
        questions: [
          {
            id: 1,
            type: 'preference',
            question: 'How do you prefer to work?',
            options: [
              'Independently',
              'In small teams',
              'In large teams',
              'Mixed approach'
            ],
            correctAnswer: null // No correct answer for fit questions
          }
        ],
        totalQuestions: 1,
        timeLimit: timeLimit * 60
      }
    }

    // Ensure questions bank was generated
    if (!questionsBank.questions || questionsBank.questions.length === 0) {
      return res.status(400).json({ error: 'Failed to generate questions bank for assessment type' })
    }

    // Verify application exists and user has access
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: { company: true }
        }
      }
    })

    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    })

    if (application.job.companyId !== user.company.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check if assessment already exists
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        applicationId,
        type
      }
    })

    if (existingAssessment) {
      return res.status(400).json({ error: 'Assessment already exists for this application' })
    }

    const assessment = await prisma.assessment.create({
      data: {
        applicationId,
        type,
        questionsBank,
        timeLimit,
        isActive: true
      },
      include: {
        application: {
          include: {
            job: {
              include: {
                company: true
              }
            },
            candidate: true
          }
        }
      }
    })

    res.status(201).json({ assessment })
  } catch (error) {
    console.error('Error creating assessment:', error)
    res.status(500).json({ error: 'Failed to create assessment' })
  }
})

// Submit assessment results
router.post('/:id/submit', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { id } = req.params
    const { answers, timeSpent, proctoringData } = req.body
    const userId = req.user.id

    // Verify assessment exists and user has access
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            candidate: true
          }
        }
      }
    })

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' })
    }

    if (assessment.application.candidateId !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check if already submitted
    const existingResult = await prisma.assessmentResult.findFirst({
      where: {
        assessmentId: id,
        candidateId: userId
      }
    })

    if (existingResult) {
      return res.status(400).json({ error: 'Assessment already submitted' })
    }

    // Calculate score
    let score = 0
    let totalQuestions = 0

    if (assessment.type === 'COGNITIVE') {
      // Get the questions that were used for this assessment
      const questions = selectRandomQuestions(assessment.type, 25)
      
      totalQuestions = questions.length
      let correctAnswers = 0

      questions.forEach(question => {
        const userAnswer = answers[question.id]
        if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
          correctAnswers++
        }
      })

      score = Math.round((correctAnswers / totalQuestions) * 100)
    }

    // Create assessment result
    const result = await prisma.assessmentResult.create({
      data: {
        assessmentId: id,
        candidateId: userId,
        score,
        timeSpent,
        answers: answers,
        proctoringData: proctoringData || [],
        completedAt: new Date()
      }
    })

    // Update assessment status
    await prisma.assessment.update({
      where: { id },
      data: { status: 'completed' }
    })

    res.json({ 
      result,
      score,
      totalQuestions,
      message: 'Assessment submitted successfully'
    })
  } catch (error) {
    console.error('Error submitting assessment:', error)
    res.status(500).json({ error: 'Failed to submit assessment' })
  }
})

// Get assessment results (for employers)
router.get('/:id/results', authenticateToken, requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']), async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Verify assessment exists and user has access
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            job: {
              include: { company: true }
            }
          }
        }
      }
    })

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    })

    if (assessment.application.job.companyId !== user.company.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const results = await prisma.assessmentResult.findMany({
      where: { assessmentId: id },
      include: {
        candidate: true
      },
      orderBy: { completedAt: 'desc' }
    })

    res.json({ results })
  } catch (error) {
    console.error('Error fetching assessment results:', error)
    res.status(500).json({ error: 'Failed to fetch assessment results' })
  }
})

module.exports = router
