const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireRole, requireCompanyAccess } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get public jobs (for job board)
router.get('/public', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      location,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    let whereClause = {
      isActive: true
    };

    // Search functionality
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Filter by location
    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' };
    }

    // Filter by job type
    if (type) {
      whereClause.type = type.toUpperCase();
    }

    // Get jobs with pagination
    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    // Get total count for pagination
    const totalJobs = await prisma.job.count({ where: whereClause });

    res.json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalJobs,
        pages: Math.ceil(totalJobs / limit)
      }
    });
  } catch (error) {
    console.error('Get public jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get individual public job
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findFirst({
      where: {
        id,
        isActive: true
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            description: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    console.error('Get public job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Get all jobs for company (with filters)
router.get('/', requireCompanyAccess, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      needsAssessment,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    let whereClause = {
      companyId: req.user.companyId
    };

    // Filter by status
    if (status) {
      whereClause.isActive = status === 'active';
    }

    // Search functionality
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter for applications that need assessments
    if (needsAssessment === 'true') {
      whereClause.applications = {
        some: {
          assessments: {
            none: {}
          }
        }
      };
    }

    // Get jobs with pagination
    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        applications: needsAssessment === 'true' ? {
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            assessments: {
              select: {
                id: true,
                type: true
              }
            }
          }
        } : undefined,
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    // Get total count for pagination
    const totalJobs = await prisma.job.count({ where: whereClause });

    res.json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalJobs,
        pages: Math.ceil(totalJobs / limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get applications that need assessments
router.get('/applications-needing-assessments', requireCompanyAccess, async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: {
        job: {
          companyId: req.user.companyId
        },
        assessments: {
          none: {}
        }
      },
      include: {
        job: {
          include: {
            company: true
          }
        },
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ applications });
  } catch (error) {
    console.error('Get applications needing assessments error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get public jobs (for candidates)
router.get('/public', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      location,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    let whereClause = {
      isActive: true
    };

    // Search functionality
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by location
    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' };
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            primaryColor: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const totalJobs = await prisma.job.count({ where: whereClause });

    res.json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalJobs,
        pages: Math.ceil(totalJobs / limit)
      }
    });
  } catch (error) {
    console.error('Get public jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            primaryColor: true,
            secondaryColor: true,
            description: true,
            website: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create new job
router.post('/', [
  requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']),
  requireCompanyAccess,
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 10 }),
  body('requirements').optional().trim(),
  body('benefits').optional().trim(),
  body('location').optional().trim(),
  body('type').optional().isIn(['full_time', 'part_time', 'contract', 'internship', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
  body('salaryMin').optional().isInt({ min: 0 }),
  body('salaryMax').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, requirements, benefits, location, type, salaryMin, salaryMax, isActive } = req.body;

    // Validate salary range
    if (salaryMin && salaryMax && salaryMin > salaryMax) {
      return res.status(400).json({ error: 'Minimum salary cannot be greater than maximum salary' });
    }

    // Convert frontend type to enum value
    const getJobTypeEnum = (type) => {
      const typeMap = {
        'full_time': 'FULL_TIME',
        'part_time': 'PART_TIME',
        'contract': 'CONTRACT',
        'internship': 'INTERNSHIP'
      }
      return typeMap[type] || 'FULL_TIME'
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements: requirements || null,
        benefits: benefits || null,
        location: location || null,
        type: getJobTypeEnum(type),
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        isActive: isActive !== undefined ? isActive : true,
        companyId: req.user.companyId,
        createdById: req.user.id
      },
      include: {
        company: true,
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
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job
router.put('/:id', [
  requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']),
  requireCompanyAccess,
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ min: 10 }),
  body('requirements').optional().isObject(),
  body('location').optional().trim(),
  body('salaryMin').optional().isInt({ min: 0 }),
  body('salaryMax').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, requirements, location, salaryMin, salaryMax, isActive } = req.body;

    // Check if job exists and belongs to user's company
    const existingJob = await prisma.job.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Validate salary range
    if (salaryMin && salaryMax && salaryMin > salaryMax) {
      return res.status(400).json({ error: 'Minimum salary cannot be greater than maximum salary' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (requirements) updateData.requirements = requirements;
    if (location !== undefined) updateData.location = location;
    if (salaryMin !== undefined) updateData.salaryMin = salaryMin ? parseInt(salaryMin) : null;
    if (salaryMax !== undefined) updateData.salaryMax = salaryMax ? parseInt(salaryMax) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedJob = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
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

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job
router.delete('/:id', [
  requireRole(['EMPLOYER', 'HR_MANAGER'])
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if job exists and belongs to user's company
    const existingJob = await prisma.job.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if job has applications
    if (existingJob._count.applications > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete job with existing applications. Deactivate instead.' 
      });
    }

    await prisma.job.delete({
      where: { id }
    });

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Get job statistics
router.get('/:id/stats', requireCompanyAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      },
      include: {
        applications: {
          include: {
            _count: {
              select: {
                assessments: true,
                assessmentResults: true
              }
            }
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Calculate statistics
    const totalApplications = job._count.applications;
    const statusCounts = job.applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    const completedAssessments = job.applications.reduce((acc, app) => {
      return acc + app._count.assessmentResults;
    }, 0);

    res.json({
      stats: {
        totalApplications,
        statusCounts,
        completedAssessments,
        averageAssessmentsPerApplication: totalApplications > 0 ? 
          (completedAssessments / totalApplications).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

// Apply for a job (public route)
router.post('/:id/apply', [
  body('firstName').trim().isLength({ min: 1, max: 100 }),
  body('lastName').trim().isLength({ min: 1, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').trim().isLength({ min: 1 }),
  body('location').trim().isLength({ min: 1 }),
  body('coverLetter').trim().isLength({ min: 10 }),
  body('fitQuestionnaire').isObject(),
  body('resume').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      location, 
      coverLetter, 
      fitQuestionnaire,
      resume 
    } = req.body;

    // Check if job exists and is active
    const job = await prisma.job.findFirst({
      where: {
        id,
        isActive: true
      },
      include: {
        company: true
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or not active' });
    }

    // Check if user already applied for this job
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobId: id,
        candidate: {
          email: email
        }
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    // Create or find candidate user
    let candidate = await prisma.user.findFirst({
      where: { email }
    });

    if (!candidate) {
      // Create new candidate user
      candidate = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          phone,
          location,
          role: 'CANDIDATE',
          password: 'temp_password_' + Math.random().toString(36).substr(2, 9) // Temporary password
        }
      });
    } else {
      // Update existing user information
      await prisma.user.update({
        where: { id: candidate.id },
        data: {
          firstName,
          lastName,
          phone,
          location
        }
      });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId: id,
        candidateId: candidate.id,
        coverLetter,
        fitQuestionnaireResponses: fitQuestionnaire,
        status: 'APPLIED'
      },
      include: {
        job: {
          include: {
            company: true
          }
        },
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // TODO: Handle resume file upload
    // For now, we'll just store the filename if provided
    if (resume) {
      // In a real implementation, you would:
      // 1. Upload file to cloud storage (AWS S3, etc.)
      // 2. Store the file URL in the database
      // 3. Handle file validation and security
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        status: application.status,
        job: {
          title: application.job.title,
          company: application.job.company.name
        }
      }
    });
  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

module.exports = router;
