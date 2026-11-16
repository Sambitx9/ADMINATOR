import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

/**
 * POST /api/v1/auth/login
 * Public authentication endpoint for Staff, Admins, and Counsellors
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // 1. Input Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email address is required'
        }
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password is required'
        }
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format'
        }
      });
    }

    // 2. Query user with explicitly loaded passwordHash
    const user = await User.findOne({ email: normalizedEmail })
      .select('+passwordHash')
      .populate('collegeId', 'code name district');

    // 3. Prevent account enumeration by using identical generic error message
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // 4. Check account active status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Account is deactivated. Please contact your system administrator.'
        }
      });
    }

    // 5. Verify bcrypt password hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // 6. Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Critical Error] JWT_SECRET is not configured in backend environment.');
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_CONFIGURATION_ERROR',
          message: 'Authentication service configuration error'
        }
      });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
    const payload = {
      userId: user._id.toString(),
      role: user.role,
      collegeId: user.collegeId?._id ? user.collegeId._id.toString() : user.collegeId?.toString() || null
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn });

    // 7. Sanitize output (passwordHash and __v stripped via schema toJSON)
    const sanitizedUser = user.toJSON();

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: {
        token,
        tokenType: 'Bearer',
        expiresIn,
        user: sanitizedUser
      }
    });
  } catch (error) {
    console.error('[AuthController Login Error]:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal server error occurred during authentication'
      }
    });
  }
};

/**
 * GET /api/v1/auth/me
 * Protected endpoint returning authenticated staff profile
 */
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    });
  } catch (error) {
    console.error('[AuthController getMe Error]:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve user profile'
      }
    });
  }
};
