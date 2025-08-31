const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireRole, requireCompanyAccess } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all leads for company
router.get('/leads', requireCompanyAccess, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      assignedTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    let whereClause = {
      companyId: req.user.companyId
    };

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by assigned user
    if (assignedTo) {
      whereClause.assignedToId = assignedTo;
    }

    // Search functionality
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const leads = await prisma.cRMLead.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const totalLeads = await prisma.cRMLead.count({ where: whereClause });

    res.json({
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalLeads,
        pages: Math.ceil(totalLeads / limit)
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Create new lead
router.post('/leads', [
  requireRole(['EMPLOYER', 'HR_MANAGER', 'BUSINESS_DEV']),
  requireCompanyAccess,
  body('name').trim().isLength({ min: 1 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('status').optional().isIn(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
  body('source').optional().trim(),
  body('notes').optional().trim(),
  body('assignedToId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      email, 
      phone, 
      company, 
      status = 'NEW', 
      source, 
      notes, 
      assignedToId 
    } = req.body;

    // Check if lead already exists
    const existingLead = await prisma.cRMLead.findFirst({
      where: {
        email,
        companyId: req.user.companyId
      }
    });

    if (existingLead) {
      return res.status(400).json({ error: 'Lead with this email already exists' });
    }

    const lead = await prisma.cRMLead.create({
      data: {
        name,
        email,
        phone,
        company,
        status,
        source,
        notes,
        assignedToId: assignedToId || req.user.id,
        companyId: req.user.companyId
      },
      include: {
        assignedTo: {
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
      message: 'Lead created successfully',
      lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Update lead
router.put('/leads/:id', [
  requireRole(['EMPLOYER', 'HR_MANAGER', 'BUSINESS_DEV']),
  requireCompanyAccess,
  body('name').optional().trim().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('status').optional().isIn(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
  body('source').optional().trim(),
  body('notes').optional().trim(),
  body('assignedToId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { 
      name, 
      email, 
      phone, 
      company, 
      status, 
      source, 
      notes, 
      assignedToId 
    } = req.body;

    // Check if lead exists and belongs to user's company
    const existingLead = await prisma.cRMLead.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingLead.email) {
      const emailExists = await prisma.cRMLead.findFirst({
        where: {
          email,
          companyId: req.user.companyId,
          id: { not: id }
        }
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Lead with this email already exists' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (status) updateData.status = status;
    if (source !== undefined) updateData.source = source;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedToId) updateData.assignedToId = assignedToId;

    const updatedLead = await prisma.cRMLead.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
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
      message: 'Lead updated successfully',
      lead: updatedLead
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Delete lead
router.delete('/leads/:id', [
  requireRole(['EMPLOYER', 'HR_MANAGER'])
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if lead exists and belongs to user's company
    const existingLead = await prisma.cRMLead.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await prisma.cRMLead.delete({
      where: { id }
    });

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// Get all partners for company
router.get('/partners', requireCompanyAccess, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      status,
      search,
      assignedTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    let whereClause = {
      companyId: req.user.companyId
    };

    // Filter by type
    if (type) {
      whereClause.type = type;
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by assigned user
    if (assignedTo) {
      whereClause.assignedToId = assignedTo;
    }

    // Search functionality
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const partners = await prisma.cRMPartner.findMany({
      where: whereClause,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const totalPartners = await prisma.cRMPartner.count({ where: whereClause });

    res.json({
      partners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalPartners,
        pages: Math.ceil(totalPartners / limit)
      }
    });
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

// Create new partner
router.post('/partners', [
  requireRole(['EMPLOYER', 'HR_MANAGER', 'BUSINESS_DEV']),
  requireCompanyAccess,
  body('name').trim().isLength({ min: 1 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('type').isIn(['RECRUITER', 'CONSULTANT', 'VENDOR', 'CLIENT']),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'PROSPECT']),
  body('notes').optional().trim(),
  body('assignedToId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      email, 
      phone, 
      company, 
      type, 
      status = 'ACTIVE', 
      notes, 
      assignedToId 
    } = req.body;

    // Check if partner already exists
    const existingPartner = await prisma.cRMPartner.findFirst({
      where: {
        email,
        companyId: req.user.companyId
      }
    });

    if (existingPartner) {
      return res.status(400).json({ error: 'Partner with this email already exists' });
    }

    const partner = await prisma.cRMPartner.create({
      data: {
        name,
        email,
        phone,
        company,
        type,
        status,
        notes,
        assignedToId: assignedToId || req.user.id,
        companyId: req.user.companyId
      },
      include: {
        assignedTo: {
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
      message: 'Partner created successfully',
      partner
    });
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({ error: 'Failed to create partner' });
  }
});

// Update partner
router.put('/partners/:id', [
  requireRole(['EMPLOYER', 'HR_MANAGER', 'BUSINESS_DEV']),
  requireCompanyAccess,
  body('name').optional().trim().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('type').optional().isIn(['RECRUITER', 'CONSULTANT', 'VENDOR', 'CLIENT']),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'PROSPECT']),
  body('notes').optional().trim(),
  body('assignedToId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { 
      name, 
      email, 
      phone, 
      company, 
      type, 
      status, 
      notes, 
      assignedToId 
    } = req.body;

    // Check if partner exists and belongs to user's company
    const existingPartner = await prisma.cRMPartner.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingPartner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingPartner.email) {
      const emailExists = await prisma.cRMPartner.findFirst({
        where: {
          email,
          companyId: req.user.companyId,
          id: { not: id }
        }
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Partner with this email already exists' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (type) updateData.type = type;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedToId) updateData.assignedToId = assignedToId;

    const updatedPartner = await prisma.cRMPartner.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
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
      message: 'Partner updated successfully',
      partner: updatedPartner
    });
  } catch (error) {
    console.error('Update partner error:', error);
    res.status(500).json({ error: 'Failed to update partner' });
  }
});

// Delete partner
router.delete('/partners/:id', [
  requireRole(['EMPLOYER', 'HR_MANAGER'])
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if partner exists and belongs to user's company
    const existingPartner = await prisma.cRMPartner.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingPartner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    await prisma.cRMPartner.delete({
      where: { id }
    });

    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('Delete partner error:', error);
    res.status(500).json({ error: 'Failed to delete partner' });
  }
});

// Get CRM statistics
router.get('/stats', requireCompanyAccess, async (req, res) => {
  try {
    const [leads, partners] = await Promise.all([
      prisma.cRMLead.findMany({
        where: { companyId: req.user.companyId },
        select: { status: true }
      }),
      prisma.cRMPartner.findMany({
        where: { companyId: req.user.companyId },
        select: { type: true, status: true }
      })
    ]);

    // Calculate lead statistics
    const leadStats = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate partner statistics
    const partnerStats = partners.reduce((acc, partner) => {
      if (!acc[partner.type]) {
        acc[partner.type] = {};
      }
      acc[partner.type][partner.status] = (acc[partner.type][partner.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      stats: {
        totalLeads: leads.length,
        totalPartners: partners.length,
        leadStats,
        partnerStats
      }
    });
  } catch (error) {
    console.error('Get CRM stats error:', error);
    res.status(500).json({ error: 'Failed to fetch CRM statistics' });
  }
});

module.exports = router;
