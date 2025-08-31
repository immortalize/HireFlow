const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireRole, requireCompanyAccess } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Question banks for different assessment types
const questionBanks = {
  COGNITIVE: [
    {
      id: 1,
      question: "If a train travels 60 miles in 1 hour, how far will it travel in 2.5 hours?",
      options: ["120 miles", "150 miles", "180 miles", "200 miles"],
      correctAnswer: 1,
      category: "math"
    },
    {
      id: 2,
      question: "Which word is most similar to 'Eloquent'?",
      options: ["Quiet", "Articulate", "Fast", "Strong"],
      correctAnswer: 1,
      category: "verbal"
    },
    {
      id: 3,
      question: "Complete the sequence: 2, 4, 8, 16, __",
      options: ["24", "32", "30", "28"],
      correctAnswer: 1,
      category: "logic"
    },
    {
      id: 4,
      question: "If all roses are flowers and some flowers are red, then:",
      options: ["All roses are red", "Some roses are red", "No roses are red", "Cannot determine"],
      correctAnswer: 3,
      category: "logic"
    },
    {
      id: 5,
      question: "A company's revenue increased by 20% from $100,000. What is the new revenue?",
      options: ["$110,000", "$120,000", "$130,000", "$140,000"],
      correctAnswer: 1,
      category: "math"
    }
  ],
  ENGLISH: [
    {
      id: 1,
      question: "Choose the correct form: 'She _____ to the store yesterday.'",
      options: ["go", "goes", "went", "gone"],
      correctAnswer: 2,
      category: "grammar"
    },
    {
      id: 2,
      question: "Which word is a synonym for 'Benevolent'?",
      options: ["Kind", "Angry", "Quick", "Large"],
      correctAnswer: 0,
      category: "vocabulary"
    },
    {
      id: 3,
      question: "Identify the error: 'The team are working hard.'",
      options: ["The", "team", "are", "working"],
      correctAnswer: 2,
      category: "grammar"
    },
    {
      id: 4,
      question: "What does 'Ubiquitous' mean?",
      options: ["Rare", "Present everywhere", "Expensive", "Beautiful"],
      correctAnswer: 1,
      category: "vocabulary"
    },
    {
      id: 5,
      question: "Choose the correct preposition: 'She is responsible _____ the project.'",
      options: ["for", "to", "with", "by"],
      correctAnswer: 0,
      category: "grammar"
    }
  ],
  SITUATIONAL_JUDGMENT: [
    {
      id: 1,
      question: "A team member consistently misses deadlines. What would you do first?",
      options: ["Report them to HR", "Have a private conversation", "Remove them from the team", "Ignore the issue"],
      correctAnswer: 1,
      category: "leadership"
    },
    {
      id: 2,
      question: "You discover a mistake in your work after submitting it. What's your next step?",
      options: ["Hope no one notices", "Immediately inform your supervisor", "Fix it secretly", "Blame someone else"],
      correctAnswer: 1,
      category: "integrity"
    },
    {
      id: 3,
      question: "A client is unhappy with your work. How do you respond?",
      options: ["Defend your work", "Listen and understand their concerns", "Ignore them", "Blame the client"],
      correctAnswer: 1,
      category: "customer_service"
    },
    {
      id: 4,
      question: "You're overwhelmed with work. What do you do?",
      options: ["Work overtime", "Ask for help", "Skip some tasks", "Complain to everyone"],
      correctAnswer: 1,
      category: "time_management"
    },
    {
      id: 5,
      question: "A colleague takes credit for your idea. How do you handle it?",
      options: ["Confront them publicly", "Let it go", "Discuss it privately", "Retaliate"],
      correctAnswer: 2,
      category: "conflict_resolution"
    }
  ],
  FIT_CHECK: [
    {
      id: 1,
      question: "Do you have at least 2 years of experience in this field?",
      options: ["Yes", "No"],
      correctAnswer: 0,
      category: "experience"
    },
    {
      id: 2,
      question: "Are you willing to work remotely?",
      options: ["Yes", "No"],
      correctAnswer: 0,
      category: "flexibility"
    },
    {
      id: 3,
      question: "Can you start within 2 weeks if hired?",
      options: ["Yes", "No"],
      correctAnswer: 0,
      category: "availability"
    },
    {
      id: 4,
      question: "Do you have the required technical skills?",
      options: ["Yes", "No"],
      correctAnswer: 0,
      category: "skills"
    },
    {
      id: 5,
      question: "Are you comfortable with the salary range?",
      options: ["Yes", "No"],
      correctAnswer: 0,
      category: "compensation"
    }
  ]
};

// Helper function to randomize questions
const randomizeQuestions = (questions, count = 5) => {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, questions.length));
};

// Helper function to calculate score
const calculateScore = (answers, questions) => {
  let correct = 0;
  let total = questions.length;

  answers.forEach((answer, index) => {
    if (answer.selectedAnswer === questions[index].correctAnswer) {
      correct++;
    }
  });

  return {
    score: (correct / total) * 100,
    correct,
    total,
    percentage: Math.round((correct / total) * 100)
  };
};

