/**
 * ADMINATOR — Advanced Hindi–Odia Language Intelligence Engine
 * 
 * Provides:
 * - Native Script Detection (Odia Kalinga \u0B00-\u0B7F & Devanagari \u0900-\u097F)
 * - Phonetic Romanized Detection (Odlish & Hinglish)
 * - Code-Mixed Input Resolution (Technical English + Regional grammar)
 * - Phonetic Typo Tolerance & Terminology Normalization
 * - Unicode NFC Safe Normalization & Regional Numeral Conversion
 */

// Regional Phonetic Word Lexicons (Weighted for accurate scoring)
const ODIA_ROMAN_TOKENS = new Set([
  'mu', 'mote', 'mora', 'mor', 'tume', 'tumara', 'apana', 'apananka', 'apananku',
  'achi', 'achhi', 'achanti', 'kete', 'ketey', 'darkar', 'darkara', 'darakar',
  'namalekha', 'namlekha', 'dakhila', 'kemiti', 'kenta', 'kipari',
  'sahayata', 'janiba', 'jani', 'janibaku', 'chahuchi', 'chahunchi', 'chahunchhi',
  'sange', 'sahita', 'katha', 'habaku', 'pari', 'ku', 're', 'au',
  'mark', 'percentage', 'lagiba', 'miliba', 'hebi', 'kebata', 'neba', 'nebaku',
  'nomoskar', 'namaskara', 'kana', 'kuha', 'bataantu', 'sobuthu', 'bhala',
  'kouta', 'kouthu', 'kouthee', 'heini', 'heichi', 'dia', 'karantu', 'kariki',
  'sahayaka', 'chhatrabruti', 'barsha', 'pain', 'semister', 'taka', 'banebi',
  'habaku', 'habar', 'karibi', 'karuchi', 'sathire', 'shakha', 'jogyata'
]);

const HINDI_ROMAN_TOKENS = new Set([
  'mujhe', 'mera', 'meri', 'mere', 'aap', 'aapka', 'aapki', 'hum',
  'chahiye', 'chahie', 'chaiye', 'kitna', 'kitni', 'kitne', 'karein',
  'pravesh', 'daakhila', 'dakhila', 'jaankari', 'kaise', 'kya',
  'hota', 'hoti', 'hote', 'hai', 'hain', 'hoga', 'hogi', 'batao',
  'bataiye', 'bataye', 'madad', 'sahayata', 'ke', 'liye', 'se', 'baat', 'karni', 'karna',
  'milega', 'milegi', 'lagta', 'lagti', 'kharcha', 'namaste', 'shubh',
  'prabhat', 'shuru', 'kahan', 'kaun', 'kaunsi', 'kaisa', 'kaisi',
  'karenge', 'raha', 'rahi', 'rahe', 'hu', 'hoon', 'zaruri', 'tarika',
  'pata', 'sahayak', 'chhatravritti', 'padhaya', 'chaloo', 'shakhaen',
  'kijiye', 'saal', 'mahine', 'yogyata', 'mein', 'baare', 'bare', 'chahta', 'chahata', 'chahun'
]);

