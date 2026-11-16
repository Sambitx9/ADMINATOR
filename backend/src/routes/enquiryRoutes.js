import express from 'express';
import { createEnquiry, trackEnquiry } from '../controllers/enquiryController.js';

const router = express.Router();

router.post('/', createEnquiry);
router.post('/track', trackEnquiry);

export default router;
