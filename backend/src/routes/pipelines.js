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
                assessment: {
                  select: {
                    id: true,
                    type: true,
                    questionsBank: true
                  }
                }
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
                assessment: {
                  select: {
                    id: true,
                    type: true,
                    questionsBank: true
                  }
                }
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

    // Calculate analytics
    const analytics = {
      totalCandidates: pipeline.candidates.length,
      completedCandidates: pipeline.candidates.filter(c => c.status === 'COMPLETED').length,
      inProgressCandidates: pipeline.candidates.filter(c => c.status === 'IN_PROGRESS').length,
      startedCandidates: pipeline.candidates.filter(c => c.status === 'STARTED').length,
      invitedCandidates: pipeline.candidates.filter(c => c.status === 'INVITED').length,
      completionRate: pipeline.candidates.length > 0 
        ? Math.round((pipeline.candidates.filter(c => c.status === 'COMPLETED').length / pipeline.candidates.length) * 100)
        : 0,
      averageTimeToComplete: 0,
      scoreDistribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0
      },
      assessmentAnalytics: {},
      candidateFitAnalysis: []
    };

    // Calculate assessment-specific analytics
    pipeline.assessments.forEach(assessment => {
      const assessmentResults = pipeline.candidates
        .flatMap(c => c.results)
        .filter(r => r.assessmentId === assessment.id);

      if (assessmentResults.length > 0) {
        const scores = assessmentResults.map(r => r.score).filter(s => s !== null);
        const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

        analytics.assessmentAnalytics[assessment.id] = {
          type: assessment.type,
          totalAttempts: assessmentResults.length,
          averageScore,
          highestScore,
          lowestScore,
          scoreDistribution: {
            excellent: scores.filter(s => s >= 80).length,
            good: scores.filter(s => s >= 60 && s < 80).length,
            fair: scores.filter(s => s >= 40 && s < 60).length,
            poor: scores.filter(s => s < 40).length
          }
        };
      }
    });

    // Calculate candidate fit analysis
    analytics.candidateFitAnalysis = pipeline.candidates.map(candidate => {
      const results = candidate.results || [];
      const totalAssessments = pipeline.assessments.length;
      const completedAssessments = results.length;
      
      // Calculate overall score
      const scores = results.map(r => r.score).filter(s => s !== null);
      const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      
      // Calculate time efficiency
      const totalTimeSpent = results.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
      const totalTimeLimit = pipeline.assessments.reduce((sum, a) => sum + (a.timeLimit * 60), 0);
      const timeEfficiency = totalTimeLimit > 0 ? Math.round(Math.max(0, 100 - ((totalTimeSpent / totalTimeLimit) * 100))) : 100;
      
      // Calculate percentile
      const allScores = pipeline.candidates
        .flatMap(c => c.results)
        .map(r => r.score)
        .filter(s => s !== null);
      const sortedScores = allScores.sort((a, b) => b - a);
      const percentile = scores.length > 0 
        ? Math.round(((sortedScores.indexOf(Math.max(...scores)) + 1) / sortedScores.length) * 100)
        : 0;
      
      // Determine overall fit
      let overallFit = 'fair';
      if (overallScore >= 80 && percentile >= 75 && timeEfficiency >= 70) {
        overallFit = 'excellent';
      } else if (overallScore >= 60 && percentile >= 50 && timeEfficiency >= 50) {
        overallFit = 'good';
      } else if (overallScore >= 40 && percentile >= 25) {
        overallFit = 'fair';
      } else {
        overallFit = 'poor';
      }
      
      // Generate insights
      const strengths = [];
      const weaknesses = [];
      const recommendations = [];
      
      if (overallScore >= 80) {
        strengths.push('Strong performance across all assessments');
        strengths.push('Demonstrates excellent problem-solving skills');
      } else if (overallScore >= 60) {
        strengths.push('Shows good understanding of key concepts');
        strengths.push('Demonstrates solid foundational knowledge');
      }
      
      if (overallScore < 60) {
        weaknesses.push('Needs improvement in core areas');
        weaknesses.push('May require additional training');
      }
      
      if (timeEfficiency < 50) {
        weaknesses.push('May struggle with time management');
        recommendations.push('Consider time management training');
      }
      
      if (completedAssessments < totalAssessments) {
        weaknesses.push('Did not complete all assessments');
        recommendations.push('Follow up on incomplete assessments');
      }
      
      if (overallFit === 'excellent') {
        recommendations.push('Strong candidate - recommend for next round');
        recommendations.push('Consider fast-track to final interview');
      } else if (overallFit === 'good') {
        recommendations.push('Good candidate - proceed with standard process');
      } else if (overallFit === 'fair') {
        recommendations.push('Consider additional assessment or interview');
      } else {
        recommendations.push('May not be the right fit for this role');
      }
      
      // Analyze detailed assessment results
      const detailedResults = results.map(result => {
        const answers = result.answers || [];
        const assessment = result.assessment;
        const questions = assessment?.questionsBank?.questions || [];
        
        // Calculate detailed metrics
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let emptyAnswers = 0;
        let totalQuestions = questions.length;
        
        // Process answers based on assessment type
        if (Array.isArray(answers) && Array.isArray(questions)) {
          answers.forEach((answer, index) => {
            const question = questions[index];
            if (!question) return;
            
            if (answer === null || answer === undefined || answer === '') {
              emptyAnswers++;
            } else if (assessment.type === 'COGNITIVE') {
              // For cognitive assessments, compare with correctAnswer
              if (answer === question.correctAnswer) {
                correctAnswers++;
              } else {
                wrongAnswers++;
              }
            } else {
              // For other assessment types, assume answered (no right/wrong for fit/english/situational)
              if (answer !== null && answer !== undefined && answer !== '') {
                correctAnswers++; // Count as correct for non-cognitive assessments
              } else {
                emptyAnswers++;
              }
            }
          });
        }
        
        // Calculate time per question
        const timePerQuestion = totalQuestions > 0 ? Math.round((result.timeSpent || 0) / totalQuestions) : 0;
        
        // Determine performance level
        let performanceLevel = 'poor';
        if (result.score >= 80) performanceLevel = 'excellent';
        else if (result.score >= 60) performanceLevel = 'good';
        else if (result.score >= 40) performanceLevel = 'fair';
        
        return {
          resultId: result.id,
          assessmentId: result.assessmentId,
          assessmentType: result.assessment.type,
          score: result.score,
          timeSpent: result.timeSpent,
          timePerQuestion,
          completedAt: result.completedAt,
          totalQuestions,
          correctAnswers,
          wrongAnswers,
          emptyAnswers,
          performanceLevel,
          accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
          completionRate: totalQuestions > 0 ? Math.round(((correctAnswers + wrongAnswers) / totalQuestions) * 100) : 0
        };
      });
      
      return {
        candidateId: candidate.id,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        candidateEmail: candidate.email,
        status: candidate.status,
        overallScore,
        timeEfficiency,
        percentile,
        overallFit,
        strengths,
        weaknesses,
        recommendations,
        completedAssessments,
        totalAssessments,
        detailedResults
      };
    });

    // Update overall score distribution
    const allScores = pipeline.candidates
      .flatMap(c => c.results)
      .map(r => r.score)
      .filter(s => s !== null);
    
    analytics.scoreDistribution = {
      excellent: allScores.filter(s => s >= 80).length,
      good: allScores.filter(s => s >= 60 && s < 80).length,
      fair: allScores.filter(s => s >= 40 && s < 60).length,
      poor: allScores.filter(s => s < 40).length
    };

    res.json({ 
      pipeline,
      analytics
    });
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
            assessment: {
              select: {
                id: true,
                type: true,
                questionsBank: true
              }
            }
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

