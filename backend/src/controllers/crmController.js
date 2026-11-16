import mongoose from 'mongoose';
import { Enquiry, Student, User, Conversation, College, Course, Branch } from '../models/index.js';
import { AuditLog } from '../models/AuditLog.js';
import { localEventBus } from '../services/LocalEventDispatcher.js';

// Status transition state machine
const ALLOWED_TRANSITIONS = {
  NEW: ['ASSIGNED', 'CONTACTED', 'REJECTED'],
  ASSIGNED: ['CONTACTED', 'VERIFIED', 'REJECTED'],
  CONTACTED: ['VERIFIED', 'ENROLLED', 'REJECTED', 'ASSIGNED'],
  VERIFIED: ['ENROLLED', 'REJECTED', 'CONTACTED'],
  ENROLLED: [], // Terminal state
  REJECTED: ['NEW', 'ASSIGNED'] // Only re-openable by Admins
};

const VALID_STATUSES = ['NEW', 'ASSIGNED', 'CONTACTED', 'VERIFIED', 'ENROLLED', 'REJECTED'];

/**
 * Escapes special characters for safe regular expression search (prevents ReDoS/NoSQL injection)
 */
const escapeRegex = (str) => {
  return typeof str === 'string' ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
};

/**
 * GET /api/v1/crm/leads
 * Lists leads with filtering, search, pagination, and multi-tenant isolation
 */
export const getLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      priority,
      assignedCounsellorId,
      collegeId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build query filter with strict tenant isolation
    const filter = {};

    // 1. Enforce Tenant Isolation
    if (req.user.role === 'PLATFORM_ADMIN') {
      if (collegeId && mongoose.isValidObjectId(collegeId)) {
        filter.collegeId = collegeId;
      }
    } else {
      // COUNSELLOR and COLLEGE_ADMIN are strictly confined to their assigned college
      const staffCollegeId = req.user.collegeId?._id || req.user.collegeId;
      if (!staffCollegeId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_UNASSIGNED', message: 'Staff member is not assigned to a college' }
        });
      }
      filter.collegeId = staffCollegeId;
    }

    // 2. Status & Priority filtering
    if (status && VALID_STATUSES.includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    if (priority && ['HOT', 'WARM', 'COLD'].includes(priority.toUpperCase())) {
      filter.priority = priority.toUpperCase();
    }

    if (assignedCounsellorId && mongoose.isValidObjectId(assignedCounsellorId)) {
      filter.assignedCounsellorId = assignedCounsellorId;
    }

    // 3. Search handling (student name, tracking ID, mobile number)
    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      const studentMatches = await Student.find({
        $or: [
          { fullName: new RegExp(sanitized, 'i') },
          { mobileNumber: new RegExp(sanitized, 'i') }
        ]
      }).select('_id');

      const studentIds = studentMatches.map((s) => s._id);

      filter.$or = [
        { trackingId: new RegExp(sanitized, 'i') },
        { studentId: { $in: studentIds } }
      ];
    }

    // 4. Sorting
    const sortField = ['createdAt', 'updatedAt', 'priority', 'status'].includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    // 5. Query database
    const [leads, totalLeads] = await Promise.all([
      Enquiry.find(filter)
        .populate('studentId', 'fullName mobileNumber email district category qualification')
        .populate('collegeId', 'name code district')
        .populate('courseId', 'title code durationYears')
        .populate('assignedCounsellorId', 'name email phone role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Enquiry.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalLeads / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: {
        leads,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalLeads,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('[CRMController getLeads Error]:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve leads' }
    });
  }
};

