const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole, requireCompanyAccess } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate unique token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to select random questions (reuse from assessments.js)
const COGNITIVE_QUESTIONS = {
  logic: [
    {
      id: 1,
      question: 'Complete the sequence: 2, 4, 8, 16, __',
      options: ['24', '32', '30', '28'],
      correctAnswer: 1
    },
    {
      id: 2,
      question: 'If all Bloops are Razzles and all Razzles are Lazzles, then all Bloops are definitely Lazzles.',
      options: ['True', 'False', 'Cannot be determined'],
      correctAnswer: 0
    }
  ],
  math: [
    {
      id: 3,
      question: 'What is 15% of 200?',
      options: ['20', '25', '30', '35'],
      correctAnswer: 2
    },
    {
      id: 4,
      question: 'If a train travels 120 miles in 2 hours, what is its speed in miles per hour?',
      options: ['40', '50', '60', '70'],
      correctAnswer: 2
    }
  ],
  verbal: [
    {
      id: 5,
      question: 'Choose the word that best completes the sentence: The weather was so _____ that we decided to stay indoors.',
      options: ['pleasant', 'terrible', 'mild', 'warm'],
      correctAnswer: 1
    },
    {
      id: 6,
      question: 'What is the opposite of "ubiquitous"?',
      options: ['rare', 'common', 'expensive', 'difficult'],
      correctAnswer: 0
    }
  ]
};

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function selectRandomQuestions(type, count = 25) {
  const allQuestions = [];
  
  Object.values(COGNITIVE_QUESTIONS).forEach(category => {
    allQuestions.push(...category);
  });
  
  const shuffled = shuffleArray(allQuestions);
  return shuffled.slice(0, count);
}

// Get all pipelines for company
router.get('/', authenticateToken, requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']), requireCompanyAccess, async (req, res) => {
  try {
    const pipelines = await prisma.hiringPipeline.findMany({
      where: {
        companyId: req.user.companyId
      },
      include: {
        assessments: {
          orderBy: { order: 'asc' }
        },
        candidates: {
          include: {
            results: {
              include: {
                assessment: true
              }
            }
          }
        },
        _count: {
          select: {
            candidates: true,
            assessments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ pipelines });
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    res.status(500).json({ error: 'Failed to fetch pipelines' });
  }
});

// Get pipeline by ID (for employers)
router.get('/:id', authenticateToken, requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']), requireCompanyAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const pipeline = await prisma.hiringPipeline.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      },
      include: {
        assessments: {
          orderBy: { order: 'asc' }
        },
        candidates: {
          include: {
            results: {
              include: {
                assessment: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    res.json({ pipeline });
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline' });
  }
});

// Create new pipeline
router.post('/', [
  authenticateToken,
  requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']),
  requireCompanyAccess,
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim(),
  body('assessments').isArray({ min: 1 }),
  body('assessments.*.type').isIn(['COGNITIVE', 'ENGLISH', 'SITUATIONAL_JUDGMENT', 'FIT_CHECK']),
  body('assessments.*.timeLimit').optional().isInt({ min: 5, max: 180 }),
  body('assessments.*.isRequired').optional().isBoolean(),
  body('expiresAt').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, assessments, expiresAt } = req.body;

    // Generate unique token for the pipeline
    const token = generateToken();

    // Create pipeline with assessments
    const pipeline = await prisma.hiringPipeline.create({
      data: {
        name,
        description,
        companyId: req.user.companyId,
        createdById: req.user.id,
        token,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        assessments: {
          create: assessments.map((assessment, index) => {
            let questionsBank = {};
            
            if (assessment.type === 'COGNITIVE') {
              const selectedQuestions = selectRandomQuestions('COGNITIVE', 20);
              questionsBank = {
                questions: selectedQuestions,
                totalQuestions: selectedQuestions.length,
                timeLimit: (assessment.timeLimit || 30) * 60
              };
            } else if (assessment.type === 'ENGLISH') {
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
                timeLimit: (assessment.timeLimit || 30) * 60
              };
            } else if (assessment.type === 'SITUATIONAL_JUDGMENT') {
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
                timeLimit: (assessment.timeLimit || 30) * 60
              };
            } else if (assessment.type === 'FIT_CHECK') {
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
                    correctAnswer: null
                  }
                ],
                totalQuestions: 1,
                timeLimit: (assessment.timeLimit || 30) * 60
              };
            }

            return {
              type: assessment.type,
              order: index + 1,
              timeLimit: assessment.timeLimit || 30,
              isRequired: assessment.isRequired !== false,
              questionsBank
            };
          })
        }
      },
      include: {
        assessments: {
          orderBy: { order: 'asc' }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Pipeline created successfully',
      pipeline
    });
  } catch (error) {
    console.error('Error creating pipeline:', error);
    res.status(500).json({ error: 'Failed to create pipeline' });
  }
});

