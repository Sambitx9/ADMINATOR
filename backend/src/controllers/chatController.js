import { aiGatewayManager } from '../ai/index.js';
import { Conversation } from '../models/index.js';

/**
 * Handles incoming chat message from student simulator
 * POST /api/v1/chat/message
 */
export const sendMessage = async (req, res) => {
  try {
    const { sessionId, message, selectedLanguage, explicitLanguageSwitch, collegeCode } = req.body;

    if (!sessionId || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'sessionId and a valid non-empty text message are required.'
      });
    }

    const response = await aiGatewayManager.processCounsellingMessage({
      sessionId: sessionId.trim(),
      message: message.trim(),
      selectedLanguage: selectedLanguage || null,
      explicitLanguageSwitch: Boolean(explicitLanguageSwitch),
      collegeCode: collegeCode || 'DRIEMS'
    });

    return res.status(200).json({
      success: true,
      data: response
    });
  } catch (err) {
    console.error('[ChatController] Error processing message:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to process admission counselling message.',
      details: err.message
    });
  }
};

/**
 * Retrieves chat message history for an active session
 * GET /api/v1/chat/history/:sessionId
 */
export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      return res.status(200).json({
        success: true,
        data: {
          sessionId,
          messages: []
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        sessionId: conversation.sessionId,
        language: conversation.language,
        engineUsed: conversation.engineUsed || 'DETERMINISTIC',
        handoffRequested: conversation.handoffRequested,
        handoffStatus: conversation.handoffStatus,
        messages: conversation.messages
      }
    });
  } catch (err) {
    console.error('[ChatController] Error fetching history:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve conversation history.'
    });
  }
};

/**
 * Retrieves AI Gateway health, circuit breaker state, and rate limiter telemetry
 * GET /api/v1/chat/ai-status
 */
export const getAIStatus = async (req, res) => {
  try {
    const status = aiGatewayManager.getStatus();
    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (err) {
    console.error('[ChatController] Error fetching AI status:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve AI Gateway status.'
    });
  }
};
