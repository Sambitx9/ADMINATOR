import React, { useState, useEffect } from 'react';
import { ShieldCheck, Globe, GraduationCap, LayoutDashboard, MessageSquare, Menu, X, Check, Activity, Scale } from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig.js';

export const Header = ({ activeView, setActiveView, currentLanguage, setCurrentLanguage }) => {
  const [backendHealth, setBackendHealth] = useState({ status: 'CHECKING', db: 'UNKNOWN' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(getApiUrl('/api/v1/health'));
        if (res.ok) {
          const data = await res.json();
          setBackendHealth({
            status: data.data.status,
            db: data.data.database.status
          });
        } else {
          setBackendHealth({ status: 'DEGRADED', db: 'DISCONNECTED' });
        }
      } catch (err) {
        setBackendHealth({ status: 'OFFLINE', db: 'UNREACHABLE' });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const languages = [
    { code: 'en', label: 'English', short: 'EN', native: 'English' },
    { code: 'or', label: 'Odia', short: 'ଓଡ଼ି', native: 'ଓଡ଼ିଆ' },
    { code: 'hi', label: 'Hindi', short: 'हिं', native: 'हिन्दी' }
  ];

  const watermarkTexts = {
    en: "DEMO DATA — FOR EVALUATION ONLY — NOT OFFICIAL ADMISSION DATA",
    or: "ଡେମୋ ତଥ୍ୟ — କେବଳ ମୂଲ୍ୟାଙ୍କନ ପାଇଁ — ସରକାରୀ ନାମଲେଖା ତଥ୍ୟ ନୁହେଁ",
    hi: "डेमो डेटा — केवल मूल्यांकन के लिए — आधिकारिक प्रवेश डेटा नहीं"
  };

  const navLabels = {
    en: {
      student: "Overview",
      studentDesc: "Student landing portal, courses & eligibility",
      compare: "Compare",
      compareDesc: "Side-by-side polytechnic comparison matrix",
      simulator: "WhatsApp Simulator",
      simulatorDesc: "Multilingual conversational admission desk",
      staff: "Staff CRM",
      staffDesc: "Admission lead pipeline & student records"
    },
    or: {
      student: "ସମୀକ୍ଷା",
      studentDesc: "ଛାତ୍ର ପୋର୍ଟାଲ, ପାଠ୍ୟକ୍ରମ ଏବଂ ଯୋଗ୍ୟତା",
      compare: "କଲେଜ ତୁଳନା",
      compareDesc: "ପଲିଟେକ୍ନିକ୍ ଅନୁଷ୍ଠାନଗୁଡ଼ିକର ପାରସ୍ପରିକ ତୁଳନା",
      simulator: "ହ୍ୱାଟ୍ସଆପ୍ ସିମୁଲେଟର",
      simulatorDesc: "ବହୁଭାଷୀ ନାମଲେଖା ସହାୟତା ଡେସ୍କ",
      staff: "କର୍ମଚାରୀ CRM",
      staffDesc: "ଆଡମିଶନ ଲିଡ୍ ପାଇପଲାଇନ୍ ଏବଂ ଛାତ୍ର ତାଲିକା"
    },
    hi: {
      student: "अवलोकन",
      studentDesc: "छात्र पोर्टल, पाठ्यक्रम और पात्रता",
      compare: "कॉलेज तुलना",
      compareDesc: "पॉलीटेक्निक संस्थानों की आमने-सामने तुलना",
      simulator: "व्हाट्सएप सिम्युलेटर",
      simulatorDesc: "बहुभाषी प्रवेश सहायता डेस्क",
      staff: "स्टाफ CRM",
      staffDesc: "प्रवेश लीड पाइपलाइन और छात्र रिकॉर्ड"
    }
  };

  const nav = navLabels[currentLanguage] || navLabels.en;

  const handleNavClick = (view) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-navy-800 bg-navy-900/95 backdrop-blur-md sticky top-0 z-50 w-full">
      {/* Demo watermark banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 text-center text-[10px] sm:text-xs font-medium text-amber-300 flex items-center justify-center gap-1.5 sm:gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="truncate">{watermarkTexts[currentLanguage] || watermarkTexts.en}</span>
      </div>

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Title */}
        <div 
          className="flex items-center space-x-2.5 cursor-pointer min-w-0 shrink-0" 
          onClick={() => handleNavClick('student')}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-vibrant-purple to-electric-blue flex items-center justify-center shadow-lg shadow-vibrant-purple/20 shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-white">ADMINATOR</span>
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-1 sm:px-1.5 py-0.2 rounded bg-electric-blue/10 text-electric-blue border border-electric-blue/30 shrink-0">
                Demo
              </span>
            </div>
            <p className="hidden xl:block text-[10px] text-slate-400 font-medium tracking-wide truncate">
              SMART ADMISSIONS. ZERO CHAOS.
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs (lg and up: >= 1024px) */}
        <nav className="hidden lg:flex items-center space-x-1 bg-navy-950 p-1 rounded-xl border border-navy-800">
          <button
            onClick={() => handleNavClick('student')}
            title={nav.student}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[36px] ${
              activeView === 'student'
                ? 'bg-electric-blue text-navy-950 shadow-md shadow-electric-blue/20'
                : 'text-slate-300 hover:text-white hover:bg-navy-800'
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span>{nav.student}</span>
          </button>

          <button
            onClick={() => handleNavClick('compare')}
            title={nav.compare}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[36px] ${
              activeView === 'compare'
                ? 'bg-cyan-500 text-navy-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-navy-800'
            }`}
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span>{nav.compare}</span>
          </button>

          <button
            onClick={() => handleNavClick('simulator')}
            title={nav.simulator}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[36px] ${
              activeView === 'simulator'
                ? 'bg-emerald-500 text-navy-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-navy-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>{nav.simulator}</span>
          </button>

          <button
            onClick={() => handleNavClick('staff')}
            title={nav.staff}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[36px] ${
              activeView === 'staff'
                ? 'bg-vibrant-purple text-white shadow-md shadow-vibrant-purple/20'
                : 'text-slate-300 hover:text-white hover:bg-navy-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>{nav.staff}</span>
          </button>
        </nav>

        {/* Right Section: System Health, Language Picker, Mobile Menu Button */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* Health Pill (Desktop >= 1280px) */}
          <div className="hidden xl:flex items-center space-x-2 text-xs bg-navy-800/80 px-2.5 py-1 rounded-full border border-navy-700">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  backendHealth.status === 'OPERATIONAL' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  backendHealth.status === 'OPERATIONAL' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <span className="text-slate-300 font-mono text-[11px]">
              API: <strong className={backendHealth.status === 'OPERATIONAL' ? 'text-emerald-400' : 'text-amber-400'}>{backendHealth.status}</strong>
            </span>
          </div>

          {/* Language Selector (All screens) */}
          <div className="flex items-center space-x-0.5 bg-navy-800 border border-navy-700 rounded-lg p-0.5 sm:p-1">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 hidden sm:block shrink-0" />
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setCurrentLanguage(lang.code)}
                title={lang.label}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[11px] sm:text-xs font-medium transition-all ${
                  currentLanguage === lang.code
                    ? 'bg-navy-950 text-electric-blue border border-electric-blue/40 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="hidden sm:inline">{lang.native}</span>
                <span className="sm:hidden">{lang.short}</span>
              </button>
            ))}
          </div>

          {/* Accessible Mobile Menu Toggle Button (< lg: < 1024px) */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="lg:hidden flex items-center justify-center p-2 rounded-xl bg-navy-800 text-slate-300 hover:text-white border border-navy-700 min-w-[40px] min-h-[40px] transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-electric-blue" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Navigation Drawer (< lg: < 1024px) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-navy-800 bg-navy-950/98 backdrop-blur-xl px-4 py-4 space-y-2.5 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1 mb-1">
            Navigation Menu
          </div>

          {/* Student Overview Link */}
          <button
            onClick={() => handleNavClick('student')}
            className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all ${
              activeView === 'student'
                ? 'bg-electric-blue/15 border-electric-blue/50 text-white'
                : 'bg-navy-900 border-navy-800 text-slate-300 hover:bg-navy-800'
            }`}
          >
            <div className={`p-2 rounded-lg ${activeView === 'student' ? 'bg-electric-blue text-navy-950' : 'bg-navy-800 text-electric-blue'}`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white flex items-center justify-between">
                <span>{nav.student}</span>
                {activeView === 'student' && <Check className="w-4 h-4 text-electric-blue" />}
              </div>
              <p className="text-[11px] text-slate-400 truncate">{nav.studentDesc}</p>
            </div>
          </button>

          {/* College Comparison Link */}
          <button
            onClick={() => handleNavClick('compare')}
            className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all ${
              activeView === 'compare'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                : 'bg-navy-900 border-navy-800 text-slate-300 hover:bg-navy-800'
            }`}
          >
            <div className={`p-2 rounded-lg ${activeView === 'compare' ? 'bg-cyan-500 text-navy-950' : 'bg-navy-800 text-cyan-400'}`}>
              <Scale className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white flex items-center justify-between">
                <span>{nav.compare}</span>
                {activeView === 'compare' && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <p className="text-[11px] text-slate-400 truncate">{nav.compareDesc}</p>
            </div>
          </button>

          {/* WhatsApp Simulator Link */}
          <button
            onClick={() => handleNavClick('simulator')}
            className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all ${
              activeView === 'simulator'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                : 'bg-navy-900 border-navy-800 text-slate-300 hover:bg-navy-800'
            }`}
          >
            <div className={`p-2 rounded-lg ${activeView === 'simulator' ? 'bg-emerald-500 text-navy-950' : 'bg-navy-800 text-emerald-400'}`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white flex items-center justify-between">
                <span>{nav.simulator}</span>
                {activeView === 'simulator' && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400 truncate">{nav.simulatorDesc}</p>
            </div>
          </button>

          {/* Staff CRM Link */}
          <button
            onClick={() => handleNavClick('staff')}
            className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all ${
              activeView === 'staff'
                ? 'bg-purple-500/15 border-purple-500/50 text-white'
                : 'bg-navy-900 border-navy-800 text-slate-300 hover:bg-navy-800'
            }`}
          >
            <div className={`p-2 rounded-lg ${activeView === 'staff' ? 'bg-purple-500 text-white' : 'bg-navy-800 text-purple-400'}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-white flex items-center justify-between">
                <span>{nav.staff}</span>
                {activeView === 'staff' && <Check className="w-4 h-4 text-purple-400" />}
              </div>
              <p className="text-[11px] text-slate-400 truncate">{nav.staffDesc}</p>
            </div>
          </button>

          {/* Mobile Footer Status */}
          <div className="pt-2 border-t border-navy-800/80 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${backendHealth.status === 'OPERATIONAL' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>Backend API: <strong>{backendHealth.status}</strong></span>
            </span>
            <span className="font-mono text-[10px]">DRIEMS Mode</span>
          </div>
        </div>
      )}
    </header>
  );
};