/**
 * GET /api/v1/crm/leads/:id
 * Retrieves authorized enquiry details, student information, and conversation history
 */
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid lead ID format' }
      });
    }

    const enquiry = await Enquiry.findById(id)
      .populate('studentId')
      .populate('collegeId', 'name code district address contactEmail contactPhone facilities')
      .populate('courseId', 'title code durationYears intakeCapacity')
      .populate('assignedCounsellorId', 'name email phone role')
      .populate('statusHistory.changedBy', 'name role');

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lead not found' }
      });
    }

    // Tenant check
    if (req.user.role !== 'PLATFORM_ADMIN') {
      const staffCollegeId = req.user.collegeId?._id?.toString() || req.user.collegeId?.toString();
      const enquiryCollegeId = enquiry.collegeId?._id?.toString() || enquiry.collegeId?.toString();
      if (staffCollegeId !== enquiryCollegeId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: You cannot access leads from another college'
          }
        });
      }
    }

    // Retrieve linked chat transcript if available
    const conversation = await Conversation.findOne({
      $or: [{ enquiryId: enquiry._id }, { collegeId: enquiry.collegeId?._id }]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        enquiry,
        conversation: conversation
          ? {
              sessionId: conversation.sessionId,
              language: conversation.language,
              messages: conversation.messages,
              handoffRequested: conversation.handoffRequested
            }
          : null
      }
    });
  } catch (error) {
    console.error('[CRMController getLeadById Error]:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve lead details' }
    });
  }
};

/**
 * POST /api/v1/crm/leads/:id/assign
 * Assigns an enquiry to an authorized counsellor
 */
export const assignLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { counsellorId } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid lead ID format' }
      });
    }

    if (!counsellorId || !mongoose.isValidObjectId(counsellorId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'A valid counsellorId is required' }
      });
    }

    // Permission check: Only COLLEGE_ADMIN or PLATFORM_ADMIN can assign leads
    if (!['COLLEGE_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: Only College Admins or Platform Admins can assign leads'
        }
      });
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lead not found' }
      });
    }

    // Requester tenant isolation check
    if (req.user.role !== 'PLATFORM_ADMIN') {
      const staffCollegeId = req.user.collegeId?._id?.toString() || req.user.collegeId?.toString();
      const enquiryCollegeId = enquiry.collegeId?.toString();
      if (staffCollegeId !== enquiryCollegeId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: You cannot assign leads for another college'
          }
        });
      }
    }

    // Validate target counsellor
    const counsellor = await User.findById(counsellorId);
    if (!counsellor) {
      return res.status(404).json({
        success: false,
        error: { code: 'COUNSELLOR_NOT_FOUND', message: 'Target counsellor not found' }
      });
    }

    if (!counsellor.isActive) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COUNSELLOR_INACTIVE',
          message: 'Cannot assign lead to a deactivated counsellor'
        }
      });
    }

    if (!['COUNSELLOR', 'COLLEGE_ADMIN'].includes(counsellor.role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STAFF_ROLE',
          message: 'Target staff member must have COUNSELLOR or COLLEGE_ADMIN role'
        }
      });
    }

    // Target counsellor must belong to the same college as the enquiry
    const counsellorCollegeId = counsellor.collegeId?.toString();
    const enquiryCollegeId = enquiry.collegeId?.toString();
    if (counsellorCollegeId !== enquiryCollegeId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CROSS_COLLEGE_ASSIGNMENT_FORBIDDEN',
          message: 'Target counsellor does not belong to the same college as this enquiry'
        }
      });
    }

    const previousCounsellorId = enquiry.assignedCounsellorId
      ? enquiry.assignedCounsellorId.toString()
      : null;

    enquiry.assignedCounsellorId = counsellor._id;

    // Auto-advance status from NEW to ASSIGNED upon assignment
    const previousStatus = enquiry.status;
    if (enquiry.status === 'NEW') {
      enquiry.status = 'ASSIGNED';
      enquiry.statusHistory.push({
        fromStatus: previousStatus,
        toStatus: 'ASSIGNED',
        changedBy: req.user._id,
        changedByName: req.user.name,
        changedByRole: req.user.role,
        reason: `Assigned to ${counsellor.name}`,
        timestamp: new Date()
      });
    }

    await enquiry.save();

    // Create Audit Log entry
    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      collegeId: enquiry.collegeId,
      entityType: 'ENQUIRY',
      entityId: enquiry._id,
      action: 'LEAD_ASSIGNED',
      previousValue: previousCounsellorId,
      newValue: counsellor._id.toString(),
      metadata: {
        counsellorName: counsellor.name,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    const updated = await Enquiry.findById(id)
      .populate('studentId')
      .populate('collegeId', 'name code')
      .populate('assignedCounsellorId', 'name email phone');

    // Dispatch LEAD_ASSIGNED automation event
    localEventBus.dispatch('LEAD_ASSIGNED', {
      trackingId: updated.trackingId,
      counsellorId: counsellor._id.toString(),
      counsellorName: counsellor.name,
      counsellorEmail: counsellor.email,
      assignedByName: req.user.name,
      collegeCode: updated.collegeId?.code || 'DRIEMS'
    });

    return res.status(200).json({
      success: true,
      message: `Lead successfully assigned to ${counsellor.name}`,
      data: { enquiry: updated }
    });
  } catch (error) {
    console.error('[CRMController assignLead Error]:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to assign lead' }
    });
  }
};

