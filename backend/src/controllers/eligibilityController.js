import { EligibilityRule, Course } from '../models/index.js';
import { evaluateEligibility } from '../engine/deterministicEligibilityEngine.js';

/**
 * Controller to handle deterministic eligibility evaluations
 */
export const checkEligibility = async (req, res, next) => {
  try {
    // DEF-API-04: Reject empty eligibility request bodies with HTTP 400
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Eligibility evaluation request body cannot be empty. Please provide candidate qualification details (e.g. aggregatePercentage, examType, pathway).'
        }
      });
    }

    const {
      collegeId,
      branchCode,
      pathway = 'FIRST_YEAR',
      qualification,
      candidate,
      ageYears,
      preferredLanguage = 'en',
      language
    } = req.body;

    const qual = qualification || candidate;
    // Validate that some qualification details or percentages are provided
    if (!qual && req.body.aggregatePercentage === undefined && req.body.percentage === undefined) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Candidate qualification details (aggregatePercentage, qualifyingExam) are required for eligibility evaluation.'
        }
      });
    }

    const activeQual = qual || {};
    const activeLang = language || preferredLanguage || 'en';

    // Validate percentage range
    const rawPercentage = activeQual.aggregatePercentage ?? activeQual.percentage ?? req.body.aggregatePercentage ?? req.body.percentage ?? 0;
    const numPercentage = Number(rawPercentage);
    if (isNaN(numPercentage) || numPercentage < 0 || numPercentage > 100) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'aggregatePercentage must be a valid number between 0 and 100.'
        }
      });
    }

    // Validate age range if provided
    const rawAge = ageYears !== undefined ? ageYears : activeQual.ageYears;
    if (rawAge !== undefined) {
      const numAge = Number(rawAge);
      if (isNaN(numAge) || numAge < 5 || numAge > 100) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ageYears must be a valid number between 5 and 100.'
          }
        });
      }
    }

    const resolvedAge = rawAge !== undefined ? Number(rawAge) : 16;

    const candidateProfile = {
      pathway,
      category: activeQual.category || 'GENERAL',
      aggregatePercentage: numPercentage,
      examType: activeQual.examType || activeQual.qualifyingExam || (pathway === 'FIRST_YEAR' ? '10TH' : 'ITI'),
      subjects: activeQual.subjects || {
        mathematics: activeQual.passedMathAndScience !== false,
        science: activeQual.passedMathAndScience !== false
      },
      passedMathAndScience: activeQual.passedMathAndScience !== undefined ? activeQual.passedMathAndScience : true,
      itiTrade: activeQual.itiTrade || null,
      ageYears: resolvedAge,
      branchCode
    };

    // If specific branch is requested
    if (branchCode) {
      const query = { pathway };
      if (collegeId) query.collegeId = collegeId;
      query.branchCode = branchCode.toUpperCase();

      const rule = await EligibilityRule.findOne(query);
      const ruleObj = rule ? rule.toObject() : {
        pathway,
        branchCode: branchCode.toUpperCase(),
        minPercentageGeneral: 35.0,
        minPercentageReserved: 30.0,
        mandatorySubjects: pathway === 'FIRST_YEAR' ? ['MATHEMATICS', 'SCIENCE'] : ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS'],
        minAgeYears: 14,
        ruleVersion: '2025.1'
      };

      const result = evaluateEligibility(candidateProfile, ruleObj, activeLang);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
          ...result,
          branchCode: branchCode.toUpperCase(),
          evaluatedAt: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }

    // If branch is NOT specified, evaluate against all available courses in the pathway
    const filter = { pathway };
    if (collegeId) filter.collegeId = collegeId;
    const rules = await EligibilityRule.find(filter);

    const eligibleBranches = [];
    const detailedEvaluations = [];

    for (const rule of rules) {
      const evalResult = evaluateEligibility(candidateProfile, rule.toObject(), preferredLanguage);
      detailedEvaluations.push({
        branchCode: rule.branchCode,
        verdict: evalResult.verdict,
        isEligible: evalResult.isEligible,
        reason: evalResult.plainReason
      });

      if (evalResult.isEligible) {
        eligibleBranches.push({
          branchCode: rule.branchCode,
          verdict: evalResult.verdict,
          reason: evalResult.plainReason
        });
      }
    }

    const overallEligible = eligibleBranches.length > 0;

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        verdict: overallEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
        isOverallEligible: overallEligible,
        pathway,
        eligibleBranches,
        detailedEvaluations,
        evaluatedAt: new Date().toISOString(),
        disclaimer: '[DEMO EVALUATION - BASED ON SAMPLE ADMISSION RULES - NOT OFFICIAL SAMS NOTIFICATION]'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};

