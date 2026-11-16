import React from 'react';
import { MessageSquare, Calculator, CheckCircle2, Search, ArrowRight, Zap, BookOpen, Layers, Scale } from 'lucide-react';

export const HeroSection = ({ currentLanguage, onLaunchChat, onNavigateToCompare }) => {
  const content = {
    en: {
      tag: "AI-Assisted Polytechnic Admissions",
      headline: "Smart Admissions. Zero Chaos.",
      subhead: "Multilingual guidance for 1st-Year and Lateral-Entry Diploma courses across Odisha's polytechnic colleges. Zero confusion, verified deterministic eligibility, and instant tracking.",
      ctaChat: "Open WhatsApp Simulator",
      ctaEligibility: "Check Course Eligibility",
      ctaCompare: "Compare Colleges",
      ctaTrack: "Track Existing Enquiry",
      featuresTitle: "Designed for Students, Parents & Institutions",
      card1Title: "WhatsApp-Style Guidance",
      card1Desc: "Familiar conversational guidance in Odia (ଓଡ଼ିଆ), Hindi (हिन्दी), and English with zero learning curve.",
      card2Title: "Deterministic Eligibility",
      card2Desc: "Instant evaluation for 10th-Pass & ITI/12th Lateral Entry based strictly on mathematical admission rules.",
      card3Title: "Transparent Fee Estimates",
      card3Desc: "Itemized sample fees, hostel expenses, and state scholarship guidelines with complete transparency.",
      card4Title: "Unique Tracking Code",
      card4Desc: "Receive an instant tracking ID (ADM-YYYYMMDD-XXXX) with real-time status and counsellor updates."
    },
    or: {
      tag: "ଏଆଇ-ସହାୟକ ପଲିଟେକନିକ୍ ନାମଲେଖା",
      headline: "ସ୍ମାର୍ଟ ଆଡମିଶନ। ଶୂନ୍ୟ ବିଭ୍ରାଟ।",
      subhead: "ଓଡ଼ିଶାର ପଲିଟେକନିକ୍ କଲେଜଗୁଡ଼ିକ ପାଇଁ ପ୍ରଥମ ବର୍ଷ ଏବଂ ଲାଟେରାଲ ଏଣ୍ଟ୍ରି ଡିପ୍ଲୋମା ପାଠ୍ୟକ୍ରମର ସଠିକ୍ ପରାମର୍ଶ। ସରଳ ଯୋଗ୍ୟତା ଯାଞ୍ଚ ଏବଂ ତୁରନ୍ତ ସ୍ଥିତି ଟ୍ରାକିଂ।",
      ctaChat: "ହ୍ୱାଟ୍ସଆପ୍ ସିମୁଲେଟର ଖୋଲନ୍ତୁ",
      ctaEligibility: "ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରନ୍ତୁ",
      ctaCompare: "କଲେଜ ତୁଳନା କରନ୍ତୁ",
      ctaTrack: "ଆବେଦନ ଟ୍ରାକ୍ କରନ୍ତୁ",
      featuresTitle: "ଛାତ୍ରଛାତ୍ରୀ, ଅଭିଭାବକ ଏବଂ ଅନୁଷ୍ଠାନ ପାଇଁ ସ୍ୱତନ୍ତ୍ର",
      card1Title: "ହ୍ୱାଟ୍ସଆପ୍ ପରି ପରାମର୍ଶ",
      card1Desc: "ଓଡ଼ିଆ, ହିନ୍ଦୀ ଏବଂ ଇଂରାଜୀରେ ସହଜ ବାର୍ତ୍ତାଳାପ ମାଧ୍ୟମରେ ସମସ୍ତ ସୂଚନା ପାଆନ୍ତୁ।",
      card2Title: "ନିର୍ଭୁଲ ଯୋଗ୍ୟତା ଯାଞ୍ଚ",
      card2Desc: "୧୦ମ ପାସ୍ ଏବଂ ITI/୧୨ଶ ପାଇଁ ସ୍ୱୟଂକ୍ରିୟ ନିୟମ ଆଧାରିତ ଯୋଗ୍ୟତା ଯାଞ୍ଚ।",
      card3Title: "ସ୍ପଷ୍ଟ ଫିସ୍ ବିବରଣୀ",
      card3Desc: "ଟ୍ୟୁସନ ଫିସ୍, ହଷ୍ଟେଲ ଖର୍ଚ୍ଚ ଏବଂ ସ୍କଲାରସିପ୍ ବିଷୟରେ ନମୁନା ହିସାବ।",
      card4Title: "ସ୍ୱତନ୍ତ୍ର ଟ୍ରାକିଂ କୋଡ୍",
      card4Desc: "ଆବେଦନ ପରେ ତୁରନ୍ତ ଟ୍ରାକିଂ ଆଇଡି (ADM-YYYYMMDD-XXXX) ପାଆନ୍ତୁ।"
    },
    hi: {
      tag: "एआई-सहायक पॉलिटेक्निक प्रवेश",
      headline: "स्मार्ट प्रवेश। शून्य अव्यवस्था।",
      subhead: "ओडिशा के पॉलिटेक्निक कॉलेजों में प्रथम वर्ष और लेटरल एंट्री डिप्लोमा पाठ्यक्रमों के लिए बहुभाषी मार्गदर्शन। पारदर्शी नियम और त्वरित ट्रैकिंग।",
      ctaChat: "व्हाट्सएप सिम्युलेटर खोलें",
      ctaEligibility: "योग्यता जांचें",
      ctaCompare: "कॉलेज तुलना करें",
      ctaTrack: "आवेदन ट्रैक करें",
      featuresTitle: "छात्रों, अभिभावकों और संस्थानों के लिए निर्मित",
      card1Title: "व्हाट्सएप जैसा मार्गदर्शन",
      card1Desc: "ओडिया, हिंदी और अंग्रेजी में सरल बातचीत के जरिए बिना किसी उलझन के जानकारी प्राप्त करें।",
      card2Title: "सटीक नियम-आधारित योग्यता",
      card2Desc: "10वीं पास और आईटीआई/12वीं लेटरल एंट्री के लिए गणितीय नियमों पर आधारित तत्काल जांच।",
      card3Title: "पारदर्शी फीस अनुमान",
      card3Desc: "ट्यूशन फीस, हॉस्टल खर्च और छात्रवृत्ति दिशानिर्देशों का स्पष्ट विवरण।",
      card4Title: "विशिष्ट ट्रैकिंग कोड",
      card4Desc: "आवेदन सबमिट करने पर त्वरित ट्रैकिंग आईडी (ADM-YYYYMMDD-XXXX) प्राप्त करें।"
    }
  };

  const text = content[currentLanguage] || content.en;

  return (
    <div className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full overflow-x-hidden">
      {/* Hero Header */}
      <div className="text-center max-w-5xl mx-auto w-full px-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-blue/10 border border-electric-blue/30 text-electric-blue text-xs font-semibold mb-4">
          <Zap className="w-3.5 h-3.5" />
          <span>{text.tag}</span>
        </div>
        
        {/* Fixed One-Line Fluid Headline */}
        <h1 
          className="font-extrabold tracking-tight text-white leading-tight text-center whitespace-nowrap mx-auto select-none"
          style={{ 
            fontSize: 'clamp(1.05rem, 4.4vw, 3.75rem)', 
            letterSpacing: '-0.025em',
            textWrap: 'nowrap'
          }}
        >
          {text.headline}
        </h1>

        <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
          {text.subhead}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 w-full max-w-xl mx-auto sm:max-w-none">
          <button
            onClick={onLaunchChat}
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-whatsapp-emerald to-whatsapp-teal text-white font-bold text-sm shadow-lg shadow-whatsapp-emerald/25 hover:shadow-whatsapp-emerald/40 transition-all flex items-center justify-center gap-2 group"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{text.ctaChat}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onLaunchChat}
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-xl bg-navy-800 hover:bg-navy-700 text-white font-semibold text-sm border border-navy-700 transition-all flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4 text-electric-blue" />
            <span>{text.ctaEligibility}</span>
          </button>

          {onNavigateToCompare && (
            <button
              onClick={onNavigateToCompare}
              className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-xl bg-navy-800 hover:bg-navy-700 text-cyan-300 font-semibold text-sm border border-cyan-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Scale className="w-4 h-4 text-cyan-400" />
              <span>{text.ctaCompare}</span>
            </button>
          )}

          <button
            onClick={onLaunchChat}
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-xl bg-navy-900 hover:bg-navy-800 text-slate-300 hover:text-white font-medium text-sm border border-navy-800 transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>{text.ctaTrack}</span>
          </button>
        </div>
      </div>

      {/* Interactive Mock Preview Card (WhatsApp-Style Simulator Preview) */}
      <div className="mt-10 sm:mt-12 max-w-4xl mx-auto rounded-2xl bg-gradient-to-b from-navy-800 to-navy-900 border border-navy-700 p-2 sm:p-4 shadow-2xl shadow-navy-950/80 w-full overflow-hidden">
        <div className="rounded-xl bg-navy-950 border border-navy-800 overflow-hidden">
          {/* Simulated Chat Header */}
          <div className="bg-whatsapp-dark px-3 sm:px-4 py-3 flex items-center justify-between text-white border-b border-whatsapp-teal/40">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="w-10 sm:w-12 h-8 sm:h-9 rounded-lg bg-electric-blue/20 border border-electric-blue/40 flex items-center justify-center font-bold text-[11px] sm:text-xs text-electric-blue shrink-0">
                DRIEMS
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
                  <span className="truncate">DRIEMS Polytechnic (Autonomous)</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </h4>
                <p className="text-[10px] sm:text-[11px] text-emerald-200 truncate">Online • Local Deterministic Mode</p>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-black/20 border border-white/10 text-slate-200 shrink-0 ml-2">
              ₹0 Prototype
            </span>
          </div>

          {/* Simulated Chat Messages */}
          <div className="p-3.5 sm:p-6 space-y-3 bg-[radial-gradient(#1c2541_1px,transparent_1px)] [background-size:16px_16px] min-h-[200px] sm:min-h-[220px]">
            {/* Bot message */}
            <div className="max-w-[90%] sm:max-w-md bg-navy-800 border border-navy-700 p-3 sm:p-3.5 rounded-2xl rounded-tl-sm text-xs sm:text-sm text-slate-200 shadow-md">
              <p className="leading-relaxed">
                {currentLanguage === 'or'
                  ? 'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ ଡିପ୍ଲୋମା ଆଡମିଶନ ସହାୟକ। ଆପଣ କେଉଁ ଇଞ୍ଜିନିୟରିଂ ବ୍ରାଞ୍ଚରେ ଆଗ୍ରହୀ ଅଛନ୍ତି?'
                  : currentLanguage === 'hi'
                  ? 'नमस्ते! मैं आपका डिप्लोमा प्रवेश सहायक हूँ। आप किस इंजीनियरिंग शाखा में रुचि रखते हैं?'
                  : 'Hello! I am your Diploma Admission Assistant. Are you interested in 1st-Year (Post-10th) or Lateral Entry (Post-ITI)?'}
              </p>
              <span className="text-[10px] text-slate-400 mt-1.5 block text-right">10:30 AM</span>
            </div>

            {/* User message */}
            <div className="max-w-[90%] sm:max-w-md ml-auto bg-whatsapp-bubble border border-emerald-600/40 p-3 sm:p-3.5 rounded-2xl rounded-tr-sm text-xs sm:text-sm text-white shadow-md">
              <p className="leading-relaxed">
                {currentLanguage === 'or'
                  ? 'ମୁଁ ୧୦ମ ପରେ ମେକାନିକାଲ୍ ଇଞ୍ଜିନିୟରିଂ ପାଇଁ ଯୋଗ୍ୟତା ଜାଣିବାକୁ ଚାହୁଁଛି।'
                  : currentLanguage === 'hi'
                  ? 'मैं 10वीं के बाद मैकेनिकल इंजीनियरिंग के लिए पात्रता जानना चाहता हूँ।'
                  : 'I want to check eligibility for Mechanical Engineering after 10th.'}
              </p>
              <span className="text-[10px] text-emerald-300 mt-1.5 block text-right">10:31 AM ✓✓</span>
            </div>

            {/* Quick action chips */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2">
              <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs bg-navy-800 hover:bg-navy-700 text-electric-blue border border-electric-blue/30 cursor-pointer">
                ⚡ Check 10th Marks (ଯୋଗ୍ୟତା)
              </span>
              <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700 cursor-pointer">
                💰 View Fee Matrix
              </span>
              <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700 cursor-pointer">
                📋 Document Checklist
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Value Props Grid */}
      <div className="mt-14 sm:mt-16">
        <h3 className="text-xl sm:text-2xl font-bold text-center text-white mb-6 sm:mb-8">
          {text.featuresTitle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-navy-900/60 border border-navy-800 hover:border-electric-blue/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-whatsapp-emerald/10 text-whatsapp-emerald flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm sm:text-base mb-2">{text.card1Title}</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{text.card1Desc}</p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-navy-900/60 border border-navy-800 hover:border-electric-blue/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center mb-4">
              <Calculator className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm sm:text-base mb-2">{text.card2Title}</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{text.card2Desc}</p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-navy-900/60 border border-navy-800 hover:border-electric-blue/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-vibrant-purple/10 text-vibrant-purple flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm sm:text-base mb-2">{text.card3Title}</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{text.card3Desc}</p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-navy-900/60 border border-navy-800 hover:border-electric-blue/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm sm:text-base mb-2">{text.card4Title}</h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{text.card4Desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
