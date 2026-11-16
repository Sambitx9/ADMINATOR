/**
 * ADMINATOR — AI Gateway Manager
 * 
 * Orchestrates AI Provider calls (Google Gemini Free Tier) with automatic,
 * zero-downtime fallback to the Deterministic Counselling Engine.
 * 
 * Invariants:
 *   - Works seamlessly with ZERO Gemini API Key (₹0 cost default)
 *   - Never leaks student PII to external AI
 *   - Strict grounding: never invents admission eligibility, seats, or fees
 *   - Fail-fast & resilient: Catches missing keys, 429 rate limits, timeouts,
 *     network drops, and invalid provider outputs, falling back immediately.
 */

import { GeminiAIGateway } from './GeminiAIGateway.js';
import { handleIncomingMessage as handleDeterministicMessage } from '../engine/deterministicCounsellingEngine.js';
import { detectLanguageAndScript } from '../engine/languageDetectorService.js';
import { College, Branch, FeeStructure, Conversation, Enquiry } from '../models/index.js';
import { generateTrackingId } from '../utils/idGenerator.js';

const DEMO_DISCLAIMERS = {
  en: '\n\n⚠️ [DEMO DATA - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]',
  or: '\n\n⚠️ [ଡେମୋ ତଥ୍ୟ - କେବଳ ମୂଲ୍ୟାଙ୍କନ ପାଇଁ - ସରକାରୀ ନାମଲେଖା ତଥ୍ୟ ନୁହେଁ]',
  hi: '\n\n⚠️ [डेमो डेटा - केवल मूल्यांकन के लिए - आधिकारिक प्रवेश डेटा नहीं]'
};

export class AIGatewayManager {
  /**
   * @param {Object} [options]
   * @param {IAIGateway} [options.gateway] - Custom or default AI gateway
   */
  constructor(options = {}) {
    this.gateway = options.gateway || new GeminiAIGateway();
    this.defaultProvider = 'gemini';
  }

  /**
   * Checks whether the AI Gateway is configured and enabled in environment
   * @returns {boolean}
   */
  isEnabled() {
    const provider = (process.env.AI_PROVIDER || '').toLowerCase();
    const explicitFlag = process.env.ENABLE_AI_GATEWAY === 'true';
    const hasKey = Boolean(process.env.GEMINI_API_KEY || (this.gateway && this.gateway.apiKey));
    return (provider === 'gemini' || explicitFlag) && hasKey;
  }

  /**
   * Extracts phone number and candidate name from text if available
   * @private
   */
  _extractLeadInfo(text = '') {
    const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
    const phone = phoneMatch ? phoneMatch[1] : null;

    let name = null;
    const namePattern = /(?:my name is|i am|name:|naam:|nama:)\s*([a-zA-Z\s]{2,30})/i;
    const nameMatch = text.match(namePattern);
    if (nameMatch) {
      name = nameMatch[1].trim();
    }
    return { name, phone };
  }

  /**
   * Assembles grounding context from MongoDB for the target college
   * @private
   */
  async _loadGroundingContext(collegeCode = 'DRIEMS') {
    try {
      const college = await College.findOne({ code: collegeCode }) 
        || await College.findOne({ code: 'DRIEMS' }) 
        || await College.findOne();

      const branches = await Branch.find({ isActive: true });
      const branchNames = branches.map(b => `${b.name} (${b.code})`);

      let feeSummary = 'Tuition Fee ~₹35,000/yr (Demo). Hostel ~₹30,000/yr (Demo).';
      if (college) {
        const fees = await FeeStructure.find({ collegeId: college._id });
        if (fees.length > 0) {
          feeSummary = fees.map(f => `${f.category || 'Standard'}: ₹${f.totalAmount || f.tuitionFee}/yr`).join('; ');
        }
      }

      return {
        collegeName: college ? `${college.name}, ${college.city}, ${college.state}` : 'DRIEMS Polytechnic (Autonomous), Tangi, Cuttack, Odisha',
        branches: branchNames,
        feeSummary
      };
    } catch {
      return {
        collegeName: 'DRIEMS Polytechnic (Autonomous), Tangi, Cuttack, Odisha',
        branches: ['Mechanical Engineering', 'Civil Engineering', 'Computer Science & Engineering', 'Electrical Engineering'],
        feeSummary: 'Tuition Fee ~₹35,000/yr (Demo). Hostel ~₹30,000/yr (Demo).'
      };
    }
  }

