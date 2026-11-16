import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Authentication Middleware
 * Validates incoming Bearer JWT and attaches the authenticated user record to req.user
 */
export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token is required'
        }
      });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Security Critical] JWT_SECRET is not configured in environment variables');
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_CONFIGURATION_ERROR',
          message: 'Authentication system is temporarily unavailable'
        }
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      const isExpired = err.name === 'TokenExpiredError';
      return res.status(401).json({
        success: false,
        error: {
          code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
          message: isExpired ? 'Authentication token has expired' : 'Invalid authentication token'
        }
      });
    }

    // Retrieve user by ID (passwordHash is excluded by default schema config)
    const user = await User.findById(decoded.userId).populate('collegeId', 'code name district');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account no longer exists'
        }
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Account is deactivated. Please contact your system administrator.'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[AuthMiddleware Error]:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal authentication error occurred'
      }
    });
  }
};

/**
 * Role-Based Access Control (RBAC) Guard
 * @param  {...string} allowedRoles Allowed user roles e.g. 'COLLEGE_ADMIN', 'COUNSELLOR'
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is not authenticated'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: insufficient permissions for this role'
        }
      });
    }

    next();
  };
};

/**
 * College-Level Multi-Tenant Isolation Middleware
 * Prevents staff belonging to College A from accessing or mutating College B's enquiries
 */
export const enforceCollegeIsolation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User is not authenticated' }
    });
  }

  // PLATFORM_ADMIN has global scope across all institutions
  if (req.user.role === 'PLATFORM_ADMIN') {
    req.tenantCollegeId = req.query.collegeId || req.body.collegeId || null;
    return next();
  }

  const staffCollegeId = req.user.collegeId?._id
    ? req.user.collegeId._id.toString()
    : req.user.collegeId?.toString();

  if (!staffCollegeId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_ASSIGNMENT_MISSING',
        message: 'Your account is not assigned to an active college'
      }
    });
  }

  // Check target college in params, query, or body if specified
  const targetCollegeId = req.params.collegeId || req.query.collegeId || req.body.collegeId;

  if (targetCollegeId && targetCollegeId.toString() !== staffCollegeId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_ISOLATION_VIOLATION',
        message: 'Access denied: You cannot access or modify records of another college'
      }
    });
  }

  // Attach verified tenant college ID to request
  req.tenantCollegeId = staffCollegeId;
  next();
};