// Canonical Admission Terminology Mapping (Fuzzy / Phonetic Typo Tolerant)
const TERMINOLOGY_MAP = [
  // Fees
  { canonical: 'FEES', patterns: [/\b(fees?|fiss?|feez|kharch[aa]?|tuition|kharach)\b/i, /ଫିସ୍|ଖର୍ଚ୍ଚ|ଶୁଳ୍କ/, /फीस|खर्च|शुल्क/] },
  // Eligibility
  { canonical: 'ELIGIBILITY', patterns: [
    /\b(eligib(il)?ity|eligible|yogyat[aa]|jogyat[aa]|paatrata|miliba|milega|milegi|admission\s*heba|admission\s*hoga|seat\s*miliba|seat\s*milegi|lateral\s*miliba|lateral\s*milega)\b/i,
    /ଯୋଗ୍ୟତା|ପାତ୍ରତା|ନାମଲେଖା ହେବ|ସିଟ୍ ମିଳିବ|ଆଡମିଶନ ହେବ/,
    /योग्यता|पात्रता|एडमिशन होगा|सीट मिलेगी|दाखिला होगा/
  ] },
  // Admission / Apply
  { canonical: 'ADMISSION', patterns: [/\b(admiss?ion|edmiss?ion|adhmiss?ion|nam[a]?lekha|dakhil[aa]|pravesh|apply)\b/i, /ନାମଲେଖା|ଦାଖିଲା|ପ୍ରବେଶ/, /प्रवेश|दाखिला|नामांकन/] },
  // Hostel
  { canonical: 'HOSTEL', patterns: [/\b(hostels?|hastel|chatrabas|chhatrabas|boarding|room|mess)\b/i, /ହଷ୍ଟେଲ|ଛାତ୍ରାବାସ|ମେସ୍/, /हॉस्टल|छात्रावास|मेस/] },
  // Scholarships
  { canonical: 'SCHOLARSHIP', patterns: [/\b(scholarships?|skolrship|prerana|chhatrabruti|chhatravritti|bruti|waiver|discount)\b/i, /ସ୍କଲାରସିପ୍|ପ୍ରେରଣା|ଛାତ୍ରବୃତ୍ତି|ଛାଡ଼/, /छात्रवृत्ति|प्रेरणा|छूट/] },
  // Documents
  { canonical: 'DOCUMENTS', patterns: [/\b(documents?|certificates?|marksheet|kagajapatra|dastavej|pramanpatra)\b/i, /କାଗଜପତ୍ର|ପ୍ରମାଣପତ୍ର|ମାର୍କସିଟ୍/, /दस्तावेज|प्रमाणपत्र|अंकतालिका/] },
  // Human Counsellor Handoff
  { canonical: 'COUNSELLOR', patterns: [
    /\b(counsell?or|counselling|human|fon|phone|sahayaka|helpline|desk|call|call\s*me|call\s*back|talk\s*to)\b/i,
    /କାଉନସେଲର|ଫୋନ୍|ସହାୟକ|ହେଲ୍ପଲାଇନ୍|କଲ୍/,
    /काउंसलर|फोन|सहायक|हेल्पलाइन|\bकॉल\b(?!ेज)/
  ] },
  // Pathways
  { canonical: 'LATERAL_ENTRY', patterns: [/\b(lateral|direct\s*2nd\s*year|le|iti\s*lateral|lateral\s*entry)\b/i, /ଲାଟେରାଲ\s*ଏଣ୍ଟ୍ରି|ସିଧାସଳଖ\s*ଦ୍ୱିତୀୟ\s*ବର୍ଷ/, /लेटरल\s*एंट्री|सीधे\s*द्वितीय\s*वर्ष/] },
  { canonical: 'FIRST_YEAR', patterns: [/\b(first\s*year|1st\s*year|10th\s*pass|pehla\s*saal|prathama\s*barsha)\b/i, /ପ୍ରଥମ\s*ବର୍ଷ|୧୦ମ\s*ପାସ୍/, /प्रथम\s*वर्ष|10वीं\s*पास/] },
  // General Branch / Course Discovery
  { canonical: 'BRANCH_GENERAL', patterns: [/\b(branch(es)?|courses?|diploma\s*branch|trades?)\b/i, /ଶାଖା|ବ୍ରାଞ୍ଚ|କୋର୍ସ/, /शाखाएं?|ब्रांच|कोर्स/] },
  // Branches
  { canonical: 'BRANCH_MECH', patterns: [/\b(mech(anical)?|mechnical|machine|fitter|turner)\b/i, /ମେକାନିକାଲ୍|ଯାନ୍ତ୍ରିକ|ଫିଟର/, /मैकेनिकल|यांत्रिक|फ़िटर/] },
  { canonical: 'BRANCH_CIVIL', patterns: [/\b(civil|construction|building|draughtsman)\b/i, /ସିଭିଲ୍|ନିର୍ମାଣ/, /सिविल|निर्माण/] },
  { canonical: 'BRANCH_CSE', patterns: [/\b(cse|computer|comp\s*sc|software|coding|copa)\b/i, /କମ୍ପ୍ୟୁଟର|ସଫ୍ଟୱେୟାର୍/, /कंप्यूटर|सॉफ्टवेयर/] },
  { canonical: 'BRANCH_EE', patterns: [/\b(elect(rical)?|bijuli|power|electrician|wireman)\b/i, /ଇଲେକ୍ଟ୍ରିକାଲ୍|ବିଦ୍ୟୁତ୍|ଇଲେକ୍ଟ୍ରିସିଆନ୍/, /इलेक्ट्रिकल|विद्युत|इलेक्ट्रीशियन/] },
  { canonical: 'BRANCH_ETC', patterns: [/\b(etc|electronics|telecom)\b/i, /ଇଲେକ୍ଟ୍ରୋନିକ୍ସ|ଟେଲିକମ୍/, /इलेक्ट्रॉनिक्स|दूरसंचार/] },
  { canonical: 'BRANCH_AUTO', patterns: [/\b(auto(mobile)?|motor|vehicle|car)\b/i, /ଅଟୋମୋବାଇଲ୍|ଗାଡ଼ି/, /ऑटोमोबाइल|गाड़ी/] }
];

