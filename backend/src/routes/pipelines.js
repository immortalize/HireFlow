const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole, requireCompanyAccess } = require('../middleware/auth');
const crypto = require('crypto');
const { 
  selectRandomQuestions, 
  selectQuestionsByDifficulty, 
  getQuestionStats 
} = require('../data/questionBanks');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate unique token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
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
              const selectedQuestions = selectRandomQuestions('ENGLISH', 10);
              questionsBank = {
                questions: selectedQuestions,
                totalQuestions: selectedQuestions.length,
                timeLimit: (assessment.timeLimit || 20) * 60
              };
            } else if (assessment.type === 'SITUATIONAL_JUDGMENT') {
              const selectedQuestions = selectRandomQuestions('SITUATIONAL_JUDGMENT', 8);
              questionsBank = {
                questions: selectedQuestions,
                totalQuestions: selectedQuestions.length,
                timeLimit: (assessment.timeLimit || 15) * 60
              };
            } else if (assessment.type === 'FIT_CHECK') {
              const selectedQuestions = selectRandomQuestions('FIT_CHECK', 5);
              questionsBank = {
                questions: selectedQuestions,
                totalQuestions: selectedQuestions.length,
                timeLimit: (assessment.timeLimit || 10) * 60
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
