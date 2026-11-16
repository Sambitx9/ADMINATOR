import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ShieldCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig.js';

export const TrackingModal = ({ isOpen, onClose, currentLanguage = 'en' }) => {
  const [trackingId, setTrackingId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enquiry, setEnquiry] = useState(null);

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

  const trackTranslations = {
    en: {
      title: "Track Admission Enquiry",
      subtitle: "Dual-Key Tracking ID + Mobile Number Verification",
      trackingIdLabel: "Tracking ID (ADM-YYYYMMDD-XXXX)",
      trackingIdPlaceholder: "e.g. ADM-20261115-XXXX",
      mobileLabel: "Registered 10-Digit Mobile Number",
      mobilePlaceholder: "e.g. 9876543210",
      verifyBtn: "Verify Status",
      verifying: "Verifying...",
      candidateLabel: "Candidate:",
      collegeLabel: "College:",
      statusLabel: "Current Status:",
      activityLogLabel: "Activity Log:",
      errMissingFields: "Please provide both Tracking ID and 10-digit Mobile Number.",
      errNetwork: "Failed to connect to the server. Please check your network.",
      errNotFound: "No matching admission enquiry found. Please verify your details.",
      statusMap: {
        NEW: "NEW",
        CONTACTED: "CONTACTED",
        ASSIGNED: "ASSIGNED",
        VERIFIED: "VERIFIED",
        OFFERED: "OFFERED",
        ENROLLED: "ENROLLED",
        REJECTED: "REJECTED"
      }
    },
    or: {
      title: "ଆବେଦନ ସ୍ଥିତି ଯାଞ୍ଚ",
      subtitle: "ଡୁଆଲ୍-କି ଟ୍ରାକିଂ ID + ମୋବାଇଲ୍ ନମ୍ବର ଯାଞ୍ଚ",
      trackingIdLabel: "ଟ୍ରାକିଂ ID (ADM-YYYYMMDD-XXXX)",
      trackingIdPlaceholder: "ଯଥା: ADM-20261115-XXXX",
      mobileLabel: "ପଞ୍ଜୀକୃତ ୧୦-ଅଙ୍କ ବିଶିଷ୍ଟ ମୋବାଇଲ୍ ନମ୍ବର",
      mobilePlaceholder: "ଯଥା: 9876543210",
      verifyBtn: "ସ୍ଥିତି ଯାଞ୍ଚ କରନ୍ତୁ",
      verifying: "ଯାଞ୍ଚ ଚାଲିଛି...",
      candidateLabel: "ପ୍ରାର୍ଥୀ:",
      collegeLabel: "କଲେଜ:",
      statusLabel: "ବର୍ତ୍ତମାନର ସ୍ଥିତି:",
      activityLogLabel: "କାର୍ଯ୍ୟକଳାପ ଇତିହାସ:",
      errMissingFields: "ଦୟାକରି ଉଭୟ ଟ୍ରାକିଂ ID ଏବଂ ୧୦-ଅଙ୍କ ବିଶିଷ୍ଟ ମୋବାଇଲ୍ ନମ୍ବର ପ୍ରଦାନ କରନ୍ତୁ।",
      errNetwork: "ସର୍ଭର ସହିତ ସଂଯୋଗ ବିଫଳ ହୋଇଛି। ଦୟାକରି ଆପଣଙ୍କ ନେଟୱାର୍କ ଯାଞ୍ଚ କରନ୍ତୁ।",
      errNotFound: "କୌଣସି ଆଡମିଶନ ଆବେଦନ ମିଳିଲା ନାହିଁ। ଦୟାକରି ଆପଣଙ୍କ ତଥ୍ୟ ଯାଞ୍ଚ କରନ୍ତୁ।",
      statusMap: {
        NEW: "ନୂତନ",
        CONTACTED: "ଯୋଗାଯୋଗ ହୋଇଛି",
        ASSIGNED: "ନ୍ୟସ୍ତ",
        VERIFIED: "ଯାଞ୍ଚ ହୋଇଛି",
        OFFERED: "ପ୍ରସ୍ତାବିତ",
        ENROLLED: "ନାମଲେଖା ଶେଷ",
        REJECTED: "ପ୍ରତ୍ୟାଖ୍ୟାତ"
      }
    },
    hi: {
      title: "आवेदन स्थिति जांचें",
      subtitle: "डुअल-की ट्रैकिंग आईडी + मोबाइल नंबर सत्यापन",
      trackingIdLabel: "ट्रैकिंग आईडी (ADM-YYYYMMDD-XXXX)",
      trackingIdPlaceholder: "उदा: ADM-20261115-XXXX",
      mobileLabel: "पंजीकृत 10-अंकों का मोबाइल नंबर",
      mobilePlaceholder: "उदा: 9876543210",
      verifyBtn: "स्थिति सत्यापित करें",
      verifying: "सत्यापन जारी है...",
      candidateLabel: "अभ्यर्थी:",
      collegeLabel: "कॉलेज:",
      statusLabel: "वर्तमान स्थिति:",
      activityLogLabel: "गतिविधि लॉग:",
      errMissingFields: "कृपया ट्रैकिंग आईडी और 10-अंकों का मोबाइल नंबर दोनों दर्ज करें।",
      errNetwork: "सर्वर से कनेक्ट करने में विफल। कृपया अपना नेटवर्क जांचें।",
      errNotFound: "कोई मिलान प्रवेश पूछताछ नहीं मिली। कृपया अपने विवरण की पुष्टि करें।",
      statusMap: {
        NEW: "नया",
        CONTACTED: "सम्पर्क किया",
        ASSIGNED: "सौंपा गया",
        VERIFIED: "सत्यापित",
        OFFERED: "प्रस्तावित",
        ENROLLED: "नामांकित",
        REJECTED: "अस्वीकृत"
      }
    }
  };

  const tt = trackTranslations[currentLanguage] || trackTranslations.en;

  const handleTrack = async (e) => {
    e.preventDefault();
    setError(null);
    setEnquiry(null);

    if (!trackingId.trim() || !mobileNumber.trim()) {
      setError(tt.errMissingFields);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/v1/enquiries/track'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingId: trackingId.trim(),
          mobileNumber: mobileNumber.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEnquiry(data.data);
      } else {
        setError(data.message || tt.errNotFound);
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setError(tt.errNetwork);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'CONTACTED':
      case 'ASSIGNED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'OFFERED':
      case 'ENROLLED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'REJECTED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracking-modal-title"
        className="bg-navy-900 border border-navy-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-navy-800 flex items-center justify-between bg-navy-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="tracking-modal-title" className="font-bold text-white text-sm sm:text-base">
                {tt.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {tt.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Tracking"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            title="Close Tracking"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <form onSubmit={handleTrack} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {tt.trackingIdLabel}
              </label>
              <input
                type="text"
                placeholder={tt.trackingIdPlaceholder}
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue uppercase min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {tt.mobileLabel}
              </label>
              <input
                type="tel"
                placeholder={tt.mobilePlaceholder}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-navy-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition disabled:opacity-50"
            >
              {loading ? (
                <span>{tt.verifying}</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{tt.verifyBtn}</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Enquiry Result */}
          {enquiry && (
            <div className="p-4 rounded-xl border border-navy-700 bg-navy-950/70 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Tracking ID:</span>
                <span className="font-mono text-xs font-bold text-electric-blue">{enquiry.trackingId}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{tt.candidateLabel}</span>
                <span className="text-xs font-semibold text-white">{enquiry.studentName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{tt.collegeLabel}</span>
                <span className="text-xs text-slate-300">{enquiry.college}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{tt.statusLabel}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(enquiry.status)}`}>
                  {tt.statusMap[enquiry.status] || enquiry.status}
                </span>
              </div>

              {/* Notes timeline */}
              {enquiry.notes && enquiry.notes.length > 0 && (
                <div className="pt-3 border-t border-navy-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {tt.activityLogLabel}
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {enquiry.notes.map((n, i) => (
                      <div key={i} className="text-[11px] p-2 bg-navy-900 rounded-lg border border-navy-800">
                        <p className="text-slate-300">{n.text}</p>
                        <span className="text-[10px] text-slate-500">
                          {new Date(n.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-amber-400/80 text-center pt-2 border-t border-navy-800">
                {enquiry.demoNotice}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