const ODIA_DIGITS = ['୦','୧','୨','୩','୪','୫','୬','୭','୮','୯'];
const DEVANAGARI_DIGITS = ['०','१','२','३','४','५','६','७','८','९'];

/**
 * Normalizes string using Unicode NFC standard, converts regional numerals to ASCII, and trims excess whitespace
 */
export const normalizeUnicode = (text = '') => {
  if (typeof text !== 'string') return '';
  let str = text.normalize('NFC').trim().replace(/\s+/g, ' ');
  for (let i = 0; i <= 9; i++) {
    str = str.replaceAll(ODIA_DIGITS[i], String(i));
    str = str.replaceAll(DEVANAGARI_DIGITS[i], String(i));
  }
  return str;
};

/**
 * Detects language and script from raw input
 * Returns: { language: 'en'|'or'|'hi', script: 'NATIVE_ODIA'|'NATIVE_HINDI'|'ROMANIZED_ODIA'|'ROMANIZED_HINDI'|'ENGLISH', isCodeMixed: Boolean, confidence: Number }
 */
export const detectLanguageAndScript = (rawText = '', fallbackLang = 'en') => {
  const text = normalizeUnicode(rawText);
  if (!text) {
    return { language: fallbackLang || 'en', script: 'ENGLISH', isCodeMixed: false, confidence: 1.0 };
  }

  // 1. Check Native Script Unicode Blocks
  const hasOdiaScript = /[\u0B00-\u0B7F]/.test(text);
  const hasHindiScript = /[\u0900-\u097F]/.test(text);
  const hasLatinScript = /[a-zA-Z]/.test(text);

  if (hasOdiaScript) {
    return {
      language: 'or',
      script: 'NATIVE_ODIA',
      isCodeMixed: hasLatinScript,
      confidence: hasLatinScript ? 0.90 : 0.98
    };
  }

  if (hasHindiScript) {
    return {
      language: 'hi',
      script: 'NATIVE_HINDI',
      isCodeMixed: hasLatinScript,
      confidence: hasLatinScript ? 0.90 : 0.98
    };
  }

  // 2. Evaluate Romanized Input (Odlish vs Hinglish vs English)
  const tokens = text.toLowerCase().split(/[^a-zA-Z0-9%]+/);
  let odiaScore = 0;
  let hindiScore = 0;

  for (const token of tokens) {
    if (ODIA_ROMAN_TOKENS.has(token)) odiaScore += 2;
    if (HINDI_ROMAN_TOKENS.has(token)) hindiScore += 2;
  }

  // Handle shared greetings based on context / fallback
  if (tokens.includes('namaskar') || tokens.includes('nomoskar')) {
    if (fallbackLang === 'hi') hindiScore += 3;
    else odiaScore += 3;
  }
  if (tokens.includes('pranam')) {
    if (fallbackLang === 'hi') hindiScore += 3;
    else odiaScore += 3;
  }

  const isCodeMixed = (odiaScore > 0 || hindiScore > 0) && tokens.length > 2;

  if (odiaScore > hindiScore && odiaScore >= 2) {
    return {
      language: 'or',
      script: 'ROMANIZED_ODIA',
      isCodeMixed,
      confidence: Math.min(0.70 + (odiaScore * 0.05), 0.95)
    };
  }

  if (hindiScore > odiaScore && hindiScore >= 2) {
    return {
      language: 'hi',
      script: 'ROMANIZED_HINDI',
      isCodeMixed,
      confidence: Math.min(0.70 + (hindiScore * 0.05), 0.95)
    };
  }

  // Fallback to active language if conversational cue exists
  if (fallbackLang === 'or' && (odiaScore >= 1 || tokens.includes('darkar') || tokens.includes('miliba') || tokens.includes('namaskar'))) {
    return {
      language: 'or',
      script: 'ROMANIZED_ODIA',
      isCodeMixed: true,
      confidence: 0.85
    };
  }

  if (fallbackLang === 'hi' && (hindiScore >= 1 || tokens.includes('chahiye') || tokens.includes('milega') || tokens.includes('namaste'))) {
    return {
      language: 'hi',
      script: 'ROMANIZED_HINDI',
      isCodeMixed: true,
      confidence: 0.85
    };
  }

  return {
    language: 'en',
    script: 'ENGLISH',
    isCodeMixed: false,
    confidence: 0.90
  };
};

