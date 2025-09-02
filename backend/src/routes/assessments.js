const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { 
  selectRandomQuestions, 
  selectQuestionsByDifficulty, 
  getQuestionStats 
} = require('../data/questionBanks')

const router = express.Router()
const prisma = new PrismaClient()

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
      const selectedQuestions = selectRandomQuestions('ENGLISH', 10)
      questionsBank = {
        questions: selectedQuestions,
        totalQuestions: selectedQuestions.length,
        timeLimit: timeLimit * 60
      }
    } else if (type === 'SITUATIONAL_JUDGMENT') {
      const selectedQuestions = selectRandomQuestions('SITUATIONAL_JUDGMENT', 8)
      questionsBank = {
        questions: selectedQuestions,
        totalQuestions: selectedQuestions.length,
        timeLimit: timeLimit * 60
      }
    } else if (type === 'FIT_CHECK') {
      const selectedQuestions = selectRandomQuestions('FIT_CHECK', 5)
      questionsBank = {
        questions: selectedQuestions,
        totalQuestions: selectedQuestions.length,
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
