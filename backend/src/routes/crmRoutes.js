import express from 'express';
import {
  getLeads,
  getLeadById,
  assignLead,
  updateEnquiryStatus,
  addInternalNote,
  getInternalNotes,
  getAuditLogs,
  getCounsellors,
  getDashboardMetrics,
  getStudents,
  getExecutiveAnalytics
} from '../controllers/crmController.js';
import { authenticateJWT, requireRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Real-time admission metrics and workload
router.get('/metrics', authenticateJWT, getDashboardMetrics);

// Executive Analytics Dashboard (Task 5.2)
router.get('/analytics', authenticateJWT, getExecutiveAnalytics);

// Eligible counsellors list for lead assignment
router.get('/counsellors', authenticateJWT, getCounsellors);

// Student and Roster records (Authenticated Staff Only)
router.get('/students', authenticateJWT, getStudents);

// Lead discovery and details
router.get('/leads', authenticateJWT, getLeads);
router.get('/leads/:id', authenticateJWT, getLeadById);

// Lead assignment (Admins only)
router.post(
  '/leads/:id/assign',
  authenticateJWT,
  requireRoles('COLLEGE_ADMIN', 'PLATFORM_ADMIN'),
  assignLead
);

// Enquiry & Lead lifecycle status transitions (aliased for architectural consistency)
router.patch('/leads/:id/status', authenticateJWT, updateEnquiryStatus);
router.patch('/enquiries/:id/status', authenticateJWT, updateEnquiryStatus);

// Confidential internal notes (aliased for architectural consistency)
router.post('/leads/:id/notes', authenticateJWT, addInternalNote);
router.get('/leads/:id/notes', authenticateJWT, getInternalNotes);
router.post('/enquiries/:id/notes', authenticateJWT, addInternalNote);
router.get('/enquiries/:id/notes', authenticateJWT, getInternalNotes);

// Immutable audit log inspection (Admins only)
router.get(
  '/audit-logs',
  authenticateJWT,
  requireRoles('COLLEGE_ADMIN', 'PLATFORM_ADMIN'),
  getAuditLogs
);

export default router;
