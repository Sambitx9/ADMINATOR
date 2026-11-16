/**
 * ADMINATOR — Deterministic Admission Counselling Engine
 * 
 * ZERO External AI API dependency. ₹0 additional cost.
 * Provides rich, culturally resonant, multilingual admission guidance across
 * English, Odia (ଓଡ଼ିଆ), and Hindi (हिन्दी).
 */

import {
  College,
  Branch,
  Course,
  EligibilityRule,
  FeeStructure,
  Student,
  Enquiry,
  Conversation,
  KnowledgeNode
} from '../models/index.js';

import {
  extractIntentAndEntities,
  detectLanguageAndScript
} from './languageDetectorService.js';

import {
  evaluateEligibility
} from './deterministicEligibilityEngine.js';

import { generateTrackingId } from '../utils/idGenerator.js';
import { localEventBus } from '../services/LocalEventDispatcher.js';

// Multilingual Disclaimer Tags
const DEMO_DISCLAIMERS = {
  en: '\n\n⚠️ [DEMO DATA - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]',
  or: '\n\n⚠️ [ଡେମୋ ତଥ୍ୟ - କେବଳ ମୂଲ୍ୟାଙ୍କନ ପାଇଁ - ସରକାରୀ ନାମଲେଖା ତଥ୍ୟ ନୁହେଁ]',
  hi: '\n\n⚠️ [डेमो डेटा - केवल मूल्यांकन के लिए - आधिकारिक प्रवेश डेटा नहीं]'
};

// Multilingual Quick Replies & Prompts
const QUICK_REPLIES = {
  en: {
    greeting: ['Explore Branches', 'Check Eligibility', 'Fee Structure', 'Hostel Info', 'Talk to Counsellor'],
    branches: ['Mechanical', 'Civil', 'Computer Science', 'Electrical', 'Electronics', 'Automobile'],
    pathway: ['1st Year (After 10th)', 'Lateral Entry (After ITI/+2)'],
    eligibilityMarks: ['40% - 50%', '50% - 60%', '60% - 75%', 'Above 75%'],
    counsellorHandoff: ['Share Contact Details', 'Back to Main Menu']
  },
  or: {
    greeting: ['ଶାଖା ଦେଖନ୍ତୁ', 'ଯୋଗ୍ୟତା ଯାଞ୍ଚ', 'ଫିସ୍ ବିବରଣୀ', 'ହଷ୍ଟେଲ ସୂଚନା', 'କାଉନସେଲରଙ୍କ ସହ କଥା'],
    branches: ['ମେକାନିକାଲ୍', 'ସିଭିଲ୍', 'କମ୍ପ୍ୟୁଟର ସାଇନ୍ସ', 'ଇଲେକ୍ଟ୍ରିକାଲ୍', 'ଇଲେକ୍ଟ୍ରୋନିକ୍ସ', 'ଅଟୋମୋବାଇଲ୍'],
    pathway: ['ପ୍ରଥମ ବର୍ଷ (୧୦ମ ପରେ)', 'ଲାଟେରାଲ ଏଣ୍ଟ୍ରି (ITI/+୨ ପରେ)'],
    eligibilityMarks: ['୪୦% - ୫୦%', '୫୦% - ୬୦%', '୬୦% - ୭୫%', '୭୫% ରୁ ଅଧିକ'],
    counsellorHandoff: ['ସମ୍ପର୍କ ନମ୍ବର ଦିଅନ୍ତୁ', 'ମୁଖ୍ୟ ମେନୁ']
  },
  hi: {
    greeting: ['शाखाएं देखें', 'पात्रता जांचें', 'फीस संरचना', 'हॉस्टल जानकारी', 'काउंसलर से बात करें'],
    branches: ['मैकेनिकल', 'सिविल', 'कंप्यूटर साइंस', 'इलेक्ट्रिकल', 'इलेक्ट्रॉनिक्स', 'ऑटोमोबाइल'],
    pathway: ['प्रथम वर्ष (10वीं बाद)', 'लेटरल एंट्री (ITI/+2 बाद)'],
    eligibilityMarks: ['40% - 50%', '50% - 60%', '60% - 75%', '75% से अधिक'],
    counsellorHandoff: ['संपर्क नंबर दें', 'मुख्य मेनू']
  }
};

/**
 * Extracts phone number and candidate name from text if available
 */
const extractLeadInfo = (text = '') => {
  const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
  const phone = phoneMatch ? phoneMatch[1] : null;

  // Extract name if pattern like "my name is Rahul" or "Rahul Kumar, 9876543210" or "Rahul 9876543210"
  let name = null;
  const namePattern = /(?:my name is|i am|name:|naam:|nama:)\s*([a-zA-Z\s]{2,30})/i;
  const nameMatch = text.match(namePattern);
  if (nameMatch) {
    name = nameMatch[1].trim();
  } else if (phone) {
    // If text has words before phone number
    const words = text.replace(phone, '').trim().split(/\s+/);
    if (words.length > 0 && words[0].length >= 3 && /^[a-zA-Z]+$/.test(words[0])) {
      name = words.slice(0, 2).join(' ');
    }
  }

  return { phone, name };
};

/**
 * Main deterministic counselling handler
 */
