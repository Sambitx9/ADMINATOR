import express from 'express';
import { login, getMe } from '../controllers/authController.js';
import {
  authenticateJWT,
  requireRoles,
  enforceCollegeIsolation
} from '../middlewares/authMiddleware.js';
import { loginRateLimiter } from '../middlewares/loginRateLimiter.js';

const router = express.Router();

// Public login route with brute-force rate limiting
router.post('/login', loginRateLimiter, login);

// Protected profile route
router.get('/me', authenticateJWT, getMe);

// Verification routes for RBAC & Multi-Tenant Isolation
router.get(
  '/test/admin-only',
  authenticateJWT,
  requireRoles('COLLEGE_ADMIN', 'PLATFORM_ADMIN'),
  (req, res) => {
    res.json({ success: true, message: 'Admin Area Access Granted' });
  }
);

router.get('/test/tenant-isolation', authenticateJWT, enforceCollegeIsolation, (req, res) => {
  res.json({ success: true, tenantCollegeId: req.tenantCollegeId });
});

export default router;
