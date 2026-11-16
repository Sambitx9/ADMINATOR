import express from 'express';
import {
  getColleges,
  getBranches,
  getFeeStructures,
  getCollegeComparison
} from '../controllers/catalogController.js';

const router = express.Router();

// Multi-college side-by-side comparison (up to 3 colleges)
router.get('/colleges/compare', getCollegeComparison);

router.get('/colleges', getColleges);
router.get('/branches', getBranches);
router.get('/fees', getFeeStructures);

export default router;
