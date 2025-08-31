const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireRole, requireCompanyAccess } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all jobs for company (with filters)
router.get('/', requireCompanyAccess, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
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
  body('requirements').isObject(),
  body('location').optional().trim(),
  body('salaryMin').optional().isInt({ min: 0 }),
  body('salaryMax').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, requirements, location, salaryMin, salaryMax } = req.body;

    // Validate salary range
    if (salaryMin && salaryMax && salaryMin > salaryMax) {
      return res.status(400).json({ error: 'Minimum salary cannot be greater than maximum salary' });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements,
        location,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
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

module.exports = router;
