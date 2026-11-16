import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, UserCheck, AlertCircle, ArrowRight, KeyRound, Sparkles, Eye, EyeOff } from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig.js';

export const StaffLogin = ({ onLoginSuccess, currentLanguage = 'en' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const translations = {
    en: {
      title: "Staff & Counsellor Portal",
      subtitle: "Sign in to manage polytechnic admissions, lead pipelines, and student counselling.",
      emailLabel: "Staff Email",
      passwordLabel: "Password",
      submitBtn: "Sign In to CRM",
      quickDemoTitle: "⚡ Quick Staff Email Select",
      rateLimitNotice: "Brute-force protected: Max 5 failed attempts per 15-minute window.",
      demoBadge: "STAFF ROLES"
    },
    or: {
      title: "କର୍ମଚାରୀ ଏବଂ କାଉନସେଲର ପୋର୍ଟାଲ",
      subtitle: "ପଲିଟେକନିକ୍ ନାମଲେଖା, ଛାତ୍ର ଆବେଦନ ଏବଂ ପରାମର୍ଶ ପରିଚାଳନା ପାଇଁ ଲଗଇନ୍ କରନ୍ତୁ।",
      emailLabel: "କର୍ମଚାରୀ ଇମେଲ୍",
      passwordLabel: "ପାସୱାର୍ଡ",
      submitBtn: "CRM ରେ ଲଗଇନ୍ କରନ୍ତୁ",
      quickDemoTitle: "⚡ ଷ୍ଟାଫ୍ ଇମେଲ ଚୟନ",
      rateLimitNotice: "ସୁରକ୍ଷିତ ପ୍ରବେଶ: ପ୍ରତି ୧୫ ମିନିଟରେ ସର୍ବାଧିକ ୫ ଟି ଚେଷ୍ଟା।",
      demoBadge: "ଷ୍ଟାଫ୍ ଭୂମିକା"
    },
    hi: {
      title: "स्टाफ एवं काउंसलर पोर्टल",
      subtitle: "पॉलिटेक्निक प्रवेश, लीड पाइपलाइन और छात्र परामर्श प्रबंधित करने के लिए साइन इन करें।",
      emailLabel: "स्टाफ ईमेल",
      passwordLabel: "पासवर्ड",
      submitBtn: "CRM में साइन इन करें",
      quickDemoTitle: "⚡ त्वरित स्टाफ ईमेल चयन",
      rateLimitNotice: "सुरक्षा संरक्षित: प्रत्येक 15 मिनट में अधिकतम 5 असफल प्रयास।",
      demoBadge: "स्टाफ भूमिकाएं"
    }
  };

  const t = translations[currentLanguage] || translations.en;

  const quickLogins = [
    {
      role: 'DRIEMS Counsellor',
      name: 'DRIEMS Counsellor',
      email: 'counsellor@driems.ac.in',
      badge: 'COUNSELLOR'
    },
    {
      role: 'DRIEMS College Admin',
      name: 'DRIEMS Admin',
      email: 'admin@driems.ac.in',
      badge: 'COLLEGE_ADMIN'
    },
    {
      role: 'KIPT Counsellor',
      name: 'Sunita Mohapatra',
      email: 'sunita.counsellor@kipt.ac.in',
      badge: 'COUNSELLOR'
    },
    {
      role: 'KIPT College Admin',
      name: 'Pradeep Das',
      email: 'admin@kipt.ac.in',
      badge: 'COLLEGE_ADMIN'
    },
    {
      role: 'UPP Counsellor',
      name: 'Bikash Rout',
      email: 'bikash.counsellor@upp.ac.in',
      badge: 'COUNSELLOR'
    },
    {
      role: 'Platform Super Admin',
      name: 'ADMINATOR Platform Admin',
      email: 'platform.admin@adminator.demo',
      badge: 'PLATFORM_ADMIN'
    }
  ];

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword('');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please provide both staff email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(getApiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('adminator_staff_token', data.data.token);
        localStorage.setItem('adminator_staff_user', JSON.stringify(data.data.user));
        if (onLoginSuccess) {
          onLoginSuccess(data.data.user, data.data.token);
        }
      } else {
        setErrorMessage(data.error?.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setErrorMessage('Network error connecting to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6 sm:my-10 p-4 sm:p-8 rounded-3xl bg-navy-900 border border-navy-800 shadow-2xl w-full overflow-hidden">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-electric-blue text-white shadow-lg shadow-purple-600/30 mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{t.title}</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">{t.subtitle}</p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.emailLabel}</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sunita.counsellor@kipt.ac.in"
              className="w-full bg-navy-950 border border-navy-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue transition-colors min-h-[44px]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.passwordLabel}</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-navy-950 border border-navy-800 rounded-xl pl-10 pr-11 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue transition-colors min-h-[44px]"
              required
            />
            {/* DEF-UI-18: Password Show/Hide Toggle with >= 44x44px touch area */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:outline-none min-w-[44px] min-h-[44px]"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 px-4 min-h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{t.submitBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Credentials Fill Chips */}
      <div className="mt-8 pt-6 border-t border-navy-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.quickDemoTitle}</span>
          </span>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-navy-950 border border-navy-800 text-slate-400">
            {t.demoBadge}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {quickLogins.map((acc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickFill(acc)}
              className="p-2.5 rounded-xl bg-navy-950 border border-navy-800 hover:border-electric-blue/50 text-left transition-all hover:bg-navy-800/60 group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-white group-hover:text-electric-blue transition-colors truncate">
                  {acc.role}
                </span>
                <span className={`text-[8px] font-bold px-1 rounded ${
                  acc.badge === 'PLATFORM_ADMIN'
                    ? 'bg-purple-500/20 text-purple-300'
                    : acc.badge === 'COLLEGE_ADMIN'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {acc.badge === 'PLATFORM_ADMIN' ? 'SUPER' : acc.badge === 'COLLEGE_ADMIN' ? 'ADMIN' : 'STAFF'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 truncate">{acc.email}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 p-2.5 rounded-xl bg-navy-950/60 border border-navy-800 text-[10px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{t.rateLimitNotice}</span>
        </div>
      </div>
    </div>
  );
};