/**
 * PATCH /api/v1/crm/enquiries/:id/status
 * Updates enquiry status with strict transition validation and audit logging
 */
export const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid lead ID format' }
      });
    }

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Target status is required' }
      });
    }

    const targetStatus = status.trim().toUpperCase();
    if (!VALID_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Status must be one of: ${VALID_STATUSES.join(', ')}`
        }
      });
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lead not found' }
      });
    }

    // Tenant check
    if (req.user.role !== 'PLATFORM_ADMIN') {
      const staffCollegeId = req.user.collegeId?._id?.toString() || req.user.collegeId?.toString();
      const enquiryCollegeId = enquiry.collegeId?.toString();
      if (staffCollegeId !== enquiryCollegeId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: You cannot update status of another college’s enquiry'
          }
        });
      }
    }

    const currentStatus = enquiry.status;

    if (currentStatus === targetStatus) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_STATUS_CHANGE',
          message: `Enquiry is already in ${targetStatus} status`
        }
      });
    }

    // State transition validation
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Invalid status transition from ${currentStatus} to ${targetStatus}. Allowed next states: ${
            allowed.length > 0 ? allowed.join(', ') : 'None (Terminal state)'
          }`
        }
      });
    }

    // Require reason if transitioning to REJECTED
    if (targetStatus === 'REJECTED') {
      if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'REJECTION_REASON_REQUIRED',
            message: 'A rejection reason (minimum 5 characters) is mandatory when rejecting a lead'
          }
        });
      }
    }

    // Apply status update
    const previousStatus = currentStatus;
    enquiry.status = targetStatus;
    if (targetStatus === 'REJECTED') {
      enquiry.rejectionReason = reason.trim();
    }

    enquiry.statusHistory.push({
      fromStatus: currentStatus,
      toStatus: targetStatus,
      changedBy: req.user._id,
      changedByName: req.user.name,
      changedByRole: req.user.role,
      reason: reason ? reason.trim() : null,
      timestamp: new Date()
    });

    await enquiry.save();

    // Create Audit Log entry
    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      collegeId: enquiry.collegeId,
      entityType: 'ENQUIRY',
      entityId: enquiry._id,
      action: 'STATUS_CHANGED',
      previousValue: currentStatus,
      newValue: targetStatus,
      metadata: {
        reason: reason ? reason.trim() : null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Dispatch STATUS_CHANGED automation event
    localEventBus.dispatch('STATUS_CHANGED', {
      trackingId: enquiry.trackingId,
      fromStatus: previousStatus,
      toStatus: targetStatus,
      changedByName: req.user.name,
      changedByRole: req.user.role,
      collegeCode: 'DRIEMS'
    });

    return res.status(200).json({
      success: true,
      message: `Status updated to ${targetStatus}`,
      data: {
        trackingId: enquiry.trackingId,
        previousStatus,
        currentStatus: targetStatus,
        status: targetStatus,
        updatedAt: enquiry.updatedAt,
        statusHistory: enquiry.statusHistory
      }
    });
  } catch (error) {
    console.error('[CRMController updateEnquiryStatus Error]:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update enquiry status' }
    });
  }
};

