const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Admin middleware
 * Checks if the authenticated user has admin privileges
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Verify user still exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated or not found.'
      });
    }

    // Update user role in request object
    req.user.role = user.role;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization.'
    });
  }
};

/**
 * Staff middleware
 * Checks if the authenticated user has staff privileges
 */
const staffMiddleware = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has staff role
    if (req.user.role !== 'STAFF') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff privileges required.'
      });
    }

    // Verify user still exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated or not found.'
      });
    }

    next();
  } catch (error) {
    console.error('Staff middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization.'
    });
  }
};

/**
 * Role-based access control middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const roleMiddleware = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
      }

      // Verify user still exists and is active in database
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          role: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated or not found.'
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authorization.'
      });
    }
  };
};

module.exports = {
  adminMiddleware,
  staffMiddleware,
  roleMiddleware
};
