import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertTriangle, HelpCircle, Calculator, Sparkles } from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig.js';

export const EligibilityModal = ({ isOpen, onClose, currentLanguage = 'en', onApplyToChat }) => {
  const [examType, setExamType] = useState('10TH');
  const [percentage, setPercentage] = useState(60);
  const [ageYears, setAgeYears] = useState(16);
  const [branchCode, setBranchCode] = useState('MECH');
  const [pathway, setPathway] = useState('FIRST_YEAR');
  const [category, setCategory] = useState('GENERAL');
  const [itiTrade, setItiTrade] = useState('FITTER');
  const [mathSciencePassed, setMathSciencePassed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const modalRef = useRef(null);
  const triggerElementRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement;

      // Focus first focusable element inside modal
      const timer = setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusable = Array.from(
            modalRef.current.querySelectorAll(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          );

          if (focusable.length === 0) return;

          const firstEl = focusable[0];
          const lastEl = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstEl) {
              e.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl) {
              e.preventDefault();
              firstEl.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
          triggerElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalTranslations = {
    en: {
      title: "Diploma Eligibility Evaluator",
      subtitle: "100% Deterministic Engine • Zero Hallucination",
      pathway: "Admission Pathway",
      firstYear: "1st Year (3 Years)",
      lateralEntry: "Lateral Entry (2 Years)",
      qualifyingExam: "Qualifying Exam",
      exam10th: "10th Standard / Matriculation",
      examIti: "ITI (2-Year Trade)",
      exam12thSci: "+2 Science (PCM)",
      exam12thVoc: "+2 Vocational",
      category: "Category",
      catGen: "General / Unreserved (GEN)",
      catSc: "Scheduled Caste (SC)",
      catSt: "Scheduled Tribe (ST)",
      catSebc: "SEBC / OBC",
      itiTrade: "ITI Trade Passed",
      targetBranch: "Target Diploma Branch",
      percentage: "Aggregate Percentage",
      candidateAge: "Candidate Age",
      ageYearsSuffix: "Years",
      minAgeWarning: "Underage: Minimum age for diploma admission is 14 years.",
      mathSciCheck: "Passed Mathematics and Science in Qualifying Examination",
      evaluateBtn: "Evaluate Eligibility Now",
      evaluating: "Evaluating...",
      verdictLabel: "Verdict",
      verdictEligible: "ELIGIBLE FOR ADMISSION",
      verdictManual: "NEEDS MANUAL VERIFICATION",
      verdictNotEligible: "NOT ELIGIBLE",
      sendChat: "Send Result to Admission Assistant 💬",
      branches: {
        MECH: "Mechanical Engineering (MECH)",
        CIVIL: "Civil Engineering (CIVIL)",
        CSE: "Computer Science & Engineering (CSE)",
        EE: "Electrical Engineering (EE)",
        ETC: "Electronics & Telecommunication (ETC)",
        AUTO: "Automobile Engineering (AUTO)"
      }
    },
    or: {
      title: "ଡିପ୍ଲୋମା ଯୋଗ୍ୟତା ମୂଲ୍ୟାୟନକାରୀ",
      subtitle: "୧୦୦% ନିର୍ଣ୍ଣାୟକ ଇଞ୍ଜିନ୍ • ଶୂନ୍ୟ-ବିଭ୍ରାଟ",
      pathway: "ନାମଲେଖା ପଥ (Admission Pathway)",
      firstYear: "ପ୍ରଥମ ବର୍ଷ (୩ ବର୍ଷ)",
      lateralEntry: "ଲାଟେରାଲ ଏଣ୍ଟ୍ରି (୨ ବର୍ଷ)",
      qualifyingExam: "ଯୋଗ୍ୟତା ପରୀକ୍ଷା",
      exam10th: "୧୦ମ ଶ୍ରେଣୀ / ମ୍ୟାଟ୍ରିକ୍ (10th)",
      examIti: "ITI (୨-ବର୍ଷିଆ ଟ୍ରେଡ୍)",
      exam12thSci: "+୨ ବିଜ୍ଞାନ (PCM)",
      exam12thVoc: "+୨ ଧନ୍ଦାମୂଳକ (Vocational)",
      category: "ବର୍ଗ (Category)",
      catGen: "ସାଧାରଣ / ଅଣ-ସଂରକ୍ଷିତ (General)",
      catSc: "ଅନୁସୂଚିତ ଜାତି (SC)",
      catSt: "ଅନୁସୂଚିତ ଜନଜାତି (ST)",
      catSebc: "ଏସଇବିସି / ଓବିସି (SEBC/OBC)",
      itiTrade: "ଉତ୍ତୀର୍ଣ୍ଣ ITI ଟ୍ରେଡ୍",
      targetBranch: "ଇଚ୍ଛିତ ଡିପ୍ଲୋମା ଶାଖା (Branch)",
      percentage: "ସମୁଦାୟ ପ୍ରତିଶତ (Percentage)",
      candidateAge: "ପ୍ରାର୍ଥୀଙ୍କ ବୟସ",
      ageYearsSuffix: "ବର୍ଷ",
      minAgeWarning: "କମ୍ ବୟସ: ଡିପ୍ଲୋମା ନାମଲେଖା ପାଇଁ ସର୍ବନିମ୍ନ ବୟସ ୧୪ ବର୍ଷ ଅଟେ।",
      mathSciCheck: "ଯୋଗ୍ୟତା ପରୀକ୍ଷାରେ ଗଣିତ ଏବଂ ବିଜ୍ଞାନରେ ଉତ୍ତୀର୍ଣ୍ଣ",
      evaluateBtn: "ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରନ୍ତୁ",
      evaluating: "ମୂଲ୍ୟାୟନ ଚାଲିଛି...",
      verdictLabel: "ସ୍ଥିତି",
      verdictEligible: "ନାମଲେଖା ପାଇଁ ଯୋଗ୍ୟ",
      verdictManual: "ଅଧିକ ଯାଞ୍ଚ ଆବଶ୍ୟକ",
      verdictNotEligible: "ଯୋଗ୍ୟ ନୁହଁନ୍ତି",
      sendChat: "ଏହି ଫଳାଫଳ ଆଡମିଶନ ସହାୟକଙ୍କୁ ପଠାନ୍ତୁ 💬",
      branches: {
        MECH: "ମେକାନିକାଲ୍ ଇଞ୍ଜିନିୟରିଂ (MECH)",
        CIVIL: "ସିଭିଲ୍ ଇଞ୍ଜିନିୟରିଂ (CIVIL)",
        CSE: "କମ୍ପ୍ୟୁଟର ସାଇନ୍ସ ଏବଂ ଇଞ୍ଜିନିୟରିଂ (CSE)",
        EE: "ଇଲେକ୍ଟ୍ରିକାଲ୍ ଇଞ୍ଜିନିୟରିଂ (EE)",
        ETC: "ଇଲେକ୍ଟ୍ରୋନିକ୍ସ ଏବଂ ଟେଲିକମ୍ୟୁନିକେସନ୍ (ETC)",
        AUTO: "ଅଟୋମୋବାଇଲ୍ ଇଞ୍ଜିନିୟରିଂ (AUTO)"
      }
    },
    hi: {
      title: "डिप्लोमा पात्रता मूल्यांकनकर्ता",
      subtitle: "100% सटीक नियम-आधारित मूल्यांकन • शून्य-भ्रांति",
      pathway: "प्रवेश माध्यम (Admission Pathway)",
      firstYear: "प्रथम वर्ष (3 वर्ष)",
      lateralEntry: "लेटरल एंट्री (2 वर्ष)",
      qualifyingExam: "योग्यता परीक्षा",
      exam10th: "10वीं कक्षा / मैट्रिक",
      examIti: "आईटीआई (2-वर्षीय ट्रेड)",
      exam12thSci: "+2 विज्ञान (PCM)",
      exam12thVoc: "+2 वोकेशनल",
      category: "वर्ग (Category)",
      catGen: "सामान्य / अनारक्षित (General)",
      catSc: "अनुसूचित जाति (SC)",
      catSt: "अनुसूचित जनजाति (ST)",
      catSebc: "एसईबीसी / ओबीसी (SEBC/OBC)",
      itiTrade: "उत्तीर्ण आईटीआई ट्रेड",
      targetBranch: "वांछित डिप्लोमा शाखा (Branch)",
      percentage: "कुल प्रतिशत (Percentage)",
      candidateAge: "उम्मीदवार की आयु",
      ageYearsSuffix: "वर्ष",
      minAgeWarning: "कम आयु: डिप्लोमा प्रवेश हेतु न्यूनतम आयु 14 वर्ष अनिवार्य है।",
      mathSciCheck: "योग्यता परीक्षा में गणित और विज्ञान में उत्तीर्ण",
      evaluateBtn: "पात्रता जांचें",
      evaluating: "मूल्यांकन जारी है...",
      verdictLabel: "स्थिति",
      verdictEligible: "प्रवेश हेतु पात्र",
      verdictManual: "अतिरिक्त सत्यापन आवश्यक",
      verdictNotEligible: "अपात्र",
      sendChat: "यह परिणाम प्रवेश सहायक को भेजें 💬",
      branches: {
        MECH: "मैकेनिकल इंजीनियरिंग (MECH)",
        CIVIL: "सिविल इंजीनियरिंग (CIVIL)",
        CSE: "कंप्यूटर साइंस एंड इंजीनियरिंग (CSE)",
        EE: "इलेक्ट्रिकल इंजीनियरिंग (EE)",
        ETC: "इलेक्ट्रॉनिक्स एंड टेलीकम्युनिकेशन (ETC)",
        AUTO: "ऑटोमोबाइल इंजीनियरिंग (AUTO)"
      }
    }
  };

  const mt = modalTranslations[currentLanguage] || modalTranslations.en;

  const handleEvaluate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        branchCode,
        pathway,
        language: currentLanguage,
        candidate: {
          qualifyingExam: examType,
          aggregatePercentage: Number(percentage),
          ageYears: Number(ageYears),
          passedMathAndScience: mathSciencePassed,
          category,
          itiTrade: examType === 'ITI' ? itiTrade : null
        }
      };

      const res = await fetch(getApiUrl('/api/v1/eligibility/check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (err) {
      console.error('Eligibility check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToChat = () => {
    if (onApplyToChat && result) {
      const msg = currentLanguage === 'or'
        ? `ମୋର ${percentage}% ମାର୍କ ଅଛି, ${branchCode} ଶାଖା ପାଇଁ ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରନ୍ତୁ`
        : currentLanguage === 'hi'
        ? `मेरे ${percentage}% अंक हैं, ${branchCode} शाखा के लिए पात्रता जांचें`
        : `I scored ${percentage}% marks, please check my eligibility for ${branchCode} branch`;
      onApplyToChat(msg);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="eligibility-modal-title"
        className="bg-navy-900 border border-navy-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-navy-800 flex items-center justify-between bg-navy-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-electric-blue/10 rounded-lg border border-electric-blue/30 text-electric-blue shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 id="eligibility-modal-title" className="font-bold text-white text-sm sm:text-base">
                {mt.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {mt.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Evaluator"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition shrink-0 focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:outline-none"
            title="Close Evaluator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Pathway Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {mt.pathway}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setPathway('FIRST_YEAR'); setExamType('10TH'); }}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition min-h-[40px] focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:outline-none ${
                  pathway === 'FIRST_YEAR'
                    ? 'border-electric-blue bg-electric-blue/10 text-electric-blue'
                    : 'border-navy-700 bg-navy-800/40 text-slate-400 hover:bg-navy-800'
                }`}
              >
                {mt.firstYear}
              </button>
              <button
                type="button"
                onClick={() => { setPathway('LATERAL_ENTRY'); setExamType('ITI'); }}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition min-h-[40px] focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:outline-none ${
                  pathway === 'LATERAL_ENTRY'
                    ? 'border-electric-blue bg-electric-blue/10 text-electric-blue'
                    : 'border-navy-700 bg-navy-800/40 text-slate-400 hover:bg-navy-800'
                }`}
              >
                {mt.lateralEntry}
              </button>
            </div>
          </div>

          {/* Exam Type & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="modalExamType" className="block text-xs font-medium text-slate-400 mb-1">{mt.qualifyingExam}</label>
              <select
                id="modalExamType"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-electric-blue min-h-[40px] focus-visible:ring-2 focus-visible:ring-electric-blue"
              >
                {pathway === 'FIRST_YEAR' ? (
                  <option value="10TH">{mt.exam10th}</option>
                ) : (
                  <>
                    <option value="ITI">{mt.examIti}</option>
                    <option value="12TH_SCIENCE">{mt.exam12thSci}</option>
                    <option value="12TH_VOCATIONAL">{mt.exam12thVoc}</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="modalCategory" className="block text-xs font-medium text-slate-400 mb-1">{mt.category}</label>
              <select
                id="modalCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-electric-blue min-h-[40px] focus-visible:ring-2 focus-visible:ring-electric-blue"
              >
                <option value="GENERAL">{mt.catGen}</option>
                <option value="SC">{mt.catSc}</option>
                <option value="ST">{mt.catSt}</option>
                <option value="SEBC">{mt.catSebc}</option>
              </select>
            </div>
          </div>

          {/* ITI Trade Selector if ITI */}
          {examType === 'ITI' && (
            <div>
              <label htmlFor="modalItiTrade" className="block text-xs font-medium text-slate-400 mb-1">{mt.itiTrade}</label>
              <select
                id="modalItiTrade"
                value={itiTrade}
                onChange={(e) => setItiTrade(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-electric-blue min-h-[40px] focus-visible:ring-2 focus-visible:ring-electric-blue"
              >
                <option value="FITTER">Fitter</option>
                <option value="ELECTRICIAN">Electrician</option>
                <option value="COPA">COPA (Computer Operator)</option>
                <option value="DRAUGHTSMAN_CIVIL">Draughtsman Civil</option>
                <option value="MECHANIC_MOTOR_VEHICLE">Mechanic Motor Vehicle</option>
                <option value="ELECTRONIC_MECHANIC">Electronic Mechanic</option>
                <option value="WELDER">Welder</option>
              </select>
            </div>
          )}

          {/* Desired Engineering Branch */}
          <div>
            <label htmlFor="modalBranchCode" className="block text-xs font-medium text-slate-400 mb-1">{mt.targetBranch}</label>
            <select
              id="modalBranchCode"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-electric-blue min-h-[40px] focus-visible:ring-2 focus-visible:ring-electric-blue"
            >
              <option value="MECH">{mt.branches.MECH}</option>
              <option value="CIVIL">{mt.branches.CIVIL}</option>
              <option value="CSE">{mt.branches.CSE}</option>
              <option value="EE">{mt.branches.EE}</option>
              <option value="ETC">{mt.branches.ETC}</option>
              <option value="AUTO">{mt.branches.AUTO}</option>
            </select>
          </div>

          {/* DEF-FUNC-07: Candidate Age & Aggregate Percentage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Candidate Age */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="modalCandidateAge" className="text-xs font-medium text-slate-400">{mt.candidateAge}</label>
                <span className={`text-xs font-bold ${ageYears < 14 ? 'text-amber-400' : 'text-electric-blue'}`}>
                  {ageYears} {mt.ageYearsSuffix}
                </span>
              </div>
              <input
                id="modalCandidateAge"
                type="number"
                min="10"
                max="60"
                value={ageYears}
                onChange={(e) => setAgeYears(Math.max(10, Math.min(60, Number(e.target.value) || 10)))}
                className={`w-full bg-navy-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none min-h-[40px] focus-visible:ring-2 ${
                  ageYears < 14
                    ? 'border-amber-500/60 focus:border-amber-400 focus-visible:ring-amber-400'
                    : 'border-navy-700 focus:border-electric-blue focus-visible:ring-electric-blue'
                }`}
              />
              {ageYears < 14 && (
                <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-medium animate-fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{mt.minAgeWarning}</span>
                </div>
              )}
            </div>

            {/* Marks Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="modalPercentage" className="text-xs font-medium text-slate-400">{mt.percentage}</label>
                <span className="text-xs font-bold text-electric-blue">{percentage}%</span>
              </div>
              <div className="space-y-1.5">
                <input
                  id="modalPercentage"
                  type="range"
                  min="25"
                  max="95"
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  className="w-full accent-electric-blue cursor-pointer h-2 bg-navy-950 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>25%</span>
                  <span>60%</span>
                  <span>95%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Subjects Passed */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mathSciCheck"
              checked={mathSciencePassed}
              onChange={(e) => setMathSciencePassed(e.target.checked)}
              className="w-4 h-4 rounded accent-electric-blue bg-navy-950 border-navy-700"
            />
            <label htmlFor="mathSciCheck" className="text-xs text-slate-300">
              {mt.mathSciCheck}
            </label>
          </div>

          {/* Evaluate Button */}
          <button
            type="button"
            onClick={handleEvaluate}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-electric-blue to-cyan-500 text-navy-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-electric-blue/20 hover:opacity-95 transition disabled:opacity-50"
          >
            {loading ? (
              <span>{mt.evaluating}</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{mt.evaluateBtn}</span>
              </>
            )}
          </button>

          {/* Result Card */}
          {result && (
            <div className={`p-4 rounded-xl border mt-3 space-y-2 animate-fade-in ${
              result.verdict === 'ELIGIBLE'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : result.verdict === 'NEEDS_MANUAL_VERIFICATION'
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {result.verdict === 'ELIGIBLE' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : result.verdict === 'NEEDS_MANUAL_VERIFICATION' ? (
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                )}
                <span>{mt.verdictLabel}: {result.verdict === 'ELIGIBLE' ? mt.verdictEligible : result.verdict === 'NEEDS_MANUAL_VERIFICATION' ? mt.verdictManual : mt.verdictNotEligible}</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{result.plainReason}</p>
              
              {result.evaluations && result.evaluations.length > 0 && (
                <ul className="text-[11px] space-y-1 pt-2 border-t border-navy-800">
                  {result.evaluations.map((ev, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span>{ev.passed ? '✓' : '✗'}</span>
                      <span>{ev.explanation}</span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={handleSendToChat}
                className="w-full mt-2 py-1.5 rounded-lg bg-navy-900 border border-slate-600 text-white text-xs font-semibold hover:bg-navy-800 transition text-center"
              >
                {mt.sendChat}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