/**
 * POST /api/v1/crm/enquiries/:id/notes
 * Adds an internal counsellor note to an enquiry
 */
export const addInternalNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, noteText } = req.body || {};
    const noteContent = text || noteText;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid lead ID format' }
      });
    }

    if (!noteContent || typeof noteContent !== 'string' || noteContent.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Note text is required (minimum 3 characters)'
        }
      });
    }

    if (noteContent.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Note text cannot exceed 2000 characters'
        }
      });
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lead not found' }
      });
    }

    // Tenant check
    if (req.user.role !== 'PLATFORM_ADMIN') {
      const staffCollegeId = req.user.collegeId?._id?.toString() || req.user.collegeId?.toString();
      const enquiryCollegeId = enquiry.collegeId?.toString();
      if (staffCollegeId !== enquiryCollegeId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: You cannot add notes to another college’s enquiry'
          }
        });
      }
    }

    const note = {
      noteId: new mongoose.Types.ObjectId(),
      authorId: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      text: noteContent.trim(),
      createdAt: new Date()
    };

    enquiry.internalNotes.push(note);
    await enquiry.save();

    // Create Audit Log entry
    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      collegeId: enquiry.collegeId,
      entityType: 'NOTE',
      entityId: enquiry._id,
      action: 'NOTE_ADDED',
      newValue: {
        noteId: note.noteId.toString(),
        summary: note.text.substring(0, 60)
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Internal note added successfully',
      data: { note }
    });
  } catch (error) {
    console.error('[CRMController addInternalNote Error]:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add internal note' }
    });
  }
};

/**
 * GET /api/v1/crm/enquiries/:id/notes
 * Retrieves internal notes for an enquiry (staff only)
 */
export const getInternalNotes = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid lead ID format' }
      });
    }

    const enquiry = await Enquiry.findById(id).select('collegeId internalNotes');
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lead not found' }
      });
    }

    // Tenant check
    if (req.user.role !== 'PLATFORM_ADMIN') {
      const staffCollegeId = req.user.collegeId?._id?.toString() || req.user.collegeId?.toString();
      const enquiryCollegeId = enquiry.collegeId?.toString();
      if (staffCollegeId !== enquiryCollegeId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: You cannot view notes for another college’s enquiry'
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        notes: enquiry.internalNotes || []
      }
    });
  } catch (error) {
    console.error('[CRMController getInternalNotes Error]:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve notes' }
    });
  }
};

/**
 * GET /api/v1/crm/audit-logs
 * Retrieves immutable audit logs (COLLEGE_ADMIN & PLATFORM_ADMIN only)
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, entityId, action, collegeId } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    // Tenant isolation: COLLEGE_ADMIN sees only their college's audit logs
    if (req.user.role === 'PLATFORM_ADMIN') {
      if (collegeId && mongoose.isValidObjectId(collegeId)) {
        filter.collegeId = collegeId;
      }
    } else {
      const staffCollegeId = req.user.collegeId?._id || req.user.collegeId;
      if (!staffCollegeId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_UNASSIGNED', message: 'Staff member is not assigned to a college' }
        });
      }
      filter.collegeId = staffCollegeId;
    }

    if (entityId && mongoose.isValidObjectId(entityId)) {
      filter.entityId = entityId;
    }

    if (action && typeof action === 'string') {
      filter.action = action.trim().toUpperCase();
    }

    const [logs, totalLogs] = await Promise.all([
      AuditLog.find(filter)
        .populate('actorId', 'name email role')
        .populate('collegeId', 'name code')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalLogs / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalLogs,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('[CRMController getAuditLogs Error]:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve audit logs' }
    });
  }
};

/**
 * GET /api/v1/crm/counsellors
 * Retrieves active counsellors for lead assignment
 */