/**
 * Normalizes input text and extracts canonical admission concepts and entities
 */
export const extractIntentAndEntities = (rawText = '', fallbackLang = 'en') => {
  const text = normalizeUnicode(rawText);
  const langDetection = detectLanguageAndScript(text, fallbackLang);
  let activeLanguage = langDetection.language || fallbackLang;

  // Extract Canonical Concept Tags
  const matchedConcepts = new Set();
  for (const term of TERMINOLOGY_MAP) {
    for (const pattern of term.patterns) {
      if (pattern.test(text)) {
        matchedConcepts.add(term.canonical);
        break;
      }
    }
  }

  // Extract Percentage / Marks (e.g. "58%", "62.5 percent", "65 mark", "72 %")
  let extractedPercentage = null;
  const percentageMatch = text.match(/(\d{1,2}(\.\d{1,2})?)\s*(%|percent(age)?|mark[s]?|pratishat)\b/i) || text.match(/(\d{1,2}(\.\d{1,2})?)\s*%/);
  if (percentageMatch) {
    const val = parseFloat(percentageMatch[1]);
    if (val >= 0 && val <= 100) extractedPercentage = val;
  }

  // Extract Branch
  let extractedBranch = null;
  if (matchedConcepts.has('BRANCH_MECH')) extractedBranch = 'MECH';
  else if (matchedConcepts.has('BRANCH_CIVIL')) extractedBranch = 'CIVIL';
  else if (matchedConcepts.has('BRANCH_CSE')) extractedBranch = 'CSE';
  else if (matchedConcepts.has('BRANCH_EE')) extractedBranch = 'EE';
  else if (matchedConcepts.has('BRANCH_ETC')) extractedBranch = 'ETC';
  else if (matchedConcepts.has('BRANCH_AUTO')) extractedBranch = 'AUTO';

  // Extract Pathway
  let extractedPathway = null;
  if (matchedConcepts.has('LATERAL_ENTRY')) extractedPathway = 'LATERAL_ENTRY';
  else if (matchedConcepts.has('FIRST_YEAR')) extractedPathway = 'FIRST_YEAR';

  // Check greeting pattern (Latin, Odia, Devanagari)
  const isGreeting = /^(hi|hello|hey|namaskar|namaste|nomoskar|namaskara|pranam)\b/i.test(text) ||
    /^(ନମସ୍କାର|ପ୍ରଣାମ|ଜୟ ଜଗନ୍ନାଥ)/.test(text) ||
    /^(नमस्ते|प्रणाम|नमस्कार)/.test(text);

  // Check Language Switch pattern
  let isLanguageSwitch = false;
  let languageSwitchTarget = null;
  if (
    /(?:switch to|speak in|talk in|change to|change language to)\s*(hindi|odia|english)\b/i.test(text) ||
    /(?:हिन्दी में बात|हिंदी में बात|हिन्दी बोलो|हिंदी बोलो|हिन्दी में बात करना|हिंदी में बात करना)/.test(text) ||
    /(?:ଓଡ଼ିଆରେ କଥା|ଓଡ଼ିଆରେ କୁହ|ଓଡ଼ିଆ କୁହ|ଓଡ଼ିଆରେ କଥା ହେବାକୁ)/.test(text) ||
    /\b(?:hindi me baat|hindi me batao|odia re katha|odia re kuha)\b/i.test(text) ||
    /^switch\s*to\s*(english|hindi|odia)/i.test(text)
  ) {
    isLanguageSwitch = true;
    if (/hindi|हिन्दी|हिंदी/i.test(text)) languageSwitchTarget = 'hi';
    else if (/odia|ଓଡ଼ିଆ|oriya/i.test(text)) languageSwitchTarget = 'or';
    else if (/english|ଇଂରାଜୀ|अंग्रेजी/i.test(text)) languageSwitchTarget = 'en';
  }

  // Determine Primary Intent
  let intent = 'GENERAL_QUERY';

  if (isLanguageSwitch && languageSwitchTarget) {
    intent = 'LANGUAGE_SWITCH';
    activeLanguage = languageSwitchTarget;
  } else if (matchedConcepts.has('COUNSELLOR')) {
    intent = 'COUNSELLOR_HANDOFF';
  } else if (matchedConcepts.has('SCHOLARSHIP')) {
    intent = 'SCHOLARSHIP_QUERY';
  } else if (extractedPercentage !== null) {
    intent = 'ELIGIBILITY_CHECK';
  } else if (extractedBranch && /\b(job|placement|scope|salary|career|duration|kete\s*barsha|kitne\s*saal|kitna\s*saal|subject)\b/i.test(text)) {
    intent = 'BRANCH_DISCOVERY';
  } else if (matchedConcepts.has('ELIGIBILITY') || /\b(percentage|mark|marks|criteria|cutoff|cut off|jogyata|yogyata|minimum mark|age|qualif)\b/i.test(text) || /ଯୋଗ୍ୟତା|ପାତ୍ରତା|ପ୍ରତିଶତ/.test(text)) {
    intent = 'ELIGIBILITY_QUERY';
  } else if (matchedConcepts.has('FEES') && matchedConcepts.has('HOSTEL')) {
    if (extractedBranch || /\b(including|with|aur|au|and|sath|sahita|sange)\b/i.test(text) || /ସହିତ|ସାଙ୍ଗେ|ଏବଂ|ଓ|तथा|और/.test(text)) {
      intent = 'FEE_AND_HOSTEL_QUERY';
    } else {
      intent = 'HOSTEL_QUERY';
    }
  } else if (matchedConcepts.has('HOSTEL')) {
    intent = 'HOSTEL_QUERY';
  } else if (matchedConcepts.has('FEES')) {
    intent = 'FEE_QUERY';
  } else if (matchedConcepts.has('DOCUMENTS')) {
    intent = 'DOCUMENTS_QUERY';
  } else if (extractedBranch) {
    intent = 'BRANCH_DISCOVERY';
  } else if (isGreeting) {
    intent = 'GREETING';
  } else if (matchedConcepts.has('BRANCH_GENERAL') || matchedConcepts.has('ADMISSION')) {
    intent = 'BRANCH_DISCOVERY';
  }

  return {
    rawText,
    normalizedText: text,
    language: activeLanguage,
    script: langDetection.script,
    isCodeMixed: langDetection.isCodeMixed,
    confidence: langDetection.confidence,
    intent,
    entities: {
      branchCode: extractedBranch,
      pathway: extractedPathway,
      percentage: extractedPercentage,
      includeHostel: matchedConcepts.has('HOSTEL'),
      matchedConcepts: Array.from(matchedConcepts),
      languageSwitchTarget
    }
  };
};
