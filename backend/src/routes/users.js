const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireRole, requireCompanyAccess } = require('../middleware/auth');
const { generateInvitationToken } = require('../utils/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users for company
router.get('/', requireCompanyAccess, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    let whereClause = {
      companyId: req.user.companyId
    };

    // Filter by role
    if (role) {
      whereClause.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Search functionality
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const totalUsers = await prisma.user.count({ where: whereClause });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', requireCompanyAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', [
  requireRole(['EMPLOYER', 'HR_MANAGER']),
  requireCompanyAccess,
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('role').optional().isIn(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER', 'BUSINESS_DEV', 'CANDIDATE']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { firstName, lastName, role, isActive } = req.body;

    // Check if user exists and belongs to user's company
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent changing own role or deactivating self
    if (id === req.user.id) {
      if (role && role !== req.user.role) {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }
      if (isActive === false) {
        return res.status(400).json({ error: 'Cannot deactivate your own account' });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Invite user to company
router.post('/invite', [
  requireRole(['EMPLOYER', 'HR_MANAGER']),
  requireCompanyAccess,
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['HR_MANAGER', 'HIRING_MANAGER', 'BUSINESS_DEV']),
  body('message').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, role, message } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.userInvitation.findFirst({
      where: {
        email,
        companyId: req.user.companyId,
        acceptedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Create invitation
    const token = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.userInvitation.create({
      data: {
        email,
        role,
        companyId: req.user.companyId,
        inviterId: req.user.id,
        token,
        expiresAt
      },
      include: {
        inviter: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // TODO: Send email invitation
    // For now, just return the invitation data
    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        inviter: invitation.inviter
      }
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Get pending invitations
router.get('/invitations', requireCompanyAccess, async (req, res) => {
  try {
    const invitations = await prisma.userInvitation.findMany({
      where: {
        companyId: req.user.companyId,
        acceptedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: {
        inviter: {
          select: {
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

    res.json({ invitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// Accept invitation
router.post('/invitations/:token/accept', [
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('password').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { firstName, lastName, password } = req.body;

    // Find invitation
    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      include: {
        inviter: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid invitation token' });
    }

    if (invitation.acceptedAt) {
      return res.status(400).json({ error: 'Invitation already accepted' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user
    const { hashPassword } = require('../utils/auth');
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        passwordHash,
        firstName,
        lastName,
        role: invitation.role,
        companyId: invitation.companyId
      },
      include: {
        company: true
      }
    });

    // Update invitation
    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: {
        acceptedAt: new Date(),
        inviteeId: user.id
      }
    });

    // Generate token
    const { generateToken } = require('../utils/auth');
    const authToken = generateToken(user.id, user.role, user.companyId);

    res.json({
      message: 'Invitation accepted successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company
      },
      token: authToken
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Cancel invitation
router.delete('/invitations/:id', [
  requireRole(['EMPLOYER', 'HR_MANAGER'])
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if invitation exists and belongs to user's company
    const invitation = await prisma.userInvitation.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
        acceptedAt: null
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    await prisma.userInvitation.delete({
      where: { id }
    });

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({ error: 'Failed to cancel invitation' });
  }
});

// Get company settings
router.get('/company/settings', requireCompanyAccess, async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        website: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ company });
  } catch (error) {
    console.error('Get company settings error:', error);
    res.status(500).json({ error: 'Failed to fetch company settings' });
  }
});

// Update company settings
router.put('/company/settings', [
  requireRole(['EMPLOYER', 'HR_MANAGER']),
  requireCompanyAccess,
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('logo').optional().trim(),
  body('primaryColor').optional().trim(),
  body('secondaryColor').optional().trim(),
  body('website').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, logo, primaryColor, secondaryColor, website } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;
    if (primaryColor) updateData.primaryColor = primaryColor;
    if (secondaryColor) updateData.secondaryColor = secondaryColor;
    if (website !== undefined) updateData.website = website;

    const updatedCompany = await prisma.company.update({
      where: { id: req.user.companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        website: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Company settings updated successfully',
      company: updatedCompany
    });
  } catch (error) {
    console.error('Update company settings error:', error);
    res.status(500).json({ error: 'Failed to update company settings' });
  }
});

module.exports = router;