export const getCounsellors = async (req, res) => {
  try {
    const filter = { isActive: true, role: { $in: ['COUNSELLOR', 'COLLEGE_ADMIN'] } };
    if (req.user.role !== 'PLATFORM_ADMIN') {
      const staffCollegeId = req.user.collegeId?._id || req.user.collegeId;
      filter.collegeId = staffCollegeId;
    } else if (req.query.collegeId && mongoose.isValidObjectId(req.query.collegeId)) {
      filter.collegeId = req.query.collegeId;
    }

    const counsellors = await User.find(filter)
      .select('name email phone role collegeId isActive')
      .populate('collegeId', 'code name')
      .lean();

    return res.status(200).json({
      success: true,
      data: { counsellors }
    });
  } catch (error) {
    console.error('[CRMController getCounsellors Error]:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve counsellors' }
    });
  }
};

/**
 * GET /api/v1/crm/metrics
 * Retrieves real-time admissions pipeline metrics and recent activity
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    const filter = {};
    let auditFilter = {};

    if (req.user.role !== 'PLATFORM_ADMIN') {
      const staffCollegeId = req.user.collegeId?._id || req.user.collegeId;
      if (!staffCollegeId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_UNASSIGNED', message: 'Staff member is not assigned to a college' }
        });
      }
      filter.collegeId = staffCollegeId;
      auditFilter.collegeId = staffCollegeId;
    } else if (req.query.collegeId && mongoose.isValidObjectId(req.query.collegeId)) {
      filter.collegeId = req.query.collegeId;
      auditFilter.collegeId = req.query.collegeId;
    }

    const [
      totalLeads,
      newLeads,
      assignedLeads,
      contactedLeads,
      verifiedLeads,
      enrolledLeads,
      rejectedLeads,
      recentLeads,
      recentActivity,
      activeCounsellors
    ] = await Promise.all([
      Enquiry.countDocuments(filter),
      Enquiry.countDocuments({ ...filter, status: 'NEW' }),
      Enquiry.countDocuments({ ...filter, status: 'ASSIGNED' }),
      Enquiry.countDocuments({ ...filter, status: 'CONTACTED' }),
      Enquiry.countDocuments({ ...filter, status: 'VERIFIED' }),
      Enquiry.countDocuments({ ...filter, status: 'ENROLLED' }),
      Enquiry.countDocuments({ ...filter, status: 'REJECTED' }),
      Enquiry.find(filter)
        .populate('studentId', 'fullName mobileNumber district category')
        .populate('courseId', 'title code')
        .populate('assignedCounsellorId', 'name')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      AuditLog.find(auditFilter)
        .sort({ timestamp: -1 })
        .limit(8)
        .lean(),
      User.find({
        role: 'COUNSELLOR',
        isActive: true,
        ...(filter.collegeId ? { collegeId: filter.collegeId } : {})
      })
        .select('name email phone collegeId')
        .lean()
    ]);

    // Workload calculation
    const workload = await Promise.all(
      activeCounsellors.map(async (c) => {
        const activeCount = await Enquiry.countDocuments({
          assignedCounsellorId: c._id,
          status: { $in: ['ASSIGNED', 'CONTACTED', 'VERIFIED'] }
        });
        const enrolledCount = await Enquiry.countDocuments({
          assignedCounsellorId: c._id,
          status: 'ENROLLED'
        });
        return {
          counsellorId: c._id,
          name: c.name,
          email: c.email,
          activeLeads: activeCount,
          enrolledLeads: enrolledCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          total: totalLeads,
          new: newLeads,
          assigned: assignedLeads,
          contacted: contactedLeads,
          verified: verifiedLeads,
          enrolled: enrolledLeads,
          rejected: rejectedLeads
        },
        recentLeads,
        recentActivity,
        workload
      }
    });
  } catch (error) {
    console.error('[CRMController getDashboardMetrics Error]:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve dashboard metrics' }
    });
  }
};

/**
 * GET /api/v1/crm/students
 * Retrieves student records (including imported DRIEMS roster) with search, pagination, and multi-tenant isolation
 */
