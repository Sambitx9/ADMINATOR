import React, { useState, useEffect } from 'react';
import {
  Scale,
  Building2,
  GraduationCap,
  Award,
  MapPin,
  Phone,
  Mail,
  Home,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Filter,
  DollarSign,
  Users,
  ShieldCheck,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig.js';

export const CollegeComparison = ({ currentLanguage = 'en', onSelectCollegeForChat }) => {
  const [collegesList, setCollegesList] = useState([]);
  const [selectedCodes, setSelectedCodes] = useState(['DRIEMS', 'KIPT', 'UPP']);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedPathway, setSelectedPathway] = useState('ALL');
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMobileCollege, setActiveMobileCollege] = useState('DRIEMS');

  // Multilingual translations dictionary
  const t = {
    en: {
      badge: 'Multi-College Admission Comparator • Offline ₹0 Mode',
      title: 'Compare Polytechnic Institutions Side-by-Side',
      subtitle: 'Analyze approved seat intakes, verified fee structures, hostel amenities, and diploma branches across Odisha.',
      selectCollegesPrompt: 'Select up to 3 colleges to compare (DRIEMS Polytechnic is default primary):',
      maxCollegesNotice: 'Maximum 3 colleges can be compared simultaneously.',
      filterBranch: 'Branch / Course:',
      filterPathway: 'Admission Pathway:',
      allBranches: 'All 6 Branches',
      allPathways: 'All Pathways',
      firstYear: '1st Year (3-Year Diploma)',
      lateralEntry: 'Lateral Entry (2-Year Diploma)',
      overviewSection: '1. Institutional Overview & Accreditation',
      seatsSection: '2. Branch Offerings & Seat Availability',
      feesSection: '3. Configured Fee Structure & Affordability',
      hostelSection: '4. Hostel & Residential Living',
      scholarshipsSection: '5. Scholarships & Fee Waivers',
      autonomousBadge: 'Autonomous Polytechnic',
      defaultBadge: 'Default Primary Institution',
      demoBadge: 'Evaluation Demo',
      notConfigured: 'Not configured',
      notOffered: 'Branch not offered',
      seatsTotal: 'Total Approved Seats',
      seatsAvailable: 'Available Vacancy',
      duration: 'Duration',
      tuitionSem: 'Tuition Fee / Sem',
      admissionOneTime: 'One-Time Admission Fee',
      labYear: 'Lab & Workshop / Year',
      estAnnual: 'Est. Annual Total',
      hostelSem: 'Hostel Fee / Sem',
      hostelAvailable: 'Hostel Configured',
      facilities: 'Campus Facilities',
      scholarshipSchemes: 'Available Schemes',
      applyOrEnquire: 'Enquire via Chatbot',
      refresh: 'Refresh Comparison',
      demoBanner: '[DEMO DATA - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]',
      switchMobileView: 'View College:'
    },
    or: {
      badge: 'ବହୁ-କଲେଜ ତୁଳନାତ୍ମକ ବିଶ୍ଳେଷଣ • ଅଫଲାଇନ୍ ₹୦ ମୋଡ୍',
      title: 'ପଲିଟେକ୍ନିକ୍ କଲେଜଗୁଡ଼ିକର ପାରସ୍ପରିକ ତୁଳନା',
      subtitle: 'ଓଡ଼ିଶାର ଅଗ୍ରଣୀ ପଲିଟେକ୍ନିକ୍ ଅନୁଷ୍ଠାନଗୁଡ଼ିକର ସିଟ୍ ସଂଖ୍ୟା, ଫିସ୍ ଷ୍ଟ୍ରକଚର, ହଷ୍ଟେଲ ସୁବିଧା ଏବଂ ଡିପ୍ଲୋମା ବ୍ରାଞ୍ଚର ତୁଳନା କରନ୍ତୁ।',
      selectCollegesPrompt: 'ତୁଳନା ପାଇଁ ସର୍ବାଧିକ ୩ଟି କଲେଜ ବାଛନ୍ତୁ (DRIEMS ପଲିଟେକ୍ନିକ୍ ମୁଖ୍ୟ ପ୍ରାଥମିକତା):',
      maxCollegesNotice: 'ଏକ ସମୟରେ ସର୍ବାଧିକ ୩ଟି କଲେଜ ତୁଳନା କରାଯାଇପାରିବ।',
      filterBranch: 'ବ୍ରାଞ୍ଚ / ପାଠ୍ୟକ୍ରମ:',
      filterPathway: 'ନାମଲେଖା ପ୍ରକାର:',
      allBranches: 'ସମସ୍ତ ୬ଟି ବ୍ରାଞ୍ଚ',
      allPathways: 'ସମସ୍ତ ପ୍ରକାର',
      firstYear: 'ପ୍ରଥମ ବର୍ଷ (୩-ବର୍ଷ ଡିପ୍ଲୋମା)',
      lateralEntry: 'ଲାଟେରାଲ ଏଣ୍ଟ୍ରି (୨-ବର୍ଷ ଡିପ୍ଲୋମା)',
      overviewSection: '୧. ଅନୁଷ୍ଠାନ ପରିଚୟ ଏବଂ ସ୍ୱୀକୃତି',
      seatsSection: '୨. ବ୍ରାଞ୍ଚ ଏବଂ ସିଟ୍ ଉପଲବ୍ଧତା',
      feesSection: '୩. ଫିସ୍ ବିବରଣୀ ଏବଂ ଖର୍ଚ୍ଚ ଆକଳନ',
      hostelSection: '୪. ହଷ୍ଟେଲ ଏବଂ ରହଣି ସୁବିଧା',
      scholarshipsSection: '୫. ଛାତ୍ରବୃତ୍ତି ଏବଂ ଫିସ୍ ଛାଡ଼',
      autonomousBadge: 'ସ୍ୱୟଂଶାସିତ ପଲିଟେକ୍ନିକ୍',
      defaultBadge: 'ମୁଖ୍ୟ ଡିଫଲ୍ଟ କଲେଜ',
      demoBadge: 'ଡେମୋ ମୂଲ୍ୟାଙ୍କନ',
      notConfigured: 'ବିନ୍ୟାସିତ ହୋଇନାହିଁ',
      notOffered: 'ଏହି ବ୍ରାଞ୍ଚ ଉପଲବ୍ଧ ନାହିଁ',
      seatsTotal: 'ମୋଟ ଅନୁମୋଦିତ ସିଟ୍',
      seatsAvailable: 'ଖାଲି ଥିବା ସିଟ୍',
      duration: 'ଅବଧି',
      tuitionSem: 'ଟ୍ୟୁସନ ଫିସ୍ / ସେମିଷ୍ଟାର',
      admissionOneTime: 'ନାମଲେଖା ଫିସ୍ (ଥରେ ଦେୟ)',
      labYear: 'ଲାବ୍ ଏବଂ ୱାର୍କସପ୍ / ବର୍ଷ',
      estAnnual: 'ଆନୁମାନିକ ବାର୍ଷିକ ଖର୍ଚ୍ଚ',
      hostelSem: 'ହଷ୍ଟେଲ ଫିସ୍ / ସେମିଷ୍ଟାର',
      hostelAvailable: 'ହଷ୍ଟେଲ ବ୍ୟବସ୍ଥା ଅଛି',
      facilities: 'କ୍ୟାମ୍ପସ ସୁବିଧା',
      scholarshipSchemes: 'ଉପଲବ୍ଧ ଛାତ୍ରବୃତ୍ତି',
      applyOrEnquire: 'ଚାଟବଟ୍ ସହିତ ପରାମର୍ଶ କରନ୍ତୁ',
      refresh: 'ପୁନଃ ଲୋଡ୍ କରନ୍ତୁ',
      demoBanner: '[ଡେମୋ ତଥ୍ୟ — କେବଳ ମୂଲ୍ୟାଙ୍କନ ପାଇଁ — ସରକାରୀ ନାମଲେଖା ତଥ୍ୟ ନୁହେଁ]',
      switchMobileView: 'କଲେଜ ଦେଖନ୍ତୁ:'
    },
    hi: {
      badge: 'मल्टी-कॉलेज तुलनात्मक विश्लेषण • ऑफलाइन ₹0 मोड',
      title: 'पॉलीटेक्निक संस्थानों की आमने-सामने तुलना',
      subtitle: 'ओडिशा के प्रमुख पॉलीटेक्निक संस्थानों की स्वीकृत सीट संख्या, फीस संरचना, हॉस्टल सुविधाओं और डिप्लोमा शाखाओं की तुलना करें।',
      selectCollegesPrompt: 'तुलना के लिए अधिकतम 3 कॉलेज चुनें (DRIEMS पॉलिटेक्निक डिफ़ॉल्ट प्राथमिक है):',
      maxCollegesNotice: 'एक समय में अधिकतम 3 कॉलेजों की तुलना की जा सकती है।',
      filterBranch: 'शाखा / पाठ्यक्रम:',
      filterPathway: 'प्रवेश प्रकार:',
      allBranches: 'सभी 6 शाखाएँ',
      allPathways: 'सभी प्रकार',
      firstYear: 'प्रथम वर्ष (3-वर्षीय डिप्लोमा)',
      lateralEntry: 'लेटरल एंट्री (2-वर्षीय डिप्लोमा)',
      overviewSection: '1. संस्थान अवलोकन और मान्यता',
      seatsSection: '2. शाखाएं और सीट उपलब्धता',
      feesSection: '3. फीस संरचना और लागत अनुमान',
      hostelSection: '4. हॉस्टल और आवासीय सुविधाएं',
      scholarshipsSection: '5. छात्रवृत्ति और शुल्क छूट',
      autonomousBadge: 'स्वायत्त पॉलीटेक्निक',
      defaultBadge: 'डिफ़ॉल्ट प्राथमिक संस्थान',
      demoBadge: 'डेमो मूल्यांकन',
      notConfigured: 'कॉन्फ़िगर नहीं किया गया',
      notOffered: 'यह शाखा उपलब्ध नहीं है',
      seatsTotal: 'कुल स्वीकृत सीटें',
      seatsAvailable: 'उपलब्ध रिक्तियां',
      duration: 'अवधि',
      tuitionSem: 'ट्यूशन फीस / सेमेस्टर',
      admissionOneTime: 'एकमुश्त प्रवेश शुल्क',
      labYear: 'लैब और वर्कशॉप / वर्ष',
      estAnnual: 'अनुमानित वार्षिक खर्च',
      hostelSem: 'हॉस्टल फीस / सेमेस्टर',
      hostelAvailable: 'हॉस्टल उपलब्ध',
      facilities: 'परिसर सुविधाएं',
      scholarshipSchemes: 'उपलब्ध छात्रवृत्ति योजनाएं',
      applyOrEnquire: 'चैटबॉट से पूछताछ करें',
      refresh: 'ताज़ा करें',
      demoBanner: '[डेमो डेटा — केवल मूल्यांकन के लिए — आधिकारिक प्रवेश डेटा नहीं]',
      switchMobileView: 'कॉलेज देखें:'
    }
  }[currentLanguage] || {
    badge: 'Multi-College Admission Comparator • Offline ₹0 Mode',
    title: 'Compare Polytechnic Institutions Side-by-Side',
    subtitle: 'Analyze approved seat intakes, verified fee structures, hostel amenities, and diploma branches across Odisha.',
    selectCollegesPrompt: 'Select up to 3 colleges to compare (DRIEMS Polytechnic is default primary):',
    maxCollegesNotice: 'Maximum 3 colleges can be compared simultaneously.',
    filterBranch: 'Branch / Course:',
    filterPathway: 'Admission Pathway:',
    allBranches: 'All 6 Branches',
    allPathways: 'All Pathways',
    firstYear: '1st Year (3-Year Diploma)',
    lateralEntry: 'Lateral Entry (2-Year Diploma)',
    overviewSection: '1. Institutional Overview & Accreditation',
    seatsSection: '2. Branch Offerings & Seat Availability',
    feesSection: '3. Configured Fee Structure & Affordability',
    hostelSection: '4. Hostel & Residential Living',
    scholarshipsSection: '5. Scholarships & Fee Waivers',
    autonomousBadge: 'Autonomous Polytechnic',
    defaultBadge: 'Default Primary Institution',
    demoBadge: 'Evaluation Demo',
    notConfigured: 'Not configured',
    notOffered: 'Branch not offered',
    seatsTotal: 'Total Approved Seats',
    seatsAvailable: 'Available Vacancy',
    duration: 'Duration',
    tuitionSem: 'Tuition Fee / Sem',
    admissionOneTime: 'One-Time Admission Fee',
    labYear: 'Lab & Workshop / Year',
    estAnnual: 'Est. Annual Total',
    hostelSem: 'Hostel Fee / Sem',
    hostelAvailable: 'Hostel Configured',
    facilities: 'Campus Facilities',
    scholarshipSchemes: 'Available Schemes',
    applyOrEnquire: 'Enquire via Chatbot',
    refresh: 'Refresh Comparison',
    demoBanner: '[DEMO DATA - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]',
    switchMobileView: 'View College:'
  };

  // 1. Fetch active colleges on mount
  useEffect(() => {
    fetch(getApiUrl('/api/v1/colleges'))
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setCollegesList(json.data);
        }
      })
      .catch((err) => console.error('[CollegeComparison] Error fetching colleges list:', err));
  }, []);

  // 2. Fetch comparison data whenever selected colleges or filters change
  const fetchComparison = async () => {
    if (selectedCodes.length === 0) return;
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('collegeCodes', selectedCodes.join(','));
      if (selectedBranch !== 'ALL') params.set('branchCode', selectedBranch);
      if (selectedPathway !== 'ALL') params.set('pathway', selectedPathway);

      const res = await fetch(getApiUrl(`/api/v1/colleges/compare?${params.toString()}`));
      const json = await res.json();

      if (json.success && json.data) {
        setComparisonData(json.data);
        if (!selectedCodes.includes(activeMobileCollege) && json.data.colleges.length > 0) {
          setActiveMobileCollege(json.data.colleges[0].college.code);
        }
      } else {
        setError(json.message || 'Failed to load comparison data');
      }
    } catch (err) {
      console.error('[CollegeComparison] Fetch error:', err);
      setError('Network communication failed with local API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [selectedCodes, selectedBranch, selectedPathway]);

  // Toggle college selection (max 3)
  const handleToggleCollege = (code) => {
    if (selectedCodes.includes(code)) {
      if (selectedCodes.length === 1) return; // Keep at least 1 college
      setSelectedCodes(selectedCodes.filter((c) => c !== code));
    } else {
      if (selectedCodes.length >= 3) {
        // Replace the last non-DRIEMS college or append
        const nonDriems = selectedCodes.filter((c) => c !== 'DRIEMS');
        if (nonDriems.length > 0) {
          const toReplace = nonDriems[nonDriems.length - 1];
          setSelectedCodes([...selectedCodes.filter((c) => c !== toReplace), code]);
        } else {
          setSelectedCodes([...selectedCodes.slice(0, 2), code]);
        }
      } else {
        setSelectedCodes([...selectedCodes, code]);
      }
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || amount <= 0) return t.notConfigured;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getBranchLocalizedName = (branch) => {
    if (!branch?.name) return branch?.branchCode || '';
    if (typeof branch.name === 'string') return branch.name;
    return branch.name[currentLanguage] || branch.name.en || branch.branchCode;
  };

  const colleges = comparisonData?.colleges || [];
  const matrix = comparisonData?.matrix || [];

  return (
    <div className="max-w-7xl mx-auto py-6 px-3 sm:px-6 lg:px-8 space-y-6">
      {/* Demo watermark disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 text-center text-xs font-semibold text-amber-300 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{t.demoBanner}</span>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 border border-navy-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-electric-blue/15 text-electric-blue border border-electric-blue/30">
          <Scale className="w-3.5 h-3.5" />
          <span>{t.badge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {t.title}
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          {t.subtitle}
        </p>

        {/* Institution Selection Bar */}
        <div className="pt-3 border-t border-navy-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">{t.selectCollegesPrompt}</span>
            <span className="text-[11px] text-slate-400">({selectedCodes.length}/3 selected)</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {collegesList.map((col) => {
              const isSelected = selectedCodes.includes(col.code);
              const isDriems = col.code === 'DRIEMS';
              return (
                <button
                  key={col.code}
                  onClick={() => handleToggleCollege(col.code)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                    isSelected
                      ? isDriems
                        ? 'bg-electric-blue text-navy-950 border-electric-blue shadow-md shadow-electric-blue/20'
                        : 'bg-navy-800 text-white border-navy-600 shadow-sm'
                      : 'bg-navy-950 text-slate-400 border-navy-800 hover:text-slate-200 hover:bg-navy-900'
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${isSelected ? (isDriems ? 'text-navy-950' : 'text-electric-blue') : 'text-slate-500'}`} />
                  <span>{col.code}</span>
                  {isDriems && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${isSelected ? 'bg-navy-950 text-electric-blue' : 'bg-electric-blue/20 text-electric-blue'}`}>
                      Primary
                    </span>
                  )}
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 ml-0.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Bar: Branch & Pathway */}
        <div className="pt-3 border-t border-navy-800/60 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">{t.filterBranch}</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-navy-900 border border-navy-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-electric-blue focus:outline-none"
            >
              <option value="ALL">{t.allBranches}</option>
              <option value="MECH">MECH — Mechanical</option>
              <option value="CIVIL">CIVIL — Civil</option>
              <option value="CSE">CSE — Computer Science</option>
              <option value="EE">EE — Electrical</option>
              <option value="ETC">ETC — Electronics</option>
              <option value="AUTO">AUTO — Automobile</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-300">{t.filterPathway}</span>
            <select
              value={selectedPathway}
              onChange={(e) => setSelectedPathway(e.target.value)}
              className="bg-navy-900 border border-navy-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-electric-blue focus:outline-none"
            >
              <option value="ALL">{t.allPathways}</option>
              <option value="FIRST_YEAR">{t.firstYear}</option>
              <option value="LATERAL_ENTRY">{t.lateralEntry}</option>
            </select>
          </div>

          <button
            onClick={fetchComparison}
            className="ml-auto px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-xs font-medium text-slate-300 border border-navy-700 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.refresh}</span>
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && !comparisonData && (
        <div className="bg-navy-900/60 border border-navy-800 rounded-2xl p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-electric-blue animate-spin mx-auto" />
          <p className="text-sm text-slate-300 font-medium">Loading comparative metrics...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
          <p className="text-sm font-semibold text-rose-300">{error}</p>
        </div>
      )}

      {/* Main Side-by-Side Comparison Matrix */}
      {comparisonData && colleges.length > 0 && (
        <div className="space-y-6">
          {/* Mobile Tabbed Switcher (< 768px) */}
          <div className="md:hidden flex items-center gap-2 bg-navy-900 p-1.5 rounded-xl border border-navy-800 overflow-x-auto no-scrollbar">
            <span className="text-xs text-slate-400 px-2 font-medium shrink-0">{t.switchMobileView}</span>
            {colleges.map((p) => (
              <button
                key={p.college.code}
                onClick={() => setActiveMobileCollege(p.college.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  activeMobileCollege === p.college.code
                    ? 'bg-electric-blue text-navy-950 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {p.college.code}
              </button>
            ))}
          </div>

          {/* SECTION 1: INSTITUTIONAL OVERVIEW */}
          <div className="bg-navy-900/90 border border-navy-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-navy-950/80 px-4 py-3 border-b border-navy-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-electric-blue" />
                <span>{t.overviewSection}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-navy-800">
              {colleges.map((colProfile) => {
                const isMobileHidden = activeMobileCollege !== colProfile.college.code;
                const isDriems = colProfile.college.code === 'DRIEMS';

                return (
                  <div
                    key={colProfile.college.code}
                    className={`p-5 space-y-4 ${isMobileHidden ? 'hidden md:block' : 'block'} ${
                      isDriems ? 'bg-electric-blue/[0.02]' : ''
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-navy-950 text-white border border-navy-700">
                          {colProfile.college.code}
                        </span>
                        {colProfile.college.isAutonomous && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {t.autonomousBadge}
                          </span>
                        )}
                        {colProfile.college.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-electric-blue/20 text-electric-blue border border-electric-blue/30">
                            {t.defaultBadge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white leading-snug">
                        {colProfile.college.name}
                      </h3>

                      <div className="text-xs text-slate-400 space-y-1 pt-1">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            {colProfile.college.district}, {colProfile.college.state}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-400 pl-5">
                          {colProfile.college.address?.street}, {colProfile.college.address?.city} — {colProfile.college.address?.pinCode}
                        </p>
                        <p className="flex items-center gap-1.5 pt-1">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>+91-{colProfile.college.contactPhone}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{colProfile.college.contactEmail}</span>
                        </p>
                      </div>
                    </div>

                    {/* Facilities Chips */}
                    <div className="pt-2 border-t border-navy-800 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        {t.facilities}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {colProfile.college.facilities && colProfile.college.facilities.length > 0 ? (
                          colProfile.college.facilities.map((fac, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-navy-950 text-slate-300 border border-navy-800"
                            >
                              {fac}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">{t.notConfigured}</span>
                        )}
                      </div>
                    </div>

                    {/* Chatbot CTA */}
                    {onSelectCollegeForChat && (
                      <button
                        onClick={() => onSelectCollegeForChat(colProfile.college.code)}
                        className="w-full mt-2 py-2 px-3 rounded-xl bg-electric-blue/10 hover:bg-electric-blue/20 text-electric-blue border border-electric-blue/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t.applyOrEnquire}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: BRANCH COURSES & SEAT AVAILABILITY */}
          <div className="bg-navy-900/90 border border-navy-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-navy-950/80 px-4 py-3 border-b border-navy-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>{t.seatsSection}</span>
              </h2>
            </div>

            <div className="divide-y divide-navy-800">
              {matrix.map((row) => (
                <div key={row.branchCode} className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-navy-800/60 pb-2">
                    <div>
                      <span className="text-xs font-bold text-electric-blue font-mono mr-2">
                        {row.branchCode}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {getBranchLocalizedName(row)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-navy-800">
                    {colleges.map((colProfile) => {
                      const colCode = colProfile.college.code;
                      const branchData = row.colleges[colCode];
                      const isMobileHidden = activeMobileCollege !== colCode;

                      return (
                        <div
                          key={colCode}
                          className={`p-3 space-y-2 ${isMobileHidden ? 'hidden md:block' : 'block'}`}
                        >
                          <div className="text-[11px] font-bold text-slate-400 md:hidden pb-1">
                            {colProfile.college.name}
                          </div>

                          {branchData && branchData.isOffered ? (
                            <div className="space-y-2">
                              {/* 1st Year Seats */}
                              {branchData.firstYear ? (
                                <div className="bg-navy-950 p-2.5 rounded-xl border border-navy-800 space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400">{t.firstYear}</span>
                                    <span className="font-bold text-emerald-400">
                                      {branchData.firstYear.availableSeats} / {branchData.firstYear.totalSeats} seats
                                    </span>
                                  </div>
                                  <div className="w-full bg-navy-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-emerald-400 h-1.5 rounded-full"
                                      style={{
                                        width: `${Math.round(
                                          (branchData.firstYear.availableSeats / branchData.firstYear.totalSeats) * 100
                                        )}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-500 italic">
                                  1st Year: {t.notConfigured}
                                </div>
                              )}

                              {/* Lateral Entry Seats */}
                              {branchData.lateralEntry ? (
                                <div className="bg-navy-950 p-2 rounded-xl border border-navy-800 text-xs flex items-center justify-between">
                                  <span className="text-slate-400">{t.lateralEntry}</span>
                                  <span className="font-semibold text-teal-300">
                                    {branchData.lateralEntry.availableSeats} / {branchData.lateralEntry.totalSeats} seats
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-500 italic">
                                  Lateral: {t.notConfigured}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-navy-950/50 border border-navy-800/80 text-center">
                              <span className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5 text-slate-600" />
                                <span>{t.notOffered}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: FEE STRUCTURE BREAKDOWN */}
          <div className="bg-navy-900/90 border border-navy-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-navy-950/80 px-4 py-3 border-b border-navy-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>{t.feesSection}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-navy-800">
              {colleges.map((colProfile) => {
                const isMobileHidden = activeMobileCollege !== colProfile.college.code;
                const summary = colProfile.summary;

                return (
                  <div
                    key={colProfile.college.code}
                    className={`p-5 space-y-4 ${isMobileHidden ? 'hidden md:block' : 'block'}`}
                  >
                    <div className="text-xs font-bold text-slate-300 pb-1 border-b border-navy-800">
                      {colProfile.college.name}
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {/* Tuition Fee / Semester */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{t.tuitionSem}:</span>
                        <span className="font-bold text-white font-mono">
                          {summary.tuitionFeePerSemesterMin !== null
                            ? formatCurrency(summary.tuitionFeePerSemesterMin)
                            : t.notConfigured}
                        </span>
                      </div>

                      {/* Admission Fee */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{t.admissionOneTime}:</span>
                        <span className="font-semibold text-slate-200 font-mono">
                          {summary.admissionFeeOneTime !== null
                            ? formatCurrency(summary.admissionFeeOneTime)
                            : t.notConfigured}
                        </span>
                      </div>

                      {/* Lab & Workshop / Year */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{t.labYear}:</span>
                        <span className="font-semibold text-slate-200 font-mono">
                          {summary.labWorkshopFeePerYear !== null
                            ? formatCurrency(summary.labWorkshopFeePerYear)
                            : t.notConfigured}
                        </span>
                      </div>

                      {/* Estimated Annual Total */}
                      <div className="pt-2 border-t border-navy-800 flex items-center justify-between bg-navy-950 p-2.5 rounded-xl border">
                        <span className="font-bold text-slate-200">{t.estAnnual}:</span>
                        <span className="font-extrabold text-amber-300 font-mono text-sm">
                          {summary.tuitionFeePerSemesterMin !== null
                            ? formatCurrency(
                                summary.tuitionFeePerSemesterMin * 2 +
                                  (summary.labWorkshopFeePerYear || 0) +
                                  (summary.admissionFeeOneTime || 0)
                              )
                            : t.notConfigured}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: HOSTEL & RESIDENTIAL LIFE */}
          <div className="bg-navy-900/90 border border-navy-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-navy-950/80 px-4 py-3 border-b border-navy-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Home className="w-4 h-4 text-purple-400" />
                <span>{t.hostelSection}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-navy-800">
              {colleges.map((colProfile) => {
                const isMobileHidden = activeMobileCollege !== colProfile.college.code;
                const summary = colProfile.summary;
                const hostelFee = summary.hostelFeePerSemester;

                return (
                  <div
                    key={colProfile.college.code}
                    className={`p-5 space-y-3 ${isMobileHidden ? 'hidden md:block' : 'block'}`}
                  >
                    <div className="text-xs font-bold text-slate-300 pb-1 border-b border-navy-800">
                      {colProfile.college.name}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{t.hostelAvailable}:</span>
                      {summary.hostelConfigured ? (
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Configured</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">{t.notConfigured}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{t.hostelSem}:</span>
                      <span className="font-bold text-white font-mono">
                        {hostelFee !== null ? formatCurrency(hostelFee) : t.notConfigured}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed bg-navy-950 p-2 rounded-lg border border-navy-800">
                      {colProfile.college.code === 'DRIEMS'
                        ? 'Separate Boys and Girls hostels with hygienic mess, 24/7 security, high-speed Wi-Fi, and indoor sports recreation.'
                        : 'On-campus boarding and lodging available subject to seat vacancy.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: SCHOLARSHIPS & WAIVERS */}
          <div className="bg-navy-900/90 border border-navy-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-navy-950/80 px-4 py-3 border-b border-navy-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-400" />
                <span>{t.scholarshipsSection}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-navy-800">
              {colleges.map((colProfile) => {
                const isMobileHidden = activeMobileCollege !== colProfile.college.code;
                const scholarships = colProfile.summary.scholarships || [];

                return (
                  <div
                    key={colProfile.college.code}
                    className={`p-5 space-y-3 ${isMobileHidden ? 'hidden md:block' : 'block'}`}
                  >
                    <div className="text-xs font-bold text-slate-300 pb-1 border-b border-navy-800 flex items-center justify-between">
                      <span>{colProfile.college.name}</span>
                      <span className="text-[11px] text-teal-300 font-mono">
                        {scholarships.length} schemes
                      </span>
                    </div>

                    {scholarships.length > 0 ? (
                      <div className="space-y-2">
                        {scholarships.map((sch, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-navy-950 p-2.5 rounded-xl border border-navy-800 space-y-1 text-xs"
                          >
                            <div className="font-bold text-white flex items-center justify-between">
                              <span>{sch.name}</span>
                              <span className="text-[10px] text-teal-300 px-1.5 py-0.2 rounded bg-teal-500/10 border border-teal-500/30">
                                {sch.waiverAmount}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{sch.criteria}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-2">{t.notConfigured}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};