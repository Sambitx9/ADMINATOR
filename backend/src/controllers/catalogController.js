import mongoose from 'mongoose';
import { College, Branch, Course, FeeStructure } from '../models/index.js';

/**
 * Returns list of demo colleges
 * GET /api/v1/colleges
 */
export const getColleges = async (req, res) => {
  try {
    const colleges = await College.find({ isActive: true })
      .sort({ isDefault: -1, code: 1 })
      .select('-__v');
    return res.status(200).json({
      success: true,
      count: colleges.length,
      data: colleges
    });
  } catch (err) {
    console.error('[CatalogController] Error fetching colleges:', err);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to fetch colleges.' });
  }
};

/**
 * Returns list of diploma branches
 * GET /api/v1/branches
 */
export const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).select('-__v');
    return res.status(200).json({
      success: true,
      count: branches.length,
      data: branches
    });
  } catch (err) {
    console.error('[CatalogController] Error fetching branches:', err);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to fetch branches.' });
  }
};

/**
 * Returns demo fee structures
 * GET /api/v1/fees
 */
export const getFeeStructures = async (req, res) => {
  try {
    const { branchCode } = req.query;
    const filter = {};
    if (branchCode) filter.branchCode = branchCode.toUpperCase();

    const fees = await FeeStructure.find(filter).populate('collegeId', 'code name district');
    return res.status(200).json({
      success: true,
      count: fees.length,
      data: fees
    });
  } catch (err) {
    console.error('[CatalogController] Error fetching fees:', err);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to fetch fee structures.' });
  }
};

/**
 * Compares up to 3 colleges side-by-side with course, fee, seat, and hostel breakdowns
 * GET /api/v1/colleges/compare
 */
