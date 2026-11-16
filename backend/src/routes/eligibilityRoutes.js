import express from 'express';
import { checkEligibility } from '../controllers/eligibilityController.js';

const router = express.Router();

/**
 * @route   POST /api/v1/eligibility/check
 * @desc    Evaluate student marks deterministically against admission rules
 * @access  Public
 */
router.post('/check', checkEligibility);

export default router;