// Get detailed assessment result
router.get('/:pipelineId/result/:resultId/detailed', authenticateToken, requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']), requireCompanyAccess, async (req, res) => {
  try {
    const { pipelineId, resultId } = req.params;

    // Verify pipeline belongs to company
    const pipeline = await prisma.hiringPipeline.findFirst({
      where: {
        id: pipelineId,
        companyId: req.user.companyId
      }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    // Get detailed result with questions and answers
    const result = await prisma.pipelineResult.findFirst({
      where: {
        id: resultId,
        pipelineId: pipelineId
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assessment: {
          select: {
            id: true,
            type: true,
            questionsBank: true,
            timeLimit: true
          }
        }
      }
    });

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Process questions and answers
    const questions = result.assessment.questionsBank?.questions || [];
    const answers = result.answers || [];
    
    const detailedQuestions = questions.map((question, index) => {
      const candidateAnswer = answers[index];
      const isCorrect = question.correctAnswer !== undefined && candidateAnswer === question.correctAnswer;
      const isAnswered = candidateAnswer !== null && candidateAnswer !== undefined && candidateAnswer !== '';
      
      return {
        questionNumber: index + 1,
        question: question.question,
        options: question.options || [],
        correctAnswer: question.correctAnswer,
        candidateAnswer: candidateAnswer,
        isCorrect: isCorrect,
        isAnswered: isAnswered,
        explanation: question.explanation || null
      };
    });

    // Calculate detailed statistics
    const totalQuestions = questions.length;
    const correctAnswers = detailedQuestions.filter(q => q.isCorrect).length;
    const wrongAnswers = detailedQuestions.filter(q => q.isAnswered && !q.isCorrect).length;
    const emptyAnswers = detailedQuestions.filter(q => !q.isAnswered).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    const detailedResult = {
      id: result.id,
      candidate: result.candidate,
      assessment: {
        id: result.assessment.id,
        type: result.assessment.type,
        timeLimit: result.assessment.timeLimit
      },
      score: result.score,
      timeSpent: result.timeSpent,
      completedAt: result.completedAt,
      statistics: {
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        emptyAnswers,
        accuracy
      },
      questions: detailedQuestions
    };

    res.json({ result: detailedResult });
  } catch (error) {
    console.error('Error fetching detailed result:', error);
    res.status(500).json({ error: 'Failed to fetch detailed result' });
  }
});

module.exports = router;
