import { Student, Enquiry, College } from '../models/index.js';
import { generateTrackingId } from '../utils/idGenerator.js';
import { localEventBus } from '../services/LocalEventDispatcher.js';

/**
 * Submits a new admission enquiry
 * POST /api/v1/enquiries
 */
export const createEnquiry = async (req, res) => {
  try {
    const {
      fullName,
      mobileNumber,
      email,
      district,
      state,
      preferredLanguage,
      collegeCode,
      interestedBranches,
      pathway,
      academicRecord,
      source = 'SIMULATOR',
      remarks
    } = req.body;

    if (!fullName || !mobileNumber) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'fullName and mobileNumber are required.'
      });
    }

    // Validate 10-digit mobile number
    const cleanPhone = String(mobileNumber).trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PHONE',
        message: 'Please provide a valid 10-digit Indian mobile number.'
      });
    }

    // Resolve College
    let college = null;
    if (collegeCode) {
      college = await College.findOne({ code: collegeCode.toUpperCase() });
    }
    if (!college) {
      college = await College.findOne({ isDefault: true }) || await College.findOne({ code: 'DRIEMS' }) || await College.findOne({ code: 'KIPT' });
    }

    // Create or update Student record
    let student = await Student.findOne({ mobileNumber: cleanPhone });
    if (!student) {
      student = new Student({
        fullName: fullName.trim(),
        mobileNumber: cleanPhone,
        email: email ? email.trim() : null,
        district: district ? district.trim() : 'Khordha',
        state: state ? state.trim() : 'Odisha',
        preferredLanguage: preferredLanguage || 'en'
      });
    } else {
      if (fullName) student.fullName = fullName.trim();
      if (email) student.email = email.trim();
      if (preferredLanguage) student.preferredLanguage = preferredLanguage;
    }

    if (academicRecord) {
      student.qualification = {
        examType: academicRecord.qualifyingExam || '10TH',
        aggregatePercentage: Number(academicRecord.aggregatePercentage || 0),
        passingYear: Number(academicRecord.passingYear || new Date().getFullYear()),
        board: academicRecord.boardOrUniversity || 'BSE_ODISHA',
        subjects: {
          mathematics: Boolean(academicRecord.marksMath !== undefined ? academicRecord.marksMath >= 30 : true),
          science: Boolean(academicRecord.marksScience !== undefined ? academicRecord.marksScience >= 30 : true)
        },
        itiTrade: academicRecord.itiTrade || null
      };
    }

    await student.save();

    // Generate unique institutional tracking ID
    const trackingId = generateTrackingId();

    const enquiry = await Enquiry.create({
      trackingId,
      studentId: student._id,
      collegeId: college ? college._id : null,
      assignedStaffId: null,
      source,
      status: 'NEW',
      notes: [
        {
          author: 'STUDENT_PORTAL',
          text: remarks ? `Initial Enquiry: ${remarks}` : `Admission Enquiry registered for ${interestedBranches?.join(', ') || 'General'}`
        }
      ],
      isDemo: true
    });

    // Dispatch automation event (in-process default + optional n8n webhook)
    localEventBus.dispatch('ENQUIRY_CREATED', {
      trackingId: enquiry.trackingId,
      studentName: student.fullName,
      mobileNumber: student.mobileNumber,
      email: student.email,
      district: student.district,
      state: student.state,
      collegeCode: college ? college.code : 'DRIEMS',
      collegeName: college ? college.name : 'DRIEMS Polytechnic (Autonomous)',
      interestedBranches: interestedBranches || [],
      pathway: pathway || 'FIRST_YEAR',
      source: enquiry.source,
      status: enquiry.status
    });

    return res.status(201).json({
      success: true,
      data: {
        trackingId: enquiry.trackingId,
        mobileNumber: student.mobileNumber,
        studentName: student.fullName,
        collegeName: college ? college.name : 'DRIEMS Polytechnic (Autonomous)',
        status: enquiry.status,
        createdAt: enquiry.createdAt,
        isDemo: true,
        demoNotice: '[DEMO DATA - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]'
      }
    });
  } catch (err) {
    console.error('[EnquiryController] Error creating enquiry:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to register admission enquiry.',
      details: err.message
    });
  }
};

/**
 * Tracks an enquiry using Dual-Key Authentication (trackingId + mobileNumber)
 * POST /api/v1/enquiries/track
 */
export const trackEnquiry = async (req, res) => {
  try {
    const { trackingId, mobileNumber } = req.body;

    if (!trackingId || !mobileNumber) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Both trackingId and mobileNumber are required for status verification.'
      });
    }

    const cleanPhone = String(mobileNumber).trim().replace(/\D/g, '');
    const cleanTrackingId = String(trackingId).trim().toUpperCase();

    // 1. Find Student by mobileNumber
    const student = await Student.findOne({ mobileNumber: cleanPhone });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'No enquiry found matching this Mobile Number and Tracking ID combination.'
      });
    }

    // 2. Find Enquiry by trackingId AND studentId
    const enquiry = await Enquiry.findOne({
      trackingId: cleanTrackingId,
      studentId: student._id
    }).populate('collegeId', 'name code district');

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'No enquiry found matching this Mobile Number and Tracking ID combination.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        trackingId: enquiry.trackingId,
        status: enquiry.status,
        studentName: student.fullName,
        college: enquiry.collegeId ? enquiry.collegeId.name : 'Polytechnic Institute (Demo)',
        submittedAt: enquiry.createdAt,
        updatedAt: enquiry.updatedAt,
        notes: enquiry.notes.map(n => ({
          text: n.text,
          author: n.author,
          timestamp: n.createdAt
        })),
        isDemo: enquiry.isDemo,
        demoNotice: '[DEMO DATA - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]'
      }
    });
  } catch (err) {
    console.error('[EnquiryController] Error tracking enquiry:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to verify enquiry status.'
    });
  }
};
