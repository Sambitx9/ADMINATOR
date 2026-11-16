import express from 'express';
import { sendMessage, getChatHistory, getAIStatus } from '../controllers/chatController.js';

const router = express.Router();

router.post('/message', sendMessage);
router.get('/history/:sessionId', getChatHistory);
router.get('/ai-status', getAIStatus);

export default router;
