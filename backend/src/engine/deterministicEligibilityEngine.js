/**
 * ADMINATOR — Deterministic Eligibility Evaluator Engine
 * Pure functional, standalone evaluator. ZERO External AI dependency. ZERO Hallucination.
 * 
 * Evaluates candidate qualifications against institutional admission rules.
 * Outputs: ELIGIBLE | NOT_ELIGIBLE | NEEDS_MANUAL_VERIFICATION
 */

export const ELIGIBILITY_VERDICTS = {
  ELIGIBLE: 'ELIGIBLE',
  NOT_ELIGIBLE: 'NOT_ELIGIBLE',
  NEEDS_MANUAL_VERIFICATION: 'NEEDS_MANUAL_VERIFICATION'
};

export const ALIGNED_ITI_TRADES = {
  MECH: ['FITTER', 'TURNER', 'MACHINIST', 'WELDER', 'MECHANIC_MOTOR_VEHICLE'],
  CIVIL: ['DRAUGHTSMAN_CIVIL', 'SURVEYOR'],
  CSE: ['COPA', 'INFORMATION_TECHNOLOGY', 'COMPUTER_HARDWARE_NETWORK_MAINTENANCE'],
  EE: ['ELECTRICIAN', 'WIREMAN'],
  ETC: ['ELECTRONIC_MECHANIC', 'INSTRUMENT_MECHANIC'],
  AUTO: ['MECHANIC_MOTOR_VEHICLE', 'DIESEL_MECHANIC', 'FITTER']
};

/**
 * Normalizes ITI trade string for comparison (e.g. "fitter", "Fitter", "FITTER" -> "FITTER")
 */
export const normalizeItiTrade = (tradeStr) => {
  if (!tradeStr || typeof tradeStr !== 'string') return '';
  return tradeStr.trim().toUpperCase().replace(/[\s-]+/g, '_');
};

/**
 * Evaluates student eligibility against branch rule.
 * 
 * @param {Object} candidate - Student qualification profile
 * @param {Object} rule - Configurable rule object from DB
 * @param {string} lang - Preferred language ('en', 'or', 'hi')
 * @returns {Object} Evaluation report { verdict, isEligible, explanations, ruleEvaluations }
 */
