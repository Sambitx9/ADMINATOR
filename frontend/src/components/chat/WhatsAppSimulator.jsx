import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  ShieldCheck,
  CheckCheck,
  RotateCcw,
  Calculator,
  Search,
  School,
  Globe,
  User,
  Bot,
  AlertCircle
} from 'lucide-react';
import { EligibilityModal } from './EligibilityModal';
import { TrackingModal } from './TrackingModal';
import { getApiUrl } from '../../utils/apiConfig.js';

export const WhatsAppSimulator = ({ defaultLanguage = 'en', onBackToHero }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [selectedCollege, setSelectedCollege] = useState('DRIEMS');
  const [sessionId, setSessionId] = useState('');
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [isEligibilityOpen, setIsEligibilityOpen] = useState(urlParams.get('modal') === 'eligibility');
  const [isTrackingOpen, setIsTrackingOpen] = useState(urlParams.get('modal') === 'tracking');
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [activeTrackingId, setActiveTrackingId] = useState(null);

  const messagesEndRef = useRef(null);

  const simTranslations = {
    en: {
      evaluatorBtn: "Eligibility Evaluator",
      trackBtn: "Track Application",
      dateBanner: "Today • Fictional Demo Session",
      assistantBadge: "ADMINATOR Admission Assistant (Demo)",
      typing: "typing...",
      online: "online • AI Multilingual Counsellor",
      placeholder: "Type in English, हिंदी, ଓଡ଼ିଆ, Hinglish or Odlish...",
      attachTitle: "Attach Document (Simulated)",
      attachHeading: "Simulated Document Upload (Demo Mode)",
      attachSub: "Select a sample certificate to simulate admission verification:",
      doc1: "10th Standard / Matriculation Marksheet",
      doc2: "ITI Trade Certificate / +2 Science Marksheet",
      doc3: "Resident / Nativity Certificate (Odisha)",
      cancel: "Cancel"
    },
    or: {
      evaluatorBtn: "ଯୋଗ୍ୟତା ମୂଲ୍ୟାୟନକାରୀ",
      trackBtn: "ଆବେଦନ ଟ୍ରାକ୍ କରନ୍ତୁ",
      dateBanner: "ଆଜି • କାଳ୍ପନିକ ଡେମୋ ଅଧିବେଶନ",
      assistantBadge: "ଆଡମିନିଏଟର ନାମଲେଖା ସହାୟକ (ଡେମୋ)",
      typing: "ଟାଇପ୍ କରୁଛି...",
      online: "ସକ୍ରିୟ • ଏଆଇ ବହୁଭାଷୀ କାଉନସେଲର",
      placeholder: "ଆପଣଙ୍କ ବାର୍ତ୍ତା ଓଡ଼ିଆ, ହିନ୍ଦୀ କିମ୍ବା ଇଂରାଜୀରେ ଲେଖନ୍ତୁ...",
      attachTitle: "କାଗଜପତ୍ର ସଂଲଗ୍ନ କରନ୍ତୁ (ସିମୁଲେଟେଡ୍)",
      attachHeading: "ନମୁନା କାଗଜପତ୍ର ଅପଲୋଡ୍ (ଡେମୋ ମୋଡ୍)",
      attachSub: "ନାମଲେଖା ଯାଞ୍ଚ ସିମୁଲେସନ୍ ପାଇଁ ଏକ ନମୁନା ସାର୍ଟିଫିକେଟ୍ ଚୟନ କରନ୍ତୁ:",
      doc1: "୧୦ମ ଶ୍ରେଣୀ / ମ୍ୟାଟ୍ରିକ୍ ମାର୍କସିଟ୍",
      doc2: "ITI ଟ୍ରେଡ୍ ସାର୍ଟିଫିକେଟ୍ / +୨ ବିଜ୍ଞାନ ମାର୍କସିଟ୍",
      doc3: "ବାସିନ୍ଦା ପ୍ରମାଣପତ୍ର (ଓଡ଼ିଶା)",
      cancel: "ବାତିଲ୍"
    },
    hi: {
      evaluatorBtn: "पात्रता मूल्यांकनकर्ता",
      trackBtn: "आवेदन ट्रैक करें",
      dateBanner: "आज • काल्पनिक डेमो सत्र",
      assistantBadge: "एडमिनिएटर प्रवेश सहायक (डेमो)",
      typing: "टाइप कर रहा है...",
      online: "ऑनलाइन • एआई बहुभाषी काउंसलर",
      placeholder: "अपना संदेश हिंदी, ओडिया या अंग्रेजी में लिखें...",
      attachTitle: "दस्तावेज संलग्न करें (सिम्युलेटेड)",
      attachHeading: "सिम्युलेटेड दस्तावेज अपलोड (डेमो मोड)",
      attachSub: "प्रवेश सत्यापन के लिए एक नमूना प्रमाणपत्र चुनें:",
      doc1: "10वीं कक्षा / मैट्रिक अंकतालिका",
      doc2: "आईटीआई ट्रेड सर्टिफिकेट / +2 साइंस अंकतालिका",
      doc3: "निवास प्रमाण पत्र (ओडिशा)",
      cancel: "रद्द करें"
    }
  };

  const st = simTranslations[currentLanguage] || simTranslations.en;

  const colleges = [
    { code: 'DRIEMS', name: 'DRIEMS Polytechnic (Autonomous)', city: 'Tangi, Cuttack' },
    { code: 'KIPT', name: 'Kalinga Institute (KIPT Demo)', city: 'Bhubaneswar' },
    { code: 'UPP', name: 'Utkal Premier (UPP Demo)', city: 'Cuttack' },
    { code: 'MIET', name: 'Mayurbhanj Institute (MIET Demo)', city: 'Baripada' }
  ];

  // Initialize Session
  useEffect(() => {
    let sid = urlParams.get('sid') || localStorage.getItem('adminator_sim_session_id');
    if (!sid) {
      sid = 'sim-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('adminator_sim_session_id', sid);
    }
    setSessionId(sid);

    // Check if session history exists
    const loadSession = async () => {
      try {
        const histRes = await fetch(getApiUrl(`/api/v1/chat/history/${sid}`));
        if (histRes.ok) {
          const histData = await histRes.json();
          if (histData.data && histData.data.messages && histData.data.messages.length > 0) {
            setMessages(histData.data.messages.map((m, idx) => ({
              id: 'hist-' + idx,
              sender: m.sender,
              text: m.text,
              quickReplies: m.sender === 'BOT' ? ['Explore Branches', 'Check Eligibility', 'Fee Structure'] : [],
              timestamp: new Date(m.timestamp)
            })));
            if (histData.data.language) setCurrentLanguage(histData.data.language);
            return;
          }
        }
      } catch (e) {
        console.error('History load error:', e);
      }
      sendInitialGreeting(sid, currentLanguage, selectedCollege);
    };

    loadSession();
  }, []);

  // Update language when prop changes
  useEffect(() => {
    if (defaultLanguage && defaultLanguage !== currentLanguage) {
      setCurrentLanguage(defaultLanguage);
    }
  }, [defaultLanguage]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendInitialGreeting = async (sid, lang, col) => {
    setIsTyping(true);
    try {
      const res = await fetch(getApiUrl('/api/v1/chat/message'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          message: 'Hello',
          selectedLanguage: lang,
          collegeCode: col
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessages([
          {
            id: 'init-bot',
            sender: 'BOT',
            text: data.data.reply,
            quickReplies: data.data.quickReplies || [],
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to send greeting:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (textToSend = null, languageOverride = null, isExplicitSwitch = false) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const targetLang = languageOverride || currentLanguage;

    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'USER',
      text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch(getApiUrl('/api/v1/chat/message'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
          selectedLanguage: targetLang,
          explicitLanguageSwitch: isExplicitSwitch,
          collegeCode: selectedCollege
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.data.enquiryTrackingId) {
          setActiveTrackingId(data.data.enquiryTrackingId);
        }
        if (data.data.language && data.data.language !== currentLanguage) {
          setCurrentLanguage(data.data.language);
        }

        const botMsg = {
          id: 'bot-' + Date.now(),
          sender: 'BOT',
          text: data.data.reply,
          quickReplies: data.data.quickReplies || [],
          enquiryTrackingId: data.data.enquiryTrackingId,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorMsg = {
          id: 'err-' + Date.now(),
          sender: 'BOT',
          text: 'Sorry, I encountered an issue processing your request. Please try again.',
          quickReplies: ['Explore Branches', 'Check Eligibility'],
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = {
        id: 'err-' + Date.now(),
        sender: 'BOT',
        text: '⚠️ Network connection interrupted. Please ensure the local backend server is running.',
        quickReplies: ['Retry'],
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    const newSid = 'sim-' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('adminator_sim_session_id', newSid);
    setSessionId(newSid);
    setMessages([]);
    setActiveTrackingId(null);
    sendInitialGreeting(newSid, currentLanguage, selectedCollege);
  };

  const formatMessageText = (text) => {
    // Splits text and formats **bold**, bullet points, and disclaimer tag
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Check disclaimer
      if (line.includes('[DEMO DATA') || line.includes('[ଡେମୋ ତଥ୍ୟ') || line.includes('[डेमो डेटा')) {
        return (
          <span
            key={idx}
            className="block mt-2 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-semibold text-amber-300 tracking-wide"
          >
            {line}
          </span>
        );
      }

      // Check bold tags: **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={idx} className="block leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.25rem)] sm:h-[calc(100vh-7rem)] max-w-4xl w-full mx-auto rounded-xl sm:rounded-2xl border border-navy-800 bg-navy-950 shadow-2xl overflow-hidden my-1 sm:my-2">
      {/* Simulator Top Utility Bar */}
      <div className="bg-navy-900 px-2.5 sm:px-4 py-2 border-b border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] sm:text-xs">
        {/* Row 1 on mobile, Left on desktop: Quick Utility Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => setIsEligibilityOpen(true)}
            className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-electric-blue/10 border border-electric-blue/30 text-electric-blue font-semibold hover:bg-electric-blue/20 transition flex items-center gap-1.5"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{st.evaluatorBtn}</span>
          </button>

          <button
            onClick={() => setIsTrackingOpen(true)}
            className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/20 transition flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{st.trackBtn}</span>
          </button>

          {activeTrackingId && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy-800 text-[11px] text-electric-blue font-mono border border-electric-blue/30">
              ID: {activeTrackingId}
            </span>
          )}
        </div>

        {/* Row 2 on mobile, Right on desktop: College & Reset */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-slate-400 flex-1 sm:flex-initial min-w-0">
            <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="bg-navy-950 border border-navy-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-electric-blue w-full sm:w-auto max-w-[220px] sm:max-w-none truncate min-h-[36px]"
            >
              {colleges.map((col) => (
                <option key={col.code} value={col.code}>
                  {col.name} ({col.city})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleResetChat}
            title="Reset Conversation"
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition shrink-0 border border-navy-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* WhatsApp Header (Green & Navy Identity) */}
      <div className="bg-[#075E54] text-white px-3 sm:px-4 py-2 sm:py-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Left: Bot Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-navy-950 shadow">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 border-2 border-[#075E54]"></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-xs sm:text-sm tracking-wide truncate">ADMINATOR Admission Desk</h2>
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 shrink-0" />
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-100 flex items-center gap-1">
                <span>{isTyping ? st.typing : st.online}</span>
              </p>
            </div>
          </div>

          {/* Right: Language Switcher Pills */}
          <div className="flex items-center justify-end gap-1 bg-black/20 p-1 rounded-lg self-end sm:self-auto shrink-0">
            <Globe className="w-3.5 h-3.5 text-emerald-200 ml-1 shrink-0" />
            {[
              { code: 'en', label: 'EN' },
              { code: 'or', label: 'ଓଡ଼ିଆ' },
              { code: 'hi', label: 'हिन्दी' }
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setCurrentLanguage(l.code);
                  const switchMsg =
                    l.code === 'or'
                      ? 'ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି'
                      : l.code === 'hi'
                      ? 'मैं हिन्दी में बात करना चाहता हूँ'
                      : 'Switch to English';
                  handleSendMessage(switchMsg, l.code, true);
                }}
                className={`px-2.5 py-1 min-h-[28px] rounded text-[11px] font-semibold transition ${
                  currentLanguage === l.code
                    ? 'bg-white text-[#075E54] shadow font-bold'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0B141A] bg-opacity-95 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]">
        {/* Date Pill */}
        <div className="flex justify-center my-2">
          <span className="px-3 py-1 rounded-lg bg-navy-900 border border-navy-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider shadow">
            {st.dateBanner}
          </span>
        </div>

        {/* Messages */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'USER';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-md text-xs relative ${
                  isUser
                    ? 'bg-[#005C4B] text-slate-100 rounded-tr-none border border-emerald-600/30'
                    : 'bg-[#202C33] text-slate-200 rounded-tl-none border border-slate-700/50'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold mb-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{st.assistantBadge}</span>
                  </div>
                )}

                <div className="space-y-1 text-slate-100">{formatMessageText(msg.text)}</div>

                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-1.5">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </div>

              {/* Quick Reply Chips below bot responses */}
              {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-2 pt-1 max-w-[85%]">
                  {msg.quickReplies.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      disabled={isTyping}
                      className="px-3 py-1 rounded-full bg-navy-900 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-[11px] font-medium transition shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center space-x-1 p-3 max-w-[100px] bg-[#202C33] rounded-2xl rounded-tl-none border border-slate-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Simulated Document Upload Popover (DEF-FUNC-03) */}
      {isAttachmentOpen && (
        <div className="bg-navy-900 border-t border-slate-700 p-3 space-y-2 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{st.attachHeading}</span>
            </div>
            <button
              onClick={() => setIsAttachmentOpen(false)}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-navy-800"
            >
              {st.cancel}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            {st.attachSub}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                const docText = currentLanguage === 'or'
                  ? '📄 [ନମୁନା କାଗଜପତ୍ର ସଂଲଗ୍ନ: ୧୦ମ_ମାର୍କସିଟ୍_ଡେମୋ.pdf (ସିମୁଲେସନ୍)]'
                  : currentLanguage === 'hi'
                  ? '📄 [नमूना दस्तावेज संलग्न: 10वीं_अंकतालिका_डेमो.pdf (सिम्युलेशन)]'
                  : '📄 [Simulated Document Attached: 10th_Marksheet_Demo.pdf (Evaluation Sample)]';
                setIsAttachmentOpen(false);
                handleSendMessage(docText);
              }}
              className="p-2 rounded-xl bg-navy-950 border border-navy-700 hover:border-emerald-500 text-left text-[11px] text-slate-200 transition hover:bg-navy-800/60"
            >
              <div className="font-semibold text-emerald-300">📄 10th Marksheet</div>
              <div className="text-[10px] text-slate-400 truncate">{st.doc1}</div>
            </button>

            <button
              type="button"
              onClick={() => {
                const docText = currentLanguage === 'or'
                  ? '📄 [ନମୁନା କାଗଜପତ୍ର ସଂଲଗ୍ନ: ITI_ଟ୍ରେଡ୍_ସାର୍ଟିଫିକେଟ୍_ଡେମୋ.pdf (ସିମୁଲେସନ୍)]'
                  : currentLanguage === 'hi'
                  ? '📄 [नमूना दस्तावेज संलग्न: आईटीआई_ट्रेड_सर्टिफिकेट_डेमो.pdf (सिम्युलेशन)]'
                  : '📄 [Simulated Document Attached: ITI_Trade_Certificate_Demo.pdf (Evaluation Sample)]';
                setIsAttachmentOpen(false);
                handleSendMessage(docText);
              }}
              className="p-2 rounded-xl bg-navy-950 border border-navy-700 hover:border-emerald-500 text-left text-[11px] text-slate-200 transition hover:bg-navy-800/60"
            >
              <div className="font-semibold text-emerald-300">📄 ITI / +2 Certificate</div>
              <div className="text-[10px] text-slate-400 truncate">{st.doc2}</div>
            </button>

            <button
              type="button"
              onClick={() => {
                const docText = currentLanguage === 'or'
                  ? '📄 [ନମୁନା କାଗଜପତ୍ର ସଂଲଗ୍ନ: ବାସିନ୍ଦା_ପ୍ରମାଣପତ୍ର_ଓଡ଼ିଶା_ଡେମୋ.pdf (ସିମୁଲେସନ୍)]'
                  : currentLanguage === 'hi'
                  ? '📄 [नमूना दस्तावेज संलग्न: निवास_प्रमाणपत्र_ओडिशा_डेमो.pdf (सिम्युलेशन)]'
                  : '📄 [Simulated Document Attached: Resident_Certificate_Odisha_Demo.pdf (Evaluation Sample)]';
                setIsAttachmentOpen(false);
                handleSendMessage(docText);
              }}
              className="p-2 rounded-xl bg-navy-950 border border-navy-700 hover:border-emerald-500 text-left text-[11px] text-slate-200 transition hover:bg-navy-800/60"
            >
              <div className="font-semibold text-emerald-300">📄 Resident Certificate</div>
              <div className="text-[10px] text-slate-400 truncate">{st.doc3}</div>
            </button>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="bg-[#202C33] px-2.5 sm:px-3 py-2 sm:py-2.5 flex items-center gap-1.5 sm:gap-2 border-t border-slate-700">
        <button
          type="button"
          onClick={() => setIsEligibilityOpen(true)}
          title={st.evaluatorBtn}
          aria-label={st.evaluatorBtn}
          className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-slate-400 hover:text-emerald-400 hover:bg-navy-900 transition shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
        >
          <Calculator className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setIsAttachmentOpen((prev) => !prev)}
          title={st.attachTitle}
          aria-label={st.attachTitle}
          className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full transition shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
            isAttachmentOpen
              ? 'bg-emerald-500 text-navy-950'
              : 'text-slate-400 hover:text-white hover:bg-navy-900'
          }`}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          placeholder={st.placeholder}
          aria-label={st.placeholder}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 min-w-0 bg-[#2A3942] border border-transparent rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-slate-100 placeholder-[#CBD5E1] focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[42px]"
        />

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isTyping}
          aria-label="Send message"
          className={`p-2.5 min-w-[42px] min-h-[42px] rounded-full transition shadow-md flex items-center justify-center shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
            inputText.trim() && !isTyping
              ? 'bg-[#00A884] text-white hover:bg-[#008f6f]'
              : 'bg-navy-900 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Modals */}
      <EligibilityModal
        isOpen={isEligibilityOpen}
        onClose={() => setIsEligibilityOpen(false)}
        currentLanguage={currentLanguage}
        onApplyToChat={(msg) => handleSendMessage(msg)}
      />

      <TrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        currentLanguage={currentLanguage}
      />
    </div>
  );
};