  /**
   * Processes an incoming student admission counselling message.
   * If AI is enabled and available, uses grounded Gemini Free Tier.
   * On ANY error, timeout, rate limit, or missing key, immediately falls back
   * to the deterministic counselling engine.
   * 
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.message
   * @param {string} [params.selectedLanguage]
   * @param {boolean} [params.explicitLanguageSwitch]
   * @param {string} [params.collegeCode]
   * @param {Object} [params.options] - Test or override flags
   * @returns {Promise<Object>} Response object including engineUsed and fallbackReason if applicable
   */
  async processCounsellingMessage(params) {
    const { sessionId, message, selectedLanguage, explicitLanguageSwitch, collegeCode = 'DRIEMS', options = {} } = params;

    // Determine if AI execution should be attempted
    const forceAI = options.forceAI === true;
    const forceDeterministic = options.forceDeterministic === true;
    const shouldAttemptAI = !forceDeterministic && (forceAI || this.isEnabled());

    if (!shouldAttemptAI) {
      // Deterministic path
      const result = await handleDeterministicMessage({
        sessionId,
        message,
        selectedLanguage,
        explicitLanguageSwitch,
        collegeCode
      });
      return {
        ...result,
        engineUsed: 'DETERMINISTIC',
        fallbackReason: null
      };
    }

    // Resolve language
    const langDetect = detectLanguageAndScript(message, selectedLanguage, explicitLanguageSwitch);
    const activeLang = langDetect.language || 'en';

    try {
      // Fetch context & history
      const context = await this._loadGroundingContext(collegeCode);
      const conversation = await Conversation.findOne({ sessionId });
      const history = conversation ? conversation.messages : [];

      // Generate response via AI Gateway
      const aiResponse = await this.gateway.generateResponse({
        prompt: message,
        context,
        language: activeLang,
        history,
        options
      });

      // Append mandatory disclaimer
      const disclaimer = DEMO_DISCLAIMERS[activeLang] || DEMO_DISCLAIMERS.en;
      const fullReply = aiResponse.text.includes('DEMO') ? aiResponse.text : `${aiResponse.text}${disclaimer}`;

      // Persist in conversation
      let activeConversation = conversation;
      if (!activeConversation) {
        const college = await College.findOne({ code: collegeCode }) || await College.findOne({ code: 'DRIEMS' });
        activeConversation = new Conversation({
          sessionId,
          collegeId: college ? college._id : null,
          language: activeLang,
          engineUsed: 'AI_GEMINI',
          messages: []
        });
      } else {
        activeConversation.engineUsed = 'AI_GEMINI';
        activeConversation.language = activeLang;
      }

      // Add user message
      activeConversation.messages.push({
        sender: 'USER',
        text: message,
        language: activeLang,
        intent: 'AI_COUNSELLING',
        timestamp: new Date()
      });

      // Add bot message
      activeConversation.messages.push({
        sender: 'BOT',
        text: fullReply,
        language: activeLang,
        intent: 'AI_COUNSELLING',
        timestamp: new Date()
      });

      // Check for lead info
      let generatedEnquiry = null;
      const leadInfo = this._extractLeadInfo(message);
      if (leadInfo.phone && !activeConversation.enquiryId) {
        const trackingId = generateTrackingId('ENQ');
        const college = await College.findOne({ code: collegeCode }) || await College.findOne({ code: 'DRIEMS' });
        const newEnquiry = new Enquiry({
          trackingId,
          collegeId: college ? college._id : null,
          name: leadInfo.name || 'Student Enquiry',
          mobile: leadInfo.phone,
          language: activeLang,
          source: 'CHATBOT',
          status: 'HOT'
        });
        await newEnquiry.save();
        activeConversation.enquiryId = newEnquiry._id;
        generatedEnquiry = newEnquiry;
      }

      await activeConversation.save();

      const defaultQuickReplies = {
        en: ['Explore Branches', 'Check Eligibility', 'Fee Structure', 'Hostel Info', 'Talk to Counsellor'],
        or: ['ଶାଖା ଦେଖନ୍ତୁ', 'ଯୋଗ୍ୟତା ଯାଞ୍ଚ', 'ଫିସ୍ ବିବରଣୀ', 'ହଷ୍ଟେଲ ସୂଚନା', 'କାଉନସେଲରଙ୍କ ସହ କଥା'],
        hi: ['शाखाएं देखें', 'पात्रता जांचें', 'फीस संरचना', 'हॉस्टल जानकारी', 'काउंसलर से बात करें']
      };

      return {
        sessionId,
        language: activeLang,
        intent: 'AI_COUNSELLING',
        reply: fullReply,
        quickReplies: defaultQuickReplies[activeLang] || defaultQuickReplies.en,
        enquiryTrackingId: generatedEnquiry ? generatedEnquiry.trackingId : null,
        handoffRequested: false,
        confidence: 0.95,
        engineUsed: 'AI_GEMINI',
        model: aiResponse.model,
        usage: aiResponse.usage,
        fallbackReason: null
      };

    } catch (fallbackError) {
      // Automatic fail-safe fallback to deterministic counselling engine
      const fallbackReason = fallbackError.code || fallbackError.message || 'AI_GATEWAY_ERROR';
      console.warn(`[AIGatewayManager] AI Gateway failed (${fallbackReason}). Falling back to Deterministic Engine.`);

      const result = await handleDeterministicMessage({
        sessionId,
        message,
        selectedLanguage,
        explicitLanguageSwitch,
        collegeCode
      });

      // Mark conversation with fallback state
      try {
        await Conversation.updateOne(
          { sessionId },
          { $set: { engineUsed: 'DETERMINISTIC_FALLBACK' } }
        );
      } catch {
        // non-blocking
      }

      return {
        ...result,
        engineUsed: 'DETERMINISTIC_FALLBACK',
        fallbackReason
      };
    }
  }

  /**
   * Returns complete telemetry and status of AI components
   * @returns {Object}
   */
  getStatus() {
    return {
      enabled: this.isEnabled(),
      provider: this.defaultProvider,
      gateway: this.gateway ? this.gateway.getStatus() : null
    };
  }

  /**
   * Resets AI circuit breaker and rate limiter counters
   */
  reset() {
    if (this.gateway) {
      this.gateway.reset();
    }
  }
}

export const aiGatewayManager = new AIGatewayManager();
export default aiGatewayManager;