// Get pipeline by token (public access)
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const pipeline = await prisma.hiringPipeline.findFirst({
      where: {
        token,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        assessments: {
          where: { isRequired: true },
          orderBy: { order: 'asc' }
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found or expired' });
    }

    res.json({ pipeline });
  } catch (error) {
    console.error('Error fetching pipeline by token:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline' });
  }
});

// Start pipeline (candidate registration)
router.post('/token/:token/start', [
  body('email').isEmail().normalizeEmail(),
  body('firstName').trim().isLength({ min: 1, max: 100 }),
  body('lastName').trim().isLength({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { email, firstName, lastName } = req.body;

    // Find pipeline
    const pipeline = await prisma.hiringPipeline.findFirst({
      where: {
        token,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        assessments: {
          where: { isRequired: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found or expired' });
    }

    // Check if candidate already exists
    const existingCandidate = await prisma.pipelineCandidate.findFirst({
      where: {
        pipelineId: pipeline.id,
        email
      }
    });

    if (existingCandidate) {
      return res.status(400).json({ error: 'You have already started this pipeline' });
    }

    // Create candidate
    const candidate = await prisma.pipelineCandidate.create({
      data: {
        pipelineId: pipeline.id,
        email,
        firstName,
        lastName,
        status: 'STARTED',
        startedAt: new Date()
      },
      include: {
        pipeline: {
          include: {
            assessments: {
              where: { isRequired: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Pipeline started successfully',
      candidate
    });
  } catch (error) {
    console.error('Error starting pipeline:', error);
    res.status(500).json({ error: 'Failed to start pipeline' });
  }
});

// Submit assessment result
router.post('/token/:token/assessment/:assessmentId/submit', [
  body('candidateId').isString(),
  body('answers').isArray(),
  body('timeSpent').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, assessmentId } = req.params;
    const { candidateId, answers, timeSpent } = req.body;

    // Verify pipeline and candidate
    const pipeline = await prisma.hiringPipeline.findFirst({
      where: {
        token,
        isActive: true
      }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    const candidate = await prisma.pipelineCandidate.findFirst({
      where: {
        id: candidateId,
        pipelineId: pipeline.id
      }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const assessment = await prisma.pipelineAssessment.findFirst({
      where: {
        id: assessmentId,
        pipelineId: pipeline.id
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Check if result already exists
    const existingResult = await prisma.pipelineResult.findFirst({
      where: {
        candidateId,
        assessmentId
      }
    });

    if (existingResult) {
      return res.status(400).json({ error: 'Assessment already completed' });
    }

    // Calculate score for cognitive assessments
    let score = null;
    if (assessment.type === 'COGNITIVE') {
      const questions = assessment.questionsBank.questions;
      let correctAnswers = 0;
      
      answers.forEach((answer, index) => {
        if (questions[index] && answer === questions[index].correctAnswer) {
          correctAnswers++;
        }
      });
      
      score = (correctAnswers / questions.length) * 100;
    }

    // Create result
    const result = await prisma.pipelineResult.create({
      data: {
        pipelineId: pipeline.id,
        candidateId,
        assessmentId,
        score,
        answers,
        timeSpent: timeSpent || 0
      }
    });

    // Update candidate status
    const totalAssessments = await prisma.pipelineAssessment.count({
      where: {
        pipelineId: pipeline.id,
        isRequired: true
      }
    });

    const completedAssessments = await prisma.pipelineResult.count({
      where: {
        candidateId
      }
    });

    if (completedAssessments >= totalAssessments) {
      await prisma.pipelineCandidate.update({
        where: { id: candidateId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    } else {
      await prisma.pipelineCandidate.update({
        where: { id: candidateId },
        data: {
          status: 'IN_PROGRESS'
        }
      });
    }

    res.status(201).json({
      message: 'Assessment submitted successfully',
      result: {
        ...result,
        score,
        isCompleted: completedAssessments >= totalAssessments
      }
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

// Get candidate progress
router.get('/token/:token/candidate/:candidateId', async (req, res) => {
  try {
    const { token, candidateId } = req.params;

    const candidate = await prisma.pipelineCandidate.findFirst({
      where: {
        id: candidateId,
        pipeline: {
          token,
          isActive: true
        }
      },
      include: {
        pipeline: {
          include: {
            assessments: {
              where: { isRequired: true },
              orderBy: { order: 'asc' }
            }
          }
        },
        results: {
          include: {
            assessment: true
          }
        }
      }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({ candidate });
  } catch (error) {
    console.error('Error fetching candidate progress:', error);
    res.status(500).json({ error: 'Failed to fetch candidate progress' });
  }
});

module.exports = router;