export const getStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      collegeId,
      isRoster
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    // Tenant Isolation
    if (req.user.role === 'PLATFORM_ADMIN') {
      if (collegeId && mongoose.isValidObjectId(collegeId)) {
        filter.collegeId = collegeId;
      }
    } else {
      const staffCollegeId = req.user.collegeId?._id || req.user.collegeId;
      if (!staffCollegeId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_UNASSIGNED', message: 'Staff member is not assigned to a college' }
        });
      }
      filter.collegeId = staffCollegeId;
    }

    if (isRoster === 'true') {
      filter.isImportedRoster = true;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      filter.fullName = new RegExp(sanitized, 'i');
    }

    const [students, totalStudents] = await Promise.all([
      Student.find(filter)
        .populate('collegeId', 'name code district')
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Student.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalStudents / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: {
        students,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalStudents,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('[CRMController getStudents Error]:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve student records' }
    });
  }
};

/**
 * GET /api/v1/crm/analytics
 * Executive analytics dashboard metrics with time range, tenant isolation, branch demand,
 * status distribution, conversion funnel, district heatmap, and college comparisons.
 */
export const getExecutiveAnalytics = async (req, res) => {
  try {
    const { timeRange = '30d', collegeId, branchCode } = req.query;

    // 1. Enforce strict tenant isolation
    let targetCollegeId = null;
    const isPlatformAdmin = req.user.role === 'PLATFORM_ADMIN';

    if (!isPlatformAdmin) {
      targetCollegeId = req.user.collegeId?._id || req.user.collegeId;
      if (!targetCollegeId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_UNASSIGNED', message: 'Staff member is not assigned to a college' }
        });
      }
    } else if (collegeId && mongoose.isValidObjectId(collegeId)) {
      targetCollegeId = collegeId;
    }

    // 2. Compute date boundaries
    const now = new Date();
    let startDate = null;
    if (timeRange === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    // 3. Build enquiry query filter
    const filter = {};
    if (targetCollegeId) {
      filter.collegeId = targetCollegeId;
    }
    if (startDate) {
      filter.createdAt = { $gte: startDate };
    }

    // Handle branch filter
    if (branchCode && typeof branchCode === 'string') {
      const bCode = branchCode.trim().toUpperCase();
      const matchingCourses = await Course.find({
        branchCode: bCode,
        ...(targetCollegeId ? { collegeId: targetCollegeId } : {})
      }).select('_id');
      const courseIds = matchingCourses.map((c) => c._id);
      filter.$or = [
        { courseId: { $in: courseIds } },
        { pathway: { $exists: true } } // Allow broad match if courseId is unassigned but notes or pathway set
      ];
    }

    // 4. Retrieve enquiries, branches, courses, and colleges
    const [enquiries, branches, allCourses, colleges] = await Promise.all([
      Enquiry.find(filter)
        .populate('studentId', 'fullName district state category mobileNumber qualification')
        .populate('courseId', 'branchCode pathway totalSeats availableSeats')
        .lean(),
      Branch.find({ isActive: true }).lean(),
      Course.find(targetCollegeId ? { collegeId: targetCollegeId } : {}).lean(),
      College.find({ isActive: true }).lean()
    ]);

    const totalEnquiries = enquiries.length;

    // 5. Compute KPI Summary Cards
    const newCount = enquiries.filter((e) => e.status === 'NEW').length;
    const assignedCount = enquiries.filter((e) => e.status === 'ASSIGNED').length;
    const contactedCount = enquiries.filter((e) => e.status === 'CONTACTED').length;
    const verifiedCount = enquiries.filter((e) =>
      ['VERIFIED', 'DOCUMENT_VERIFIED', 'IN_REVIEW', 'OFFERED'].includes(e.status)
    ).length;
    const enrolledCount = enquiries.filter((e) => e.status === 'ENROLLED').length;
    const rejectedCount = enquiries.filter((e) => e.status === 'REJECTED').length;
    const hotLeadsCount = enquiries.filter((e) => e.priority === 'HOT').length;

    const conversionRate =
      totalEnquiries > 0 ? Number(((enrolledCount / totalEnquiries) * 100).toFixed(1)) : 0;
    const verificationRate =
      totalEnquiries > 0 ? Number(((verifiedCount / totalEnquiries) * 100).toFixed(1)) : 0;
    const contactRate =
      totalEnquiries > 0
        ? Number(
            (
              ((assignedCount + contactedCount + verifiedCount + enrolledCount) /
                totalEnquiries) *
              100
            ).toFixed(1)
          )
        : 0;

    // 6. Branch-wise Enquiry Demand
    const branchDemand = branches.map((b) => {
      // Count enquiries matching this branch
      const branchEnquiries = enquiries.filter((e) => {
        if (e.courseId && e.courseId.branchCode === b.code) return true;
        // Check notes or tracking context if courseId is null
        const notesText = (e.notes || []).map((n) => n.text).join(' ');
        return new RegExp(`\\b${b.code}\\b`, 'i').test(notesText);
      });

      const branchCourses = allCourses.filter((c) => c.branchCode === b.code);
      const totalSeats = branchCourses.reduce((sum, c) => sum + (c.totalSeats || 0), 0);
      const availableSeats = branchCourses.reduce((sum, c) => sum + (c.availableSeats || 0), 0);
      const branchEnrolled = branchEnquiries.filter((e) => e.status === 'ENROLLED').length;
      const count = branchEnquiries.length;
      const demandRatio =
        totalSeats > 0 ? Number(((count / totalSeats) * 100).toFixed(1)) : 0;

      return {
        branchCode: b.code,
        name: b.name,
        enquiriesCount: count,
        enrolledCount: branchEnrolled,
        totalSeats: totalSeats > 0 ? totalSeats : 60, // Default baseline if not configured
        availableSeats: availableSeats > 0 ? availableSeats : 30,
        demandRatio
      };
    });

    // 7. Lead Status Distribution
    const statusColors = {
      NEW: '#3B82F6',
      ASSIGNED: '#F59E0B',
      CONTACTED: '#8B5CF6',
      VERIFIED: '#10B981',
      ENROLLED: '#059669',
      REJECTED: '#EF4444'
    };

    const statusCountsMap = {
      NEW: newCount,
      ASSIGNED: assignedCount,
      CONTACTED: contactedCount,
      VERIFIED: verifiedCount,
      ENROLLED: enrolledCount,
      REJECTED: rejectedCount
    };

    const statusDistribution = Object.keys(statusCountsMap).map((status) => {
      const count = statusCountsMap[status];
      const percentage =
        totalEnquiries > 0 ? Number(((count / totalEnquiries) * 100).toFixed(1)) : 0;
      return {
        status,
        count,
        percentage,
        color: statusColors[status] || '#64748B'
      };
    });

    // 8. Conversion Funnel (Step-down Pipeline)
    const funnelSteps = [
      {
        stage: 'TOTAL_ENQUIRIES',
        name: {
          en: 'Total Enquiries Received',
          or: 'ମୋଟ ଆସିଥିବା ପଚରାଉଚରା',
          hi: 'कुल प्राप्त पूछताछ'
        },
        count: totalEnquiries,
        percentage: 100
      },
      {
        stage: 'CONTACTED',
        name: {
          en: 'Contacted / Under Review',
          or: 'ଯୋଗାଯୋଗ ହୋଇଥିବା / ସମୀକ୍ଷାଧୀନ',
          hi: 'संपर्क किया गया / समीक्षाधीन'
        },
        count: assignedCount + contactedCount + verifiedCount + enrolledCount,
        percentage:
          totalEnquiries > 0
            ? Number(
                (
                  ((assignedCount + contactedCount + verifiedCount + enrolledCount) /
                    totalEnquiries) *
                  100
                ).toFixed(1)
              )
            : 0
      },
      {
        stage: 'DOCUMENT_VERIFIED',
        name: {
          en: 'Documents Verified',
          or: 'କାଗଜପତ୍ର ଯାଞ୍ଚ ସମ୍ପୂର୍ଣ୍ଣ',
          hi: 'दस्तावेज सत्यापित'
        },
        count: verifiedCount + enrolledCount,
        percentage:
          totalEnquiries > 0
            ? Number(
                (((verifiedCount + enrolledCount) / totalEnquiries) * 100).toFixed(1)
              )
            : 0
      },
      {
        stage: 'ENROLLED',
        name: {
          en: 'Admission Confirmed / Enrolled',
          or: 'ନାମଲେଖା ସୁନିଶ୍ଚିତ / ଭର୍ତ୍ତି',
          hi: 'प्रवेश सुनिश्चित / नामांकित'
        },
        count: enrolledCount,
        percentage: conversionRate
      }
    ];

    // Compute drop-off counts between steps
    const conversionFunnel = funnelSteps.map((step, idx) => {
      const dropOff =
        idx < funnelSteps.length - 1 ? step.count - funnelSteps[idx + 1].count : 0;
      return {
        ...step,
        dropOffCount: Math.max(0, dropOff)
      };
    });

    // 9. District-wise Enquiry Heat Map (Odisha student distribution)
    const districtCounts = {};
    enquiries.forEach((e) => {
      const d = e.studentId?.district || 'Khordha';
      const normalizedDistrict = d.trim();
      districtCounts[normalizedDistrict] = (districtCounts[normalizedDistrict] || 0) + 1;
    });

    // Ensure prominent Odisha districts are represented
    const keyOdishaDistricts = [
      'Cuttack',
      'Khordha',
      'Mayurbhanj',
      'Jajpur',
      'Kendrapara',
      'Puri',
      'Balasore',
      'Ganjam',
      'Angul',
      'Dhenkanal'
    ];

    keyOdishaDistricts.forEach((dist) => {
      if (!(dist in districtCounts)) {
        districtCounts[dist] = 0;
      }
    });

    const districtHeatMap = Object.entries(districtCounts)
      .map(([district, count]) => ({
        district,
        enquiriesCount: count,
        percentage:
          totalEnquiries > 0 ? Number(((count / totalEnquiries) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.enquiriesCount - a.enquiriesCount)
      .slice(0, 10);

    // 10. College-wise Comparative Benchmark
    // For Platform Admin: real comparison across all institutions.
    // For College Admin: benchmarking against other institutions.
    const collegeComparison = await Promise.all(
      colleges.map(async (col) => {
        const colFilter = { collegeId: col._id };
        if (startDate) colFilter.createdAt = { $gte: startDate };

        const [cTotal, cEnrolled, cVerified] = await Promise.all([
          Enquiry.countDocuments(colFilter),
          Enquiry.countDocuments({ ...colFilter, status: 'ENROLLED' }),
          Enquiry.countDocuments({
            ...colFilter,
            status: { $in: ['VERIFIED', 'DOCUMENT_VERIFIED'] }
          })
        ]);

        const cRate = cTotal > 0 ? Number(((cEnrolled / cTotal) * 100).toFixed(1)) : 0;

        return {
          collegeId: col._id,
          code: col.code,
          name: col.name,
          district: col.district,
          isDefault: Boolean(col.isDefault),
          isAutonomous: col.code === 'DRIEMS' || Boolean(col.isDefault),
          totalEnquiries: cTotal,
          enrolledCount: cEnrolled,
          verifiedCount: cVerified,
          conversionRate: cRate
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        filter: {
          timeRange,
          collegeId: targetCollegeId,
          branchCode: branchCode || null,
          startDate: startDate ? startDate.toISOString() : null
        },
        kpis: {
          totalEnquiries,
          newEnquiries: newCount,
          assignedEnquiries: assignedCount,
          contactedEnquiries: contactedCount,
          verifiedEnquiries: verifiedCount,
          enrolledEnquiries: enrolledCount,
          rejectedEnquiries: rejectedCount,
          hotLeadsCount,
          conversionRate,
          verificationRate,
          contactRate
        },
        branchDemand,
        statusDistribution,
        conversionFunnel,
        districtHeatMap,
        collegeComparison,
        meta: {
          demoNotice: '[DEMO DATASET - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]',
          generatedAt: new Date().toISOString(),
          isPlatformAdmin
        }
      }
    });
  } catch (error) {
    console.error('[CRMController getExecutiveAnalytics Error]:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate executive analytics' }
    });
  }
};