export const handleIncomingMessage = async ({
  sessionId,
  message,
  selectedLanguage = null,
  explicitLanguageSwitch = false,
  collegeCode = 'DRIEMS'
}) => {
  if (!sessionId) {
    throw new Error('Session ID is required for counselling engine.');
  }

  // 1. Fetch or create conversation record
  let conversation = await Conversation.findOne({ sessionId });
  if (!conversation) {
    const college = await College.findOne({ code: collegeCode }) || await College.findOne({ code: 'DRIEMS' });
    conversation = await Conversation.create({
      sessionId,
      collegeId: college ? college._id : null,
      language: selectedLanguage || 'en',
      engineUsed: 'DETERMINISTIC',
      messages: []
    });
  }

  // 2. Analyze language and intent
  const currentLang = conversation.language || selectedLanguage || 'en';
  const nlu = extractIntentAndEntities(message, currentLang);
  
  // Dynamic Language Resolution Pipeline:
  // 1. Explicit language switch intent (e.g. "मैं हिंदी में बात करना चाहता हूँ", "ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି", "Switch to English")
  // 2. Clear native script detection (NATIVE_ODIA -> 'or', NATIVE_HINDI -> 'hi')
  // 3. Clear Romanized regional input (ROMANIZED_ODIA -> 'or', ROMANIZED_HINDI -> 'hi')
  // 4. Explicit UI language switch button clicked (explicitLanguageSwitch === true)
  // 5. English input (if clearly English) or conversation session continuity
  let activeLang = currentLang;

  if (nlu.intent === 'LANGUAGE_SWITCH' && nlu.entities.languageSwitchTarget) {
    activeLang = nlu.entities.languageSwitchTarget;
  } else if (nlu.script === 'NATIVE_ODIA') {
    activeLang = 'or';
  } else if (nlu.script === 'NATIVE_HINDI') {
    activeLang = 'hi';
  } else if (nlu.script === 'ROMANIZED_ODIA' && nlu.confidence >= 0.70) {
    activeLang = 'or';
  } else if (nlu.script === 'ROMANIZED_HINDI' && nlu.confidence >= 0.70) {
    activeLang = 'hi';
  } else if (explicitLanguageSwitch && selectedLanguage) {
    activeLang = selectedLanguage;
  } else if (nlu.script === 'ENGLISH' && nlu.language === 'en' && /[a-zA-Z]{3,}/.test(message) && !nlu.isCodeMixed) {
    if (nlu.intent !== 'GENERAL_QUERY' || /\b(hello|hi|hey|admission|want|course|branch|fee|fees|hostel|eligible|eligibility|study|counsellor)\b/i.test(message)) {
      activeLang = 'en';
    } else {
      activeLang = currentLang;
    }
  } else {
    activeLang = currentLang;
  }

  // Preserve conversation context while updating session language
  conversation.language = activeLang;

  // Record user message
  conversation.messages.push({
    sender: 'USER',
    text: message,
    language: activeLang,
    intent: nlu.intent,
    timestamp: new Date()
  });

  // Check if student provided lead contact details (Phone number from normalized text)
  const leadInfo = extractLeadInfo(nlu.normalizedText);
  let generatedEnquiry = null;

  if (leadInfo.phone) {
    // Register or find student and create enquiry
    let student = await Student.findOne({ mobileNumber: leadInfo.phone });
    if (!student) {
      student = await Student.create({
        fullName: leadInfo.name || 'Student Candidate (Demo)',
        mobileNumber: leadInfo.phone,
        preferredLanguage: activeLang,
        district: 'Khordha',
        state: 'Odisha'
      });
    }

    const trackingId = generateTrackingId();
    const college = await College.findOne({ code: collegeCode || 'DRIEMS' }) || await College.findOne({ code: 'DRIEMS' }) || await College.findOne();
    
    generatedEnquiry = await Enquiry.create({
      trackingId,
      studentId: student._id,
      collegeId: college ? college._id : null,
      assignedStaffId: null,
      source: 'SIMULATOR',
      status: 'NEW',
      notes: [{ author: 'STUDENT_CHAT', text: `Student shared contact during chat: ${leadInfo.name || 'Candidate'} (${leadInfo.phone})` }],
      isDemo: true
    });

    conversation.enquiryId = generatedEnquiry._id;
    conversation.handoffRequested = true;
    conversation.handoffStatus = 'PENDING';
  }

  let botResponseText = '';
  let quickReplies = QUICK_REPLIES[activeLang]?.greeting || QUICK_REPLIES.en.greeting;

  // 3. Resolve Intent
  switch (nlu.intent) {
    case 'LANGUAGE_SWITCH': {
      if (activeLang === 'or') {
        botResponseText = 'ନିଶ୍ଚୟ! ଆମେ ଏବେ ଓଡ଼ିଆରେ କଥାବାର୍ତ୍ତା ଜାରି ରଖିପାରିବା। ଆପଣ ଡିପ୍ଲୋମା ନାମଲେଖା, ଇଞ୍ଜିନିୟରିଂ ଶାଖା, ଯୋଗ୍ୟତା କିମ୍ବା ଫିସ୍ ବିଷୟରେ କ’ଣ ଜାଣିବାକୁ ଚାହାଁନ୍ତି?';
        quickReplies = QUICK_REPLIES.or.greeting;
      } else if (activeLang === 'hi') {
        botResponseText = 'निश्चय ही! हम अब हिन्दी में बातचीत जारी रख सकते हैं। आप डिप्लोमा प्रवेश, इंजीनियरिंग शाखाओं, पात्रता या फीस के बारे में क्या जानना चाहते हैं?';
        quickReplies = QUICK_REPLIES.hi.greeting;
      } else {
        botResponseText = 'Certainly! We can continue our conversation in English. What would you like to know about diploma engineering branches, eligibility, or fees?';
        quickReplies = QUICK_REPLIES.en.greeting;
      }
      break;
    }

    case 'GREETING': {
      if (activeLang === 'or') {
        botResponseText = 'ନମସ୍କାର! ଆଡମିନିଏଟର (ADMINATOR) ଡିପ୍ଲୋମା ନାମଲେଖା ସହାୟତା କେନ୍ଦ୍ରକୁ ଆପଣଙ୍କୁ ସ୍ୱାଗତ। ମୁଁ ଆପଣଙ୍କୁ ଇଞ୍ଜିନିୟରିଂ ଶାଖା, ଯୋଗ୍ୟତା, ଫିସ୍ ଏବଂ ହଷ୍ଟେଲ ସମ୍ବନ୍ଧରେ ସଠିକ୍ ସୂଚନା ଦେଇପାରିବି। ଆଜି ଆପଣ କ’ଣ ଜାଣିବାକୁ ଚାହାଁନ୍ତି?';
        quickReplies = QUICK_REPLIES.or.greeting;
      } else if (activeLang === 'hi') {
        botResponseText = 'नमस्ते! एडमिनिएटर (ADMINATOR) डिप्लोमा प्रवेश सहायता केंद्र में आपका स्वागत है। मैं आपको इंजीनियरिंग शाखाओं, पात्रता, फीस और हॉस्टल की सही जानकारी प्रदान कर सकता हूँ। आज आप क्या जानना चाहते हैं?';
        quickReplies = QUICK_REPLIES.hi.greeting;
      } else {
        botResponseText = 'Hello! Welcome to the ADMINATOR Diploma Admission Guidance Desk. I can assist you with diploma engineering branches, eligibility checks, fee structures, and campus facilities. How can I help you today?';
        quickReplies = QUICK_REPLIES.en.greeting;
      }
      break;
    }

    case 'BRANCH_DISCOVERY': {
      const branches = await Branch.find({ isActive: true });
      const branchCode = nlu.entities.branchCode;

      if (branchCode) {
        const branch = branches.find(b => b.code === branchCode);
        if (branch) {
          const bName = branch.name[activeLang] || branch.name.en;
          const bDesc = branch.description[activeLang] || branch.description.en;
          const prospects = branch.careerProspects.join(', ');

          if (activeLang === 'or') {
            botResponseText = `📌 **${bName} (${branch.code})**\n\n${bDesc}\n\n⏱️ ଅବଧି: ୩ ବର୍ଷ (ପ୍ରଥମ ବର୍ଷ ନାମଲେଖା) କିମ୍ବା ୨ ବର୍ଷ (ITI/+୨ ଲାଟେରାଲ ଏଣ୍ଟ୍ରି)।\n💼 ନିଯୁକ୍ତି ସୁଯୋଗ: ${prospects}\n\nଆପଣ ଏହି ଶାଖା ପାଇଁ ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରିବାକୁ ଚାହାଁନ୍ତି କି?`;
            quickReplies = ['ମୋ ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରନ୍ତୁ', `${bName} ଫିସ୍ ଜାଣନ୍ତୁ`, 'ଅନ୍ୟ ଶାଖା ଦେଖନ୍ତୁ'];
          } else if (activeLang === 'hi') {
            botResponseText = `📌 **${bName} (${branch.code})**\n\n${bDesc}\n\n⏱️ अवधि: 3 वर्ष (प्रथम वर्ष प्रवेश) अथवा 2 वर्ष (ITI/+2 लेटरल एंट्री)।\n💼 करियर विकल्प: ${prospects}\n\nक्या आप इस शाखा के लिए अपनी पात्रता जांचना चाहते हैं?`;
            quickReplies = ['मेरी पात्रता जांचें', `${bName} की फीस जानें`, 'अन्य शाखाएं देखें'];
          } else {
            botResponseText = `📌 **${bName} (${branch.code})**\n\n${bDesc}\n\n⏱️ Duration: 3 Years (1st Year Admission) or 2 Years (ITI/+2 Lateral Entry).\n💼 Career Opportunities: ${prospects}\n\nWould you like to check your eligibility or fee structure for this branch?`;
            quickReplies = ['Check My Eligibility', `Check Fees for ${branch.code}`, 'Explore Other Branches'];
          }
          break;
        }
      }

      // If no single branch specified, list available branches
      if (activeLang === 'or') {
        const branchList = branches.map(b => `• **${b.name.or || b.name.en}** (${b.code})`).join('\n');
        botResponseText = `ଉପଲବ୍ଧ ଡିପ୍ଲୋମା ଇଞ୍ଜିନିୟରିଂ ଶାଖାଗୁଡ଼ିକ:\n\n${branchList}\n\nଆପଣ କେଉଁ ଶାଖା ବିଷୟରେ ଅଧିକ ଜାଣିବାକୁ ଚାହାଁନ୍ତି? ତଳେ ଥିବା ବଟନ୍ ଚୟନ କରନ୍ତୁ:`;
        quickReplies = QUICK_REPLIES.or.branches;
      } else if (activeLang === 'hi') {
        const branchList = branches.map(b => `• **${b.name.hi || b.name.en}** (${b.code})`).join('\n');
        botResponseText = `उपलब्ध डिप्लोमा इंजीनियरिंग शाखाएं:\n\n${branchList}\n\nआप किस शाखा के बारे में अधिक जानना चाहते हैं? नीचे दिया गया विकल्प चुनें:`;
        quickReplies = QUICK_REPLIES.hi.branches;
      } else {
        const branchList = branches.map(b => `• **${b.name.en}** (${b.code})`).join('\n');
        botResponseText = `Available Diploma Engineering Branches:\n\n${branchList}\n\nWhich branch would you like to explore? Select an option below:`;
        quickReplies = QUICK_REPLIES.en.branches;
      }
      break;
    }

    case 'ELIGIBILITY_CHECK':
    case 'ELIGIBILITY_QUERY': {
      const branchCode = nlu.entities.branchCode || 'MECH';
      const percentage = nlu.entities.percentage;
      const pathway = nlu.entities.pathway || 'FIRST_YEAR';

      if (percentage === null || percentage === undefined) {
        if (activeLang === 'or') {
          botResponseText = `ଡିପ୍ଲୋମା ନାମଲେଖା ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରିବା ପାଇଁ, ଦୟାକରି ଆପଣଙ୍କର ୧୦ମ କିମ୍ବା ITI/+୨ ପ୍ରତିଶତ (Percentage) ଟାଇପ୍ କରନ୍ତୁ (ଯଥା: ୫୮% କିମ୍ବା ୬୨%)।`;
          quickReplies = QUICK_REPLIES.or.eligibilityMarks;
        } else if (activeLang === 'hi') {
          botResponseText = `डिप्लोमा प्रवेश पात्रता जांचने के लिए, कृपया अपना 10वीं या ITI/+2 प्रतिशत (Percentage) लिखें (जैसे: 58% या 62%)।`;
          quickReplies = QUICK_REPLIES.hi.eligibilityMarks;
        } else {
          botResponseText = `To evaluate your diploma admission eligibility, please provide your 10th standard or ITI/+2 aggregate percentage (e.g., 55% or 68%).`;
          quickReplies = QUICK_REPLIES.en.eligibilityMarks;
        }
        break;
      }

      // We have percentage and branch, perform deterministic evaluation
      const rule = await EligibilityRule.findOne({ branchCode, pathway, isActive: true }) || {
        minAggregatePercentageGeneral: 35,
        minAggregatePercentageReserved: 30,
        requiredSubjects: ['Mathematics', 'Science'],
        isDemo: true
      };

      const evalResult = evaluateEligibility(
        {
          pathway,
          qualifyingExam: pathway === 'LATERAL_ENTRY' ? 'ITI' : '10TH',
          aggregatePercentage: percentage,
          category: 'GENERAL',
          ageYears: 16,
          passedMathAndScience: true
        },
        rule,
        activeLang
      );

      const statusIcon = evalResult.isEligible ? '🎉' : '⚠️';
      const explanations = evalResult.evaluations && evalResult.evaluations.length > 0
        ? evalResult.evaluations.map(e => e.explanation).join('\n• ')
        : evalResult.plainReason;

      if (activeLang === 'or') {
        botResponseText = `${statusIcon} **ଯୋଗ୍ୟତା ମୂଲ୍ୟାଙ୍କନ ଫଳାଫଳ (${percentage}%)**:\n\n**ସ୍ଥିତି**: ${evalResult.verdict === 'ELIGIBLE' ? 'ଆପଣ ଯୋଗ୍ୟ ଅଟନ୍ତି' : 'ଅଧିକ ଯାଞ୍ଚ ଆବଶ୍ୟକ'}\n\n• ${explanations}\n\nଆପଣ ${branchCode} ଶାଖା ପାଇଁ ଫିସ୍ ବିବରଣୀ ଜାଣିବାକୁ ଚାହାଁନ୍ତି କିମ୍ବା ଆମ କାଉନସେଲରଙ୍କ ସହ କଥା ହେବାକୁ ଚାହାଁନ୍ତି?`;
        quickReplies = [`${branchCode} ଫିସ୍ ଦେଖନ୍ତୁ`, 'କାଉନସେଲରଙ୍କ ସହ କଥା', 'ମୁଖ୍ୟ ମେନୁ'];
      } else if (activeLang === 'hi') {
        botResponseText = `${statusIcon} **पात्रता मूल्यांकन परिणाम (${percentage}%)**:\n\n**स्थिति**: ${evalResult.verdict === 'ELIGIBLE' ? 'आप योग्य हैं' : 'अतिरिक्त सत्यापन आवश्यक'}\n\n• ${explanations}\n\nक्या आप ${branchCode} शाखा के लिए फीस संरचना देखना चाहते हैं या हमारे काउंसलर से संपर्क करना चाहते हैं?`;
        quickReplies = [`${branchCode} की फीस देखें`, 'काउंसलर से बात करें', 'मुख्य मेनू'];
      } else {
        botResponseText = `${statusIcon} **Eligibility Evaluation Result (${percentage}%)**:\n\n**Verdict**: ${evalResult.verdict === 'ELIGIBLE' ? 'ELIGIBLE' : 'NEEDS MANUAL VERIFICATION'}\n\n• ${explanations}\n\nWould you like to view the sample fee structure for ${branchCode} or connect with an admission counsellor?`;
        quickReplies = [`View Fees for ${branchCode}`, 'Talk to Counsellor', 'Main Menu'];
      }
      break;
    }

    case 'FEE_QUERY':
    case 'FEE_AND_HOSTEL_QUERY': {
      const branchCode = nlu.entities.branchCode || 'MECH';
      const feeData = await FeeStructure.findOne({ branchCode }).populate('collegeId');

      const tuitionFee = feeData ? feeData.tuitionFeePerSemester : 19000;
      const admissionFee = feeData ? feeData.admissionFeeOneTime : 3000;
      const labFee = feeData ? feeData.labWorkshopFeePerYear : 4000;
      const hostelFee = (feeData && feeData.hostelFeePerSemester) ? feeData.hostelFeePerSemester : 15000;
      const includeHostel = nlu.entities.includeHostel || nlu.intent === 'FEE_AND_HOSTEL_QUERY';

      if (activeLang === 'or') {
        botResponseText = `💰 **ନମୁନା ଫିସ୍ ବିବରଣୀ — ${branchCode} ଡିପ୍ଲୋମା (୨୦୨୫-୨୬)**:\n\n` +
          `• ଟ୍ୟୁସନ୍ ଫିସ୍: ₹${tuitionFee.toLocaleString('en-IN')} / ସେମିଷ୍ଟାର\n` +
          `• ନାମଲେଖା ଫିସ୍ (ଗୋଟିଏ ଥର): ₹${admissionFee.toLocaleString('en-IN')}\n` +
          `• ଲ୍ୟାବ୍ ଏବଂ କର୍ମଶାଳା ଫିସ୍: ₹${labFee.toLocaleString('en-IN')} / ବର୍ଷ\n` +
          (includeHostel ? `• ହଷ୍ଟେଲ ଏବଂ ମେସ୍ ଫିସ୍: ₹${hostelFee.toLocaleString('en-IN')} / ସେମିଷ୍ଟାର\n` : '') +
          `\n🎓 **ସ୍କଲାରସିପ୍ ସୁଯୋଗ**: ଓଡ଼ିଶା ସରକାରଙ୍କ PRERANA ସ୍କଲାରସିପ୍ ଏବଂ ମେରିଟ୍ ଛାତ୍ରବୃତ୍ତି ଅଧୀନରେ ଯୋଗ୍ୟ ଛାତ୍ରଛାତ୍ରୀଙ୍କୁ ସମ୍ପୂର୍ଣ୍ଣ କିମ୍ବା ଆଂଶିକ ଫିସ୍ ଛାଡ଼ ସୁବିଧା ଉପଲବ୍ଧ।`;
        quickReplies = ['ହଷ୍ଟେଲ ସୁବିଧା ବିଷୟରେ ଜାଣନ୍ତୁ', 'ଆବଶ୍ୟକ କାଗଜପତ୍ର', 'କାଉନସେଲରଙ୍କ ସହ କଥା'];
      } else if (activeLang === 'hi') {
        botResponseText = `💰 **नमूना फीस संरचना — ${branchCode} डिप्लोमा (2025-26)**:\n\n` +
          `• ट्यूशन फीस: ₹${tuitionFee.toLocaleString('en-IN')} / सेमेस्टर\n` +
          `• प्रवेश शुल्क (एकमुश्त): ₹${admissionFee.toLocaleString('en-IN')}\n` +
          `• लैब एवं कार्यशाला शुल्क: ₹${labFee.toLocaleString('en-IN')} / वर्ष\n` +
          (includeHostel ? `• हॉस्टल एवं मेस शुल्क: ₹${hostelFee.toLocaleString('en-IN')} / सेमेस्टर\n` : '') +
          `\n🎓 **छात्रवृत्ति**: ओडिशा सरकार की प्रेरणा (PRERANA) छात्रवृत्ति और मेरिट छात्रवृत्ति के तहत पात्र छात्रों को फीस छूट उपलब्ध है।`;
        quickReplies = ['हॉस्टल सुविधाएं जानें', 'आवश्यक दस्तावेज', 'काउंसलर से बात करें'];
      } else {
        botResponseText = `💰 **Sample Fee Structure — ${branchCode} Diploma (2025-26)**:\n\n` +
          `• Tuition Fee: ₹${tuitionFee.toLocaleString('en-IN')} / Semester\n` +
          `• One-Time Admission Fee: ₹${admissionFee.toLocaleString('en-IN')}\n` +
          `• Lab & Workshop Fee: ₹${labFee.toLocaleString('en-IN')} / Year\n` +
          (includeHostel ? `• Hostel & Mess Fee: ₹${hostelFee.toLocaleString('en-IN')} / Semester\n` : '') +
          `\n🎓 **Scholarships**: Eligible SC/ST/OBC and merit students can apply for the Odisha PRERANA scholarship and Post-Matric fee concessions.`;
        quickReplies = ['Hostel Facilities', 'Required Documents', 'Talk to Counsellor'];
      }
      break;
    }

    case 'HOSTEL_QUERY': {
      if (activeLang === 'or') {
        botResponseText = `🏢 **ହଷ୍ଟେଲ ଏବଂ କ୍ୟାମ୍ପସ ସୁବିଧା**:\n\n` +
          `• ଛାତ୍ର ଏବଂ ଛାତ୍ରୀମାନଙ୍କ ପାଇଁ ପୃଥକ ସୁରକ୍ଷିତ ହଷ୍ଟେଲ (୨୪x୭ ସୁରକ୍ଷା ଓ ସିସିଟିଭି)\n` +
          `• ସ୍ୱାସ୍ଥ୍ୟକର ଓଡ଼ିଆ ଏବଂ ଭାରତୀୟ ଖାଦ୍ୟ (ମେସ୍ ସୁବିଧା)\n` +
          `• ୱାଇ-ଫାଇ କ୍ୟାମ୍ପସ ଏବଂ ପାଠାଗାର\n` +
          `• କ୍ରୀଡ଼ା ପ୍ରାଙ୍ଗଣ ଏବଂ ପ୍ରାଥମିକ ଚିକିତ୍ସା ସୁବିଧା\n` +
          `• ହଷ୍ଟେଲ ଖର୍ଚ୍ଚ: ପାଖାପାଖି ₹୧୫,୦୦୦ / ସେମିଷ୍ଟାର (ଭୋଜନ ଅନ୍ତର୍ଭୁକ୍ତ)।`;
        quickReplies = ['ଫିସ୍ ବିବରଣୀ ଦେଖନ୍ତୁ', 'କଲେଜ କ୍ୟାମ୍ପସ ଲୋକେସନ', 'କାଉନସେଲରଙ୍କ ସହ କଥା'];
      } else if (activeLang === 'hi') {
        botResponseText = `🏢 **हॉस्टल एवं परिसर सुविधाएं**:\n\n` +
          `• छात्रों और छात्राओं के लिए पृथक एवं सुरक्षित हॉस्टल (24x7 सुरक्षा और सीसीटीवी)\n` +
          `• स्वच्छ एवं पौष्टिक भोजन (मेस व्यवस्था)\n` +
          `• वाई-फाई युक्त परिसर और डिजिटल लाइब्रेरी\n` +
          `• खेल का मैदान और प्राथमिक चिकित्सा केंद्र\n` +
          `• हॉस्टल शुल्क: लगभग ₹15,000 / सेमेस्टर (भोजन सहित)।`;
        quickReplies = ['फीस संरचना देखें', 'कॉलेज परिसर स्थान', 'काउंसलर से बात करें'];
      } else {
        botResponseText = `🏢 **Hostel & Campus Facilities**:\n\n` +
          `• Separate, secure hostels for boys and girls with 24/7 warden and CCTV surveillance\n` +
          `• Hygienic mess providing balanced meals\n` +
          `• High-speed Wi-Fi enabled study rooms and digital library access\n` +
          `• Sports playground, gymnasium, and round-the-clock medical aid\n` +
          `• Sample Hostel Fee: Approx. ₹15,000 / Semester (includes mess).`;
        quickReplies = ['View Fee Structure', 'Campus Location', 'Talk to Counsellor'];
      }
      break;
    }

    case 'SCHOLARSHIP_QUERY': {
      if (activeLang === 'or') {
        botResponseText = `🎓 **ଡିପ୍ଲୋମା ଛାତ୍ରବୃତ୍ତି (Scholarships)**:\n\n` +
          `୧. **PRERANA ଛାତ୍ରବୃତ୍ତି**: ଓଡ଼ିଶା ସରକାରଙ୍କ ଅନୁସୂଚିତ ଜାତି/ଜନଜାତି/ପଛୁଆ ବର୍ଗ (SC/ST/OBC) ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ ଟ୍ୟୁସନ ଫିସ୍ ଛାଡ଼।\n` +
          `୨. **ମେରିଟ୍-କମ୍-ମିନସ୍ ଛାତ୍ରବୃତ୍ତି**: ୧୦ମ ବୋର୍ଡରେ ୭୫% ରୁ ଅଧିକ ନମ୍ବର ରଖିଥିବା ମେଧାବୀ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ ସ୍ୱତନ୍ତ୍ର ସହାୟତା।\n` +
          `୩. **ମହିଳା ଛାତ୍ରୀ ପ୍ରୋତ୍ସାହନ**: ବୈଷୟିକ ଶିକ୍ଷାରେ ଛାତ୍ରୀମାନଙ୍କୁ ପ୍ରୋତ୍ସାହିତ କରିବା ପାଇଁ ଆଡମିଶନ ରିହାତି।`;
        quickReplies = ['ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରନ୍ତୁ', 'ଫିସ୍ ଦେଖନ୍ତୁ', 'କାଉନସେଲରଙ୍କ ସହ କଥା'];
      } else if (activeLang === 'hi') {
        botResponseText = `🎓 **डिप्लोमा छात्रवृत्ति (Scholarships)**:\n\n` +
          `1. **प्रेरणा (PRERANA) छात्रवृत्ति**: ओडिशा सरकार की एससी/एसटी/ओबीसी छात्रों के लिए पूर्ण अथवा आंशिक फीस छूट।\n` +
          `2. **मेरिट छात्रवृत्ति**: 10वीं बोर्ड में 75% से अधिक अंक प्राप्त करने वाले मेधावी छात्रों के लिए विशेष छात्रवृत्ति।\n` +
          `3. **महिला तकनीकी प्रोत्साहन**: छात्राओं के तकनीकी प्रवेश के लिए विशेष शुल्क रियायत।`;
        quickReplies = ['पात्रता जांचें', 'फीस देखें', 'काउंसलर से बात करें'];
      } else {
        botResponseText = `🎓 **Diploma Scholarships & Fee Concessions**:\n\n` +
          `1. **PRERANA Post-Matric Scholarship**: Government of Odisha tuition fee reimbursement for SC/ST/OBC/SEBC students.\n` +
          `2. **Merit-cum-Means Scholarship**: Institutional waiver for candidates scoring 75%+ in 10th Board examinations.\n` +
          `3. **Women in Tech Incentive**: Special tuition concession for female engineering aspirants.`;
        quickReplies = ['Check Eligibility', 'View Fees', 'Talk to Counsellor'];
      }
      break;
    }

    case 'DOCUMENTS_QUERY': {
      if (activeLang === 'or') {
        botResponseText = `📋 **ନାମଲେଖା ପାଇଁ ଆବଶ୍ୟକୀୟ କାଗଜପତ୍ର (Document Checklist)**:\n\n` +
          `୧. ୧୦ମ ବୋର୍ଡ ପାସ୍ ସାର୍ଟିଫିକେଟ୍ ଏବଂ ମାର୍କସିଟ୍ (ମୂଳ ଓ ଜେରକ୍ସ)\n` +
          `୨. ସ୍କୁଲ୍/କଲେଜ ଲିଭିଂ ସାର୍ଟିଫିକେଟ୍ (CLC/SLC) ଏବଂ ଆଚରଣ ପ୍ରମାଣପତ୍ର\n` +
          `୩. ସ୍ଥାୟୀ ବାସିନ୍ଦା ପ୍ରମାଣପତ୍ର (Resident Certificate)\n` +
          `୪. ଜାତି ପ୍ରମାଣପତ୍ର (Caste Certificate, ଯଦି ସଂରକ୍ଷଣ ଆବଶ୍ୟକ)\n` +
          `୫. ୫ ଖଣ୍ଡ ପାସପୋର୍ଟ ସାଇଜ୍ ଫଟୋଗ୍ରାଫ୍\n` +
          `୬. ଆଧାର କାର୍ଡର ନକଲ\n` +
          `୭. ITI କିମ୍ବା +୨ ସାଇନ୍ସ ମାର୍କସିଟ୍ (ଲାଟେରାଲ ଏଣ୍ଟ୍ରି ଛାତ୍ରଙ୍କ ପାଇଁ)`;
        quickReplies = ['ଯୋଗ୍ୟତା ଯାଞ୍ଚ', 'ଫିସ୍ ବିବରଣୀ', 'କାଉନସେଲରଙ୍କ ସହ କଥା'];
      } else if (activeLang === 'hi') {
        botResponseText = `📋 **प्रवेश हेतु आवश्यक दस्तावेज (Document Checklist)**:\n\n` +
          `1. 10वीं बोर्ड उत्तीर्ण प्रमाणपत्र एवं अंकतालिका (मूल व प्रतिलिपि)\n` +
          `2. स्थानांतरण प्रमाणपत्र (CLC/SLC) एवं चरित्र प्रमाणपत्र\n` +
          `3. मूल निवास प्रमाणपत्र (Resident Certificate)\n` +
          `4. जाति प्रमाणपत्र (आरक्षण श्रेणी के आवेदकों के लिए)\n` +
          `5. 5 पासपोर्ट साइज नवीनतम फोटो\n` +
          `6. आधार कार्ड की छायाप्रति\n` +
          `7. ITI अथवा +2 साइंस अंकतालिका (लेटरल एंट्री उम्मीदवारों हेतु)`;
        quickReplies = ['पात्रता जांचें', 'फीस विवरण', 'काउंसलर से बात करें'];
      } else {
        botResponseText = `📋 **Mandatory Admission Document Checklist**:\n\n` +
          `1. 10th Board Pass Certificate and Marksheet (Original + 3 sets xerox)\n` +
          `2. College / School Leaving Certificate (CLC/SLC) and Conduct Certificate\n` +
          `3. Resident / Nativity Certificate issued by competent authority\n` +
          `4. Caste Certificate (SC/ST/OBC/SEBC if claiming category concession)\n` +
          `5. 5 Recent Passport-size Photographs\n` +
          `6. Photocopy of Aadhaar Card\n` +
          `7. ITI / +2 Science Marksheet & Certificate (For Lateral Entry candidates)`;
        quickReplies = ['Check Eligibility', 'View Fees', 'Talk to Counsellor'];
      }
      break;
    }

    case 'COUNSELLOR_HANDOFF': {
      if (generatedEnquiry) {
        if (activeLang === 'or') {
          botResponseText = `✅ **ଆପଣଙ୍କର ଅନୁରୋଧ ସଫଳତାର ସହ ପଞ୍ଜୀକୃତ ହୋଇଛି!**\n\n` +
            `ଟ୍ରାକିଂ ID: **${generatedEnquiry.trackingId}**\n` +
            `ଆମର ନାମଲେଖା କାଉନସେଲର ଖୁବ୍ ଶୀଘ୍ର ଆପଣଙ୍କ ମୋବାଇଲ୍ ନମ୍ବରରେ ସମ୍ପର୍କ କରିବେ। ଆପଣ ଏହି ଟ୍ରାକିଂ ID ଦ୍ୱାରା ନିଜର ଆବେଦନ ସ୍ଥିତି ଯାଞ୍ଚ କରିପାରିବେ।`;
          quickReplies = ['ମୁଖ୍ୟ ମେନୁ', 'ଶାଖା ଦେଖନ୍ତୁ'];
        } else if (activeLang === 'hi') {
          botResponseText = `✅ **आपका अनुरोध सफलतापूर्वक दर्ज कर लिया गया है!**\n\n` +
            `ट्रैकिंग आईडी: **${generatedEnquiry.trackingId}**\n` +
            `हमारे प्रवेश सलाहकार शीघ्र ही आपके मोबाइल नंबर पर संपर्क करेंगे। आप इस ट्रैकिंग आईडी से अपनी आवेदन स्थिति जांच सकते हैं।`;
          quickReplies = ['मुख्य मेनू', 'शाखाएं देखें'];
        } else {
          botResponseText = `✅ **Your enquiry has been successfully registered!**\n\n` +
            `Tracking ID: **${generatedEnquiry.trackingId}**\n` +
            `Our admission counsellor will get in touch with you shortly on your provided contact number. Keep this tracking ID for your records.`;
          quickReplies = ['Main Menu', 'Explore Branches'];
        }
      } else {
        conversation.handoffRequested = true;
        if (activeLang === 'or') {
          botResponseText = `ଆମର ନାମଲେଖା କାଉନସେଲରଙ୍କ ସହିତ ସିଧାସଳଖ କଥା ହେବା ପାଇଁ, ଦୟାକରି ଆପଣଙ୍କର **ନାମ** ଏବଂ **୧୦-ଅଙ୍କ ବିଶିଷ୍ଟ ମୋବାଇଲ୍ ନମ୍ବର** ଏଠାରେ ଟାଇପ୍ କରନ୍ତୁ।`;
          quickReplies = ['ସମ୍ପର୍କ ନମ୍ବର ପ୍ରଦାନ କରନ୍ତୁ', 'ପରେ କଥା ହେବି'];
        } else if (activeLang === 'hi') {
          botResponseText = `हमारे प्रवेश काउंसलर से सीधे बात करने के लिए, कृपया अपना **नाम** और **10-अंकों का मोबाइल नंबर** यहां लिखें।`;
          quickReplies = ['संपर्क नंबर दें', 'बाद में बात करेंगे'];
        } else {
          botResponseText = `To connect directly with our human admission counselling desk, please reply with your **Full Name** and **10-digit Mobile Number**.`;
          quickReplies = ['Share My Contact', 'Cancel Handoff'];
        }
      }
      break;
    }

    default: {
      // General / FAQ Query fallback: check knowledge nodes
      const kn = await KnowledgeNode.findOne({
        isDemo: true,
        $or: [
          { tags: { $in: nlu.entities.matchedConcepts } },
          { 'question.en': { $regex: message.slice(0, 20), $options: 'i' } }
        ]
      });

      if (kn && kn.answer && kn.answer[activeLang]) {
        botResponseText = kn.answer[activeLang];
      } else {
        conversation.handoffRequested = true;
        if (activeLang === 'or') {
          botResponseText = `ମୁଁ ଆପଣଙ୍କ ପ୍ରଶ୍ନ ବୁଝିବାକୁ ଚେଷ୍ଟା କରୁଛି। ଆପଣ ଡିପ୍ଲୋମା ଶାଖା, ୧୦ମ ପରେ ଯୋଗ୍ୟତା, ଫିସ୍ କିମ୍ବା ହଷ୍ଟେଲ ବିଷୟରେ ଜାଣିବାକୁ ଚାହାଁନ୍ତି କି? ଦୟାକରି ତଳେ ଥିବା ଏକ ବିକଳ୍ପ ବାଛନ୍ତୁ:`;
          quickReplies = QUICK_REPLIES.or.greeting;
        } else if (activeLang === 'hi') {
          botResponseText = `मैं आपके प्रश्न को समझने का प्रयास कर रहा हूँ। क्या आप डिप्लोमा शाखाओं, 10वीं बाद पात्रता, फीस या हॉस्टल के बारे में जानना चाहते हैं? कृपया नीचे दिए गए विकल्पों में से चुनें:`;
          quickReplies = QUICK_REPLIES.hi.greeting;
        } else {
          botResponseText = `I am here to guide you with your diploma admissions. Would you like to check available branches, assess your eligibility, review sample fees, or speak with an admission counsellor?`;
          quickReplies = QUICK_REPLIES.en.greeting;
        }
      }
      break;
    }
  }

  // Append Mandatory Demo Disclaimer
  const disclaimer = DEMO_DISCLAIMERS[activeLang] || DEMO_DISCLAIMERS.en;
  botResponseText += disclaimer;

  // Record bot response in conversation
  conversation.messages.push({
    sender: 'BOT',
    text: botResponseText,
    language: activeLang,
    intent: nlu.intent,
    timestamp: new Date()
  });

  await conversation.save();

  // Dispatch automation event if human counsellor handoff was flagged
  if (conversation.handoffRequested) {
    localEventBus.dispatch('HANDOFF_REQUESTED', {
      sessionId,
      language: activeLang,
      intent: nlu.intent,
      urgency: 'HIGH',
      collegeCode: collegeCode || 'DRIEMS'
    });
  }

  return {
    sessionId,
    language: activeLang,
    intent: nlu.intent,
    reply: botResponseText,
    quickReplies,
    enquiryTrackingId: generatedEnquiry ? generatedEnquiry.trackingId : null,
    handoffRequested: conversation.handoffRequested,
    confidence: nlu.confidence
  };
};
