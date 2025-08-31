const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireRole, requireCompanyAccess } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all onboarding modules for company
router.get('/modules', requireCompanyAccess, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      contentType,
      isActive,
      sortBy = 'order',
      sortOrder = 'asc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    let whereClause = {
      companyId: req.user.companyId
    };

    // Filter by content type
    if (contentType) {
      whereClause.contentType = contentType;
    }

    // Filter by active status
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const modules = await prisma.onboardingModule.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            onboardingProgress: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const totalModules = await prisma.onboardingModule.count({ where: whereClause });

    res.json({
      modules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalModules,
        pages: Math.ceil(totalModules / limit)
      }
    });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// Create new onboarding module
router.post('/modules', [
  requireRole(['EMPLOYER', 'HR_MANAGER']),
  requireCompanyAccess,
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('content').trim().isLength({ min: 1 }),
  body('contentType').isIn(['TEXT', 'VIDEO', 'PDF', 'QUIZ']),
  body('order').isInt({ min: 1 }),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, contentType, order, isActive = true } = req.body;

    // Check if order already exists
    const existingModule = await prisma.onboardingModule.findFirst({
      where: {
        order: parseInt(order),
        companyId: req.user.companyId
      }
    });

    if (existingModule) {
      return res.status(400).json({ error: 'Module with this order already exists' });
    }

    const module = await prisma.onboardingModule.create({
      data: {
        title,
        content,
        contentType,
        order: parseInt(order),
        isActive,
        companyId: req.user.companyId
      }
    });

    res.status(201).json({
      message: 'Module created successfully',
      module
    });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ error: 'Failed to create module' });
  }
});

// Update onboarding module
router.put('/modules/:id', [
  requireRole(['EMPLOYER', 'HR_MANAGER']),
  requireCompanyAccess,
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().trim().isLength({ min: 1 }),
  body('contentType').optional().isIn(['TEXT', 'VIDEO', 'PDF', 'QUIZ']),
  body('order').optional().isInt({ min: 1 }),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, content, contentType, order, isActive } = req.body;

    // Check if module exists and belongs to user's company
    const existingModule = await prisma.onboardingModule.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingModule) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Check if order is being changed and if it already exists
    if (order && order !== existingModule.order) {
      const orderExists = await prisma.onboardingModule.findFirst({
        where: {
          order: parseInt(order),
          companyId: req.user.companyId,
          id: { not: id }
        }
      });

      if (orderExists) {
        return res.status(400).json({ error: 'Module with this order already exists' });
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (contentType) updateData.contentType = contentType;
    if (order) updateData.order = parseInt(order);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedModule = await prisma.onboardingModule.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Module updated successfully',
      module: updatedModule
    });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ error: 'Failed to update module' });
  }
});

// Delete onboarding module
router.delete('/modules/:id', [
  requireRole(['EMPLOYER', 'HR_MANAGER'])
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if module exists and belongs to user's company
    const existingModule = await prisma.onboardingModule.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      },
      include: {
        _count: {
          select: {
            onboardingProgress: true
          }
        }
      }
    });

    if (!existingModule) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Check if module has progress records
    if (existingModule._count.onboardingProgress > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete module with existing progress records. Deactivate instead.' 
      });
    }

    await prisma.onboardingModule.delete({
      where: { id }
    });

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ error: 'Failed to delete module' });
  }
});

// Get user's onboarding progress
router.get('/progress', async (req, res) => {
  try {
    const { userId } = req.query;
    const targetUserId = userId || req.user.id;

    // Check if user has access to view this progress
    if (userId && req.user.role === 'CANDIDATE') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const progress = await prisma.onboardingProgress.findMany({
      where: {
        userId: targetUserId,
        module: {
          companyId: req.user.companyId
        }
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            content: true,
            contentType: true,
            order: true,
            isActive: true
          }
        }
      },
      orderBy: {
        module: {
          order: 'asc'
        }
      }
    });

    // Calculate overall progress
    const totalModules = progress.length;
    const completedModules = progress.filter(p => p.status === 'COMPLETED').length;
    const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

    res.json({
      progress,
      stats: {
        totalModules,
        completedModules,
        inProgressModules: progress.filter(p => p.status === 'IN_PROGRESS').length,
        notStartedModules: progress.filter(p => p.status === 'NOT_STARTED').length,
        overallProgress: Math.round(overallProgress)
      }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Update onboarding progress
router.put('/progress/:moduleId', [
  body('status').isIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { moduleId } = req.params;
    const { status } = req.body;

    // Check if module exists and belongs to user's company
    const module = await prisma.onboardingModule.findFirst({
      where: {
        id: moduleId,
        companyId: req.user.companyId,
        isActive: true
      }
    });

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Update or create progress record
    const progress = await prisma.onboardingProgress.upsert({
      where: {
        userId_moduleId: {
          userId: req.user.id,
          moduleId
        }
      },
      update: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null
      },
      create: {
        userId: req.user.id,
        moduleId,
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            contentType: true,
            order: true
          }
        }
      }
    });

    res.json({
      message: 'Progress updated successfully',
      progress
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get onboarding dashboard for company
router.get('/dashboard', [
  requireRole(['EMPLOYER', 'HR_MANAGER'])
], requireCompanyAccess, async (req, res) => {
  try {
    const { userId } = req.query;

    // Get all modules for the company
    const modules = await prisma.onboardingModule.findMany({
      where: {
        companyId: req.user.companyId,
        isActive: true
      },
      orderBy: {
        order: 'asc'
      }
    });

    // Get all users in the company
    const users = await prisma.user.findMany({
      where: {
        companyId: req.user.companyId,
        role: { not: 'CANDIDATE' }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    });

    // Get progress for all users
    const allProgress = await prisma.onboardingProgress.findMany({
      where: {
        module: {
          companyId: req.user.companyId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        module: {
          select: {
            id: true,
            title: true,
            order: true
          }
        }
      }
    });

    // Calculate statistics
    const userProgress = users.map(user => {
      const userModules = modules.map(module => {
        const progress = allProgress.find(p => 
          p.userId === user.id && p.moduleId === module.id
        );
        return {
          moduleId: module.id,
          title: module.title,
          order: module.order,
          status: progress ? progress.status : 'NOT_STARTED',
          completedAt: progress ? progress.completedAt : null
        };
      });

      const completedCount = userModules.filter(m => m.status === 'COMPLETED').length;
      const progressPercentage = modules.length > 0 ? (completedCount / modules.length) * 100 : 0;

      return {
        user,
        modules: userModules,
        stats: {
          totalModules: modules.length,
          completedModules: completedCount,
          progressPercentage: Math.round(progressPercentage)
        }
      };
    });

    res.json({
      modules,
      userProgress,
      stats: {
        totalUsers: users.length,
        totalModules: modules.length,
        averageProgress: userProgress.length > 0 ? 
          Math.round(userProgress.reduce((acc, up) => acc + up.stats.progressPercentage, 0) / userProgress.length) : 0
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

module.exports = router;