// Create assessment for application
router.post('/create', [
  requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']),
  requireCompanyAccess,
  body('applicationId').notEmpty(),
  body('type').isIn(['COGNITIVE', 'ENGLISH', 'SITUATIONAL_JUDGMENT', 'FIT_CHECK']),
  body('timeLimit').optional().isInt({ min: 5, max: 120 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { applicationId, type, timeLimit } = req.body;

    // Verify application exists and belongs to user's company
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: {
          companyId: req.user.companyId
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if assessment already exists
    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        applicationId,
        type,
        isActive: true
      }
    });

    if (existingAssessment) {
      return res.status(400).json({ error: 'Assessment of this type already exists for this application' });
    }

    // Get questions for the type
    const questions = questionBanks[type] || [];
    const randomizedQuestions = randomizeQuestions(questions, type === 'FIT_CHECK' ? 5 : 10);

    const assessment = await prisma.assessment.create({
      data: {
        type,
        questionsBank: randomizedQuestions,
        applicationId,
        timeLimit: timeLimit || (type === 'FIT_CHECK' ? 10 : 30)
      },
      include: {
        application: {
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            job: {
              select: {
                id: true,
                title: true,
                company: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Assessment created successfully',
      assessment
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// Get assessment for candidate
router.get('/take/:assessmentId', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        application: {
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            job: {
              select: {
                id: true,
                title: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                    primaryColor: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!assessment || !assessment.isActive) {
      return res.status(404).json({ error: 'Assessment not found or inactive' });
    }

    // Check if already completed
    const existingResult = await prisma.assessmentResult.findFirst({
      where: {
        assessmentId,
        candidateId: assessment.application.candidate.id
      }
    });

    if (existingResult) {
      return res.status(400).json({ error: 'Assessment already completed' });
    }

    // Return questions without correct answers
    const questionsForCandidate = assessment.questionsBank.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      category: q.category
    }));

    res.json({
      assessment: {
        id: assessment.id,
        type: assessment.type,
        timeLimit: assessment.timeLimit,
        questions: questionsForCandidate,
        job: assessment.application.job,
        candidate: assessment.application.candidate
      }
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// Submit assessment results
router.post('/submit/:assessmentId', [
  body('answers').isArray(),
  body('timeSpent').isInt({ min: 0 }),
  body('proctoringData').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assessmentId } = req.params;
    const { answers, timeSpent, proctoringData } = req.body;

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        application: {
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!assessment || !assessment.isActive) {
      return res.status(404).json({ error: 'Assessment not found or inactive' });
    }

    // Check if already completed
    const existingResult = await prisma.assessmentResult.findFirst({
      where: {
        assessmentId,
        candidateId: assessment.application.candidate.id
      }
    });

    if (existingResult) {
      return res.status(400).json({ error: 'Assessment already completed' });
    }

    // Calculate score
    const score = calculateScore(answers, assessment.questionsBank);

    // Create assessment result
    const result = await prisma.assessmentResult.create({
      data: {
        assessmentId,
        candidateId: assessment.application.candidate.id,
        score: score.score,
        answers,
        proctoringData: proctoringData || {},
        timeSpent
      },
      include: {
        assessment: {
          include: {
            application: {
              include: {
                job: {
                  select: {
                    title: true,
                    company: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Assessment submitted successfully',
      result: {
        id: result.id,
        score: score.score,
        correct: score.correct,
        total: score.total,
        percentage: score.percentage,
        timeSpent
      }
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

// Get assessment results for company
router.get('/results/:assessmentId', [
  requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']),
  requireCompanyAccess
], async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        application: {
          job: {
            companyId: req.user.companyId
          }
        }
      },
      include: {
        application: {
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            job: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        assessmentResults: {
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json({
      assessment: {
        id: assessment.id,
        type: assessment.type,
        timeLimit: assessment.timeLimit,
        questions: assessment.questionsBank,
        application: assessment.application,
        results: assessment.assessmentResults
      }
    });
  } catch (error) {
    console.error('Get assessment results error:', error);
    res.status(500).json({ error: 'Failed to fetch assessment results' });
  }
});

// Get all assessments for company
router.get('/', [
  requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']),
  requireCompanyAccess
], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type,
      status = 'active'
    } = req.query;

    const skip = (page - 1) * limit;
    
    let whereClause = {
      application: {
        job: {
          companyId: req.user.companyId
        }
      }
    };

    if (type) {
      whereClause.type = type;
    }

    if (status === 'completed') {
      whereClause.assessmentResults = {
        some: {}
      };
    } else if (status === 'pending') {
      whereClause.assessmentResults = {
        none: {}
      };
    }

    const assessments = await prisma.assessment.findMany({
      where: whereClause,
      include: {
        application: {
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            job: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        _count: {
          select: {
            assessmentResults: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const totalAssessments = await prisma.assessment.count({ where: whereClause });

    res.json({
      assessments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalAssessments,
        pages: Math.ceil(totalAssessments / limit)
      }
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

module.exports = router;