export const getCollegeComparison = async (req, res) => {
  try {
    const { collegeCodes, collegeIds, branchCode, pathway } = req.query;

    let targetColleges = [];

    // Parse requested college identifiers
    if (collegeCodes && typeof collegeCodes === 'string') {
      const codes = collegeCodes
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 3); // Max 3 colleges

      if (codes.length > 0) {
        const found = await College.find({ code: { $in: codes }, isActive: true }).lean();
        // Preserve requested order
        targetColleges = codes
          .map((code) => found.find((c) => c.code === code))
          .filter(Boolean);
      }
    } else if (collegeIds && typeof collegeIds === 'string') {
      const ids = collegeIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => mongoose.isValidObjectId(id))
        .slice(0, 3);

      if (ids.length > 0) {
        const found = await College.find({ _id: { $in: ids }, isActive: true }).lean();
        targetColleges = ids
          .map((id) => found.find((c) => c._id.toString() === id))
          .filter(Boolean);
      }
    }

    // Default to top 3 active colleges with DRIEMS (isDefault: true) prioritized first
    if (targetColleges.length === 0) {
      targetColleges = await College.find({ isActive: true })
        .sort({ isDefault: -1, code: 1 })
        .limit(3)
        .lean();
    }

    if (targetColleges.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'No colleges available for comparison.'
      });
    }

    const collegeIdsList = targetColleges.map((c) => c._id);

    // Fetch branches reference
    const branches = await Branch.find({ isActive: true }).lean();

    // Query courses and fee structures for target colleges
    const courseFilter = { collegeId: { $in: collegeIdsList } };
    if (branchCode && typeof branchCode === 'string') {
      courseFilter.branchCode = branchCode.trim().toUpperCase();
    }
    if (pathway && ['FIRST_YEAR', 'LATERAL_ENTRY'].includes(pathway.trim().toUpperCase())) {
      courseFilter.pathway = pathway.trim().toUpperCase();
    }

    const [courses, fees] = await Promise.all([
      Course.find(courseFilter).populate('branchId').lean(),
      FeeStructure.find({ collegeId: { $in: collegeIdsList } }).lean()
    ]);

    // Build per-college comparison objects
    const collegeProfiles = targetColleges.map((college) => {
      const colIdStr = college._id.toString();
      const colCourses = courses.filter((c) => c.collegeId.toString() === colIdStr);
      const colFees = fees.filter((f) => f.collegeId.toString() === colIdStr);

      const tuitionValues = colFees
        .map((f) => f.tuitionFeePerSemester)
        .filter((v) => typeof v === 'number' && v > 0);
      const minTuition = tuitionValues.length > 0 ? Math.min(...tuitionValues) : null;
      const maxTuition = tuitionValues.length > 0 ? Math.max(...tuitionValues) : null;

      const admissionFee = colFees.find((f) => typeof f.admissionFeeOneTime === 'number')?.admissionFeeOneTime ?? null;
      const labFee = colFees.find((f) => typeof f.labWorkshopFeePerYear === 'number')?.labWorkshopFeePerYear ?? null;
      const hostelFee = colFees.find((f) => typeof f.hostelFeePerSemester === 'number' && f.hostelFeePerSemester > 0)?.hostelFeePerSemester ?? null;

      const totalSeats = colCourses.reduce((sum, c) => sum + (c.totalSeats || 0), 0);
      const availableSeats = colCourses.reduce((sum, c) => sum + (c.availableSeats || 0), 0);

      // Scholarships aggregation
      const scholarshipMap = new Map();
      colFees.forEach((f) => {
        if (Array.isArray(f.scholarshipsAvailable)) {
          f.scholarshipsAvailable.forEach((s) => {
            if (s.name && !scholarshipMap.has(s.name)) {
              scholarshipMap.set(s.name, {
                name: s.name,
                waiverAmount: s.waiverAmount,
                criteria: s.criteria
              });
            }
          });
        }
      });

      const isAutonomous = college.isDefault || /autonomous/i.test(college.name) || college.code === 'DRIEMS';

      return {
        college: {
          _id: college._id,
          code: college.code,
          name: college.name,
          district: college.district,
          state: college.state,
          address: college.address,
          contactEmail: college.contactEmail,
          contactPhone: college.contactPhone,
          facilities: college.facilities || [],
          isDefault: Boolean(college.isDefault),
          isAutonomous,
          isDemo: Boolean(college.isDemo),
          demoNotice: college.demoNotice || '[DEMO DATA - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]'
        },
        summary: {
          totalCoursesOffered: colCourses.length,
          totalIntakeCapacity: totalSeats > 0 ? totalSeats : null,
          totalAvailableSeats: availableSeats > 0 ? availableSeats : null,
          hasLateralEntry: colCourses.some((c) => c.pathway === 'LATERAL_ENTRY'),
          tuitionFeePerSemesterMin: minTuition,
          tuitionFeePerSemesterMax: maxTuition,
          admissionFeeOneTime: admissionFee,
          labWorkshopFeePerYear: labFee,
          hostelFeePerSemester: hostelFee,
          hostelConfigured: hostelFee !== null || (college.facilities && college.facilities.some((f) => /hostel/i.test(f))),
          scholarshipsCount: scholarshipMap.size,
          scholarships: Array.from(scholarshipMap.values())
        },
        courses: colCourses.map((c) => ({
          _id: c._id,
          branchCode: c.branchCode,
          pathway: c.pathway,
          durationYears: c.durationYears,
          totalSeats: c.totalSeats,
          availableSeats: c.availableSeats,
          branchDetails: c.branchId
            ? {
                name: c.branchId.name,
                description: c.branchId.description,
                careerProspects: c.branchId.careerProspects
              }
            : null
        })),
        feeStructures: colFees.map((f) => ({
          _id: f._id,
          branchCode: f.branchCode,
          academicYear: f.academicYear,
          tuitionFeePerSemester: f.tuitionFeePerSemester,
          admissionFeeOneTime: f.admissionFeeOneTime,
          labWorkshopFeePerYear: f.labWorkshopFeePerYear,
          hostelFeePerSemester: f.hostelFeePerSemester,
          scholarshipsAvailable: f.scholarshipsAvailable,
          sampleFeeDisclaimer: f.sampleFeeDisclaimer
        }))
      };
    });

    // Generate normalized side-by-side branch matrix
    const matrix = branches.map((b) => {
      const branchRow = {
        branchCode: b.code,
        name: b.name,
        description: b.description,
        colleges: {}
      };

      collegeProfiles.forEach((profile) => {
        const colCode = profile.college.code;
        const firstYearCourse = profile.courses.find(
          (c) => c.branchCode === b.code && c.pathway === 'FIRST_YEAR'
        );
        const lateralCourse = profile.courses.find(
          (c) => c.branchCode === b.code && c.pathway === 'LATERAL_ENTRY'
        );
        const fee = profile.feeStructures.find((f) => f.branchCode === b.code);

        branchRow.colleges[colCode] = {
          isOffered: Boolean(firstYearCourse || lateralCourse),
          firstYear: firstYearCourse
            ? {
                totalSeats: firstYearCourse.totalSeats,
                availableSeats: firstYearCourse.availableSeats,
                durationYears: firstYearCourse.durationYears
              }
            : null,
          lateralEntry: lateralCourse
            ? {
                totalSeats: lateralCourse.totalSeats,
                availableSeats: lateralCourse.availableSeats,
                durationYears: lateralCourse.durationYears
              }
            : null,
          fees: fee
            ? {
                tuitionFeePerSemester: fee.tuitionFeePerSemester,
                admissionFeeOneTime: fee.admissionFeeOneTime,
                labWorkshopFeePerYear: fee.labWorkshopFeePerYear,
                estimatedAnnualTotal:
                  fee.tuitionFeePerSemester * 2 +
                  (fee.labWorkshopFeePerYear || 0) +
                  (fee.admissionFeeOneTime || 0),
                hostelFeePerSemester: fee.hostelFeePerSemester || null
              }
            : null
        };
      });

      return branchRow;
    });

    return res.status(200).json({
      success: true,
      count: collegeProfiles.length,
      data: {
        colleges: collegeProfiles,
        branches,
        matrix,
        meta: {
          comparedCount: collegeProfiles.length,
          maxAllowed: 3,
          isDriemsIncluded: collegeProfiles.some((p) => p.college.code === 'DRIEMS'),
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (err) {
    console.error('[CatalogController getCollegeComparison Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to generate college comparison.'
    });
  }
};
