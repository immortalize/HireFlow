const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const requireCompanyAccess = async (req, res, next) => {
  if (!req.user.companyId) {
    return res.status(403).json({ error: 'Company access required' });
  }

  // For company-specific resources, ensure user belongs to the company
  const resourceCompanyId = req.params.companyId || req.body.companyId;
  
  if (resourceCompanyId && resourceCompanyId !== req.user.companyId) {
    return res.status(403).json({ error: 'Access denied to this company resource' });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireCompanyAccess
};