export const evaluateEligibility = (candidate = {}, rule = {}, lang = 'en') => {
  const evaluations = [];
  const pathway = rule.pathway || candidate.pathway || 'FIRST_YEAR';
  const category = (candidate.category || 'GENERAL').toUpperCase();
  const aggregatePercentage = Number(candidate.aggregatePercentage || 0);

  // 1. Check Age (Minimum 14 years)
  if (candidate.ageYears !== undefined && candidate.ageYears !== null) {
    const minAge = rule.minAgeYears || 14;
    const agePassed = candidate.ageYears >= minAge;
    evaluations.push({
      ruleName: 'MIN_AGE_CRITERIA',
      passed: agePassed,
      required: `>= ${minAge} years`,
      actual: `${candidate.ageYears} years`,
      detail: {
        en: agePassed ? `Age ${candidate.ageYears} meets minimum requirement (>= ${minAge} years).` : `Candidate age ${candidate.ageYears} is below minimum requirement of ${minAge} years.`,
        or: agePassed ? `ପ୍ରାର୍ଥୀଙ୍କ ବୟସ ${candidate.ageYears} ବର୍ଷ ଧାର୍ଯ୍ୟ ସର୍ବନିମ୍ନ ବୟସ (${minAge} ବର୍ଷ) ଅନୁସାରେ ଠିକ୍ ଅଛି।` : `ପ୍ରାର୍ଥୀଙ୍କ ବୟସ ${candidate.ageYears} ବର୍ଷ ସର୍ବନିମ୍ନ ବୟସ ସୀମା (${minAge} ବର୍ଷ) ଠାରୁ କମ୍।`,
        hi: agePassed ? `उम्मीदवार की आयु ${candidate.ageYears} वर्ष न्यूनतम आवश्यकता (${minAge} वर्ष) के अनुरूप है।` : `उम्मीदवार की आयु ${candidate.ageYears} वर्ष न्यूनतम आयु (${minAge} वर्ष) से कम है।`
      }
    });
  }

  // 2. Minimum Percentage Check
  const isReserved = ['SC', 'ST'].includes(category);
  const minRequiredPercentage = isReserved
    ? (rule.minPercentageReserved ?? 30.0)
    : (rule.minPercentageGeneral ?? 35.0);

  const percentagePassed = aggregatePercentage >= minRequiredPercentage;
  evaluations.push({
    ruleName: 'MINIMUM_AGGREGATE_PERCENTAGE',
    passed: percentagePassed,
    required: `>= ${minRequiredPercentage}% (${isReserved ? 'SC/ST' : 'General/SEBC/OBC'})`,
    actual: `${aggregatePercentage}%`,
    detail: {
      en: percentagePassed
        ? `Secured ${aggregatePercentage}%, meeting the minimum ${minRequiredPercentage}% requirement.`
        : `Secured ${aggregatePercentage}%, which is below the minimum required ${minRequiredPercentage}%.`,
      or: percentagePassed
        ? `ପ୍ରାର୍ଥୀ ${aggregatePercentage}% ମାର୍କ ରଖିଛନ୍ତି, ଯାହା ସର୍ବନିମ୍ନ ${minRequiredPercentage}% ମାନଦଣ୍ଡ ପୂରଣ କରୁଛି।`
        : `ପ୍ରାର୍ଥୀ ${aggregatePercentage}% ମାର୍କ ରଖିଛନ୍ତି, ଯାହା ଆବଶ୍ୟକୀୟ ସର୍ବନିମ୍ନ ${minRequiredPercentage}% ଠାରୁ କମ୍।`,
      hi: percentagePassed
        ? `प्राप्तांक ${aggregatePercentage}% है, जो न्यूनतम ${minRequiredPercentage}% की आवश्यकता को पूरा करता है।`
        : `प्राप्तांक ${aggregatePercentage}% है, जो न्यूनतम आवश्यक ${minRequiredPercentage}% से कम है।`
    }
  });

  // 3. Pathway-Specific Evaluation
  if (pathway === 'FIRST_YEAR') {
    // 10th Qualification Evaluation
    const subjects = candidate.subjects || {};
    const mathPassed = candidate.passedMathAndScience !== undefined ? Boolean(candidate.passedMathAndScience) : Boolean(subjects.mathematics);
    const sciencePassed = candidate.passedMathAndScience !== undefined ? Boolean(candidate.passedMathAndScience) : Boolean(subjects.science);
    const mandatoryPassed = mathPassed && sciencePassed;

    evaluations.push({
      ruleName: 'MANDATORY_SUBJECTS_10TH',
      passed: mandatoryPassed,
      required: 'Pass in Mathematics and Science',
      actual: `Maths: ${mathPassed ? 'Pass' : 'Fail'}, Science: ${sciencePassed ? 'Pass' : 'Fail'}`,
      detail: {
        en: mandatoryPassed
          ? 'Passed both mandatory subjects (Mathematics and Science) in 10th examination.'
          : `Mandatory subject requirement not met (Mathematics: ${mathPassed ? 'Pass' : 'Fail'}, Science: ${sciencePassed ? 'Pass' : 'Fail'}).`,
        or: mandatoryPassed
          ? '୧୦ମ ଶ୍ରେଣୀରେ ଉଭୟ ବାଧ୍ୟତାମୂଳକ ବିଷୟ (ଗଣିତ ଏବଂ ବିଜ୍ଞାନ) ରେ ଉତ୍ତୀର୍ଣ୍ଣ ହୋଇଛନ୍ତି।'
          : `ବାଧ୍ୟତାମୂଳକ ବିଷୟ ସର୍ତ୍ତ ପୂରଣ ହୋଇନାହିଁ (ଗଣିତ: ${mathPassed ? 'ପାସ୍' : 'ଫେଲ୍'}, ବିଜ୍ଞାନ: ${sciencePassed ? 'ପାସ୍' : 'ଫେଲ୍'})।`,
        hi: mandatoryPassed
          ? '10वीं परीक्षा में दोनों अनिवार्य विषयों (गणित और विज्ञान) में उत्तीर्ण हैं।'
          : `अनिवार्य विषय आवश्यकता पूरी नहीं हुई (गणित: ${mathPassed ? 'उत्तीर्ण' : 'अनुत्तीर्ण'}, विज्ञान: ${sciencePassed ? 'उत्तीर्ण' : 'अनुत्तीर्ण'})।`
      }
    });

  } else if (pathway === 'LATERAL_ENTRY') {
    // Lateral Entry Evaluation (12th Science / 12th Vocational / 2-Year ITI)
    const examType = candidate.examType || (candidate.qualification && candidate.qualification.examType);
    const branchCode = (rule.branchCode || candidate.branchCode || '').toUpperCase();
    const allowedItiTrades = rule.eligibleItiTrades && rule.eligibleItiTrades.length > 0
      ? rule.eligibleItiTrades.map(t => t.toUpperCase())
      : (ALIGNED_ITI_TRADES[branchCode] || []);

    if (examType === '12TH_SCIENCE') {
      const pcmPassed = candidate.subjects ? Boolean(candidate.subjects.mathematics && candidate.subjects.physics) : true;
      evaluations.push({
        ruleName: 'LATERAL_12TH_SCIENCE_PCM',
        passed: pcmPassed,
        required: '12th Science with Physics, Chemistry & Mathematics',
        actual: pcmPassed ? 'Passed with PCM' : 'PCM requirement not verified',
        detail: {
          en: pcmPassed
            ? '12th Science with Physics, Chemistry and Mathematics qualifies for Lateral Entry diploma.'
            : '12th Science must include Physics and Mathematics for direct 2nd-year entry.',
          or: pcmPassed
            ? '୧୨ଶ ବିଜ୍ଞାନ (PCM) ପ୍ରାର୍ଥୀ ଲାଟେରାଲ ଏଣ୍ଟ୍ରି ଡିପ୍ଲୋମା ପାଇଁ ଯୋଗ୍ୟ।'
            : 'ସିଧାସଳଖ ୨ୟ ବର୍ଷ ନାମଲେଖା ପାଇଁ ୧୨ଶ ବିଜ୍ଞାନରେ ପଦାର୍ଥ ବିଜ୍ଞାନ ଏବଂ ଗଣିତ ରହିବା ଆବଶ୍ୟକ।',
          hi: pcmPassed
            ? '12वीं साइंस (PCM) उम्मीदवार लेटरल एंट्री डिप्लोमा के लिए पात्र हैं।'
            : 'सीधे द्वितीय वर्ष में प्रवेश के लिए 12वीं साइंस में भौतिकी और गणित होना अनिवार्य है।'
        }
      });

    } else if (examType === 'ITI') {
      const candidateTrade = normalizeItiTrade(candidate.itiTrade || (candidate.qualification && candidate.qualification.itiTrade));
      const isTradeAligned = allowedItiTrades.includes(candidateTrade);

      evaluations.push({
        ruleName: 'LATERAL_ITI_TRADE_ALIGNMENT',
        passed: isTradeAligned,
        required: `Approved Trade for ${branchCode}: [${allowedItiTrades.join(', ')}]`,
        actual: candidateTrade || 'NOT_SPECIFIED',
        detail: {
          en: isTradeAligned
            ? `ITI trade '${candidateTrade}' is officially aligned with ${branchCode} Engineering.`
            : `ITI trade '${candidateTrade || 'Unspecified'}' is not directly mapped to ${branchCode}. Eligible trades are: ${allowedItiTrades.join(', ')}.`,
          or: isTradeAligned
            ? `ITI ଟ୍ରେଡ୍ '${candidateTrade}' ସିଧାସଳଖ ${branchCode} ଇଞ୍ଜିନିୟରିଂ ସହିତ ମେଳ ଖାଉଛି।`
            : `ITI ଟ୍ରେଡ୍ '${candidateTrade || 'ଅସ୍ପଷ୍ଟ'}' ସିଧାସଳଖ ${branchCode} ପାଇଁ ଉଦ୍ଦିଷ୍ଟ ନୁହେଁ। ଅନୁମୋଦିତ ଟ୍ରେଡ୍: ${allowedItiTrades.join(', ')}।`,
          hi: isTradeAligned
            ? `आईटीआई ट्रेड '${candidateTrade}' सीधे ${branchCode} इंजीनियरिंग से मेल खाता है।`
            : `आईटीआई ट्रेड '${candidateTrade || 'अनिर्दिष्ट'}' सीधे ${branchCode} के लिए मान्य नहीं है। मान्य ट्रेड: ${allowedItiTrades.join(', ')}।`
        }
      });

    } else if (examType === '12TH_VOCATIONAL') {
      // 12th Vocational generally needs manual institutional verification
      evaluations.push({
        ruleName: 'LATERAL_12TH_VOCATIONAL_TRADE',
        passed: true,
        needsVerification: true,
        required: 'Technical Vocational Trade verification',
        actual: '12th Vocational Passed',
        detail: {
          en: '12th Vocational qualification is conditionally accepted pending trade syllabus equivalence verification.',
          or: '୧୨ଶ ଧନ୍ଦାମୂଳକ ଶିକ୍ଷା (Vocational) ର ଟ୍ରେଡ୍ ଯାଞ୍ଚ ସାପେକ୍ଷରେ ଗ୍ରହଣଯୋଗ୍ୟ।',
          hi: '12वीं वोकेशनल योग्यता ट्रेड पाठ्यक्रम सत्यापन के अधीन सशर्त स्वीकार्य है।'
        }
      });
    } else {
      // Unspecified qualification for lateral entry
      evaluations.push({
        ruleName: 'LATERAL_QUALIFICATION_TYPE',
        passed: false,
        required: '12th Science (PCM), 12th Vocational, or 2-Year ITI',
        actual: examType || 'UNKNOWN',
        detail: {
          en: 'Lateral entry requires 12th Science (PCM), 12th Vocational, or a 2-Year ITI trade.',
          or: 'ଲାଟେରାଲ ଏଣ୍ଟ୍ରି ପାଇଁ ୧୨ଶ ବିଜ୍ଞାନ, ୧୨ଶ ଧନ୍ଦାମୂଳକ କିମ୍ବା ୨-ବର୍ଷିଆ ITI ପାସ୍ ହୋଇଥିବା ଆବଶ୍ୟକ।',
          hi: 'लेटरल एंट्री के लिए 12वीं साइंस (PCM), 12वीं वोकेशनल या 2 वर्षीय आईटीआई उत्तीर्ण होना आवश्यक है।'
        }
      });
    }
  }

  // Final Verdict Formulation
  const hasFailedRules = evaluations.some(e => e.passed === false);
  const hasVerificationFlags = evaluations.some(e => e.needsVerification === true);

  let verdict = ELIGIBILITY_VERDICTS.ELIGIBLE;
  if (hasFailedRules) {
    verdict = ELIGIBILITY_VERDICTS.NOT_ELIGIBLE;
  } else if (hasVerificationFlags) {
    verdict = ELIGIBILITY_VERDICTS.NEEDS_MANUAL_VERIFICATION;
  }

  // Plain-Language Summary Formulation
  const langKey = ['en', 'or', 'hi'].includes(lang) ? lang : 'en';
  let plainReason = '';

  if (verdict === ELIGIBILITY_VERDICTS.ELIGIBLE) {
    plainReason = langKey === 'or'
      ? `ବଧାଇ! ପ୍ରାର୍ଥୀ ସମସ୍ତ ଡେମୋ ନାମଲେଖା ଯୋଗ୍ୟତା ସର୍ତ୍ତ (${pathway === 'FIRST_YEAR' ? '୧୦ମ ମାର୍କ ଏବଂ ବାଧ୍ୟତାମୂଳକ ବିଷୟ' : 'ଲାଟେରାଲ ଏଣ୍ଟ୍ରି ମାପଦଣ୍ଡ'}) ସଫଳତାର ସହ ପୂରଣ କରିଛନ୍ତି।`
      : langKey === 'hi'
      ? `बधाई हो! उम्मीदवार ने सभी डेमो प्रवेश योग्यता शर्तों (${pathway === 'FIRST_YEAR' ? '10वीं अंक और अनिवार्य विषय' : 'लेटरल एंट्री मानदंड'}) को सफलतापूर्वक पूरा किया है।`
      : `Eligible! The candidate successfully satisfies all admission criteria (${pathway === 'FIRST_YEAR' ? '10th aggregate percentage & mandatory subjects' : 'lateral entry trade alignment'}).`;
  } else if (verdict === ELIGIBILITY_VERDICTS.NEEDS_MANUAL_VERIFICATION) {
    plainReason = langKey === 'or'
      ? 'ପ୍ରାର୍ଥୀଙ୍କ ଶିକ୍ଷାଗତ ଯୋଗ୍ୟତା ସାଧାରଣତଃ ଗ୍ରହଣୀୟ, କିନ୍ତୁ କାଗଜପତ୍ର ଏବଂ ଟ୍ରେଡ୍ ସିଲାବସ୍ ସତ୍ୟାପନ ପାଇଁ କଲେଜ କାଉନସେଲରଙ୍କ ସମୀକ୍ଷା ଆବଶ୍ୟକ।'
      : langKey === 'hi'
      ? 'उम्मीदवार की योग्यता सामान्यतः स्वीकार्य है, लेकिन दस्तावेज और ट्रेड पाठ्यक्रम सत्यापन हेतु कॉलेज काउंसलर की समीक्षा आवश्यक है।'
      : 'Conditionally eligible. Academic profile is acceptable pending counsellor verification of trade syllabus and documents.';
  } else {
    // Collect specific failure details
    const failedMessages = evaluations.filter(e => !e.passed).map(e => e.detail[langKey]).join(' ');
    plainReason = langKey === 'or'
      ? `ଦୁଃଖିତ, ପ୍ରାର୍ଥୀ ସମସ୍ତ ଯୋଗ୍ୟତା ମାନଦଣ୍ଡ ପୂରଣ କରୁନାହାଁନ୍ତି: ${failedMessages}`
      : langKey === 'hi'
      ? `खेद है, उम्मीदवार सभी पात्रता मानदंडों को पूरा नहीं करते हैं: ${failedMessages}`
      : `Not eligible based on current criteria: ${failedMessages}`;
  }

  return {
    verdict,
    isEligible: verdict === ELIGIBILITY_VERDICTS.ELIGIBLE,
    needsVerification: verdict === ELIGIBILITY_VERDICTS.NEEDS_MANUAL_VERIFICATION,
    pathway,
    ruleVersion: rule.ruleVersion || '2025.1',
    plainReason,
    evaluations: evaluations.map(e => ({
      ruleName: e.ruleName,
      passed: e.passed,
      required: e.required,
      actual: e.actual,
      explanation: e.detail[langKey]
    })),
    disclaimer: '[DEMO EVALUATION - BASED ON SAMPLE ADMISSION RULES - NOT OFFICIAL SAMS NOTIFICATION]'
  };
};
