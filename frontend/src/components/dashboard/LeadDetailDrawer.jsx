import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Calendar,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  MessageSquare,
  FileText,
  Lock,
  Plus,
  Send,
  Building2,
  Tag
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig.js';

const ALLOWED_TRANSITIONS = {
  NEW: ['ASSIGNED', 'CONTACTED', 'REJECTED'],
  ASSIGNED: ['CONTACTED', 'VERIFIED', 'REJECTED'],
  CONTACTED: ['VERIFIED', 'ENROLLED', 'REJECTED', 'ASSIGNED'],
  VERIFIED: ['ENROLLED', 'REJECTED', 'CONTACTED'],
  ENROLLED: [],
  REJECTED: ['NEW', 'ASSIGNED']
};

export const LeadDetailDrawer = ({
  leadId,
  isOpen,
  onClose,
  token,
  currentUser,
  onLeadUpdated,
  currentLanguage = 'en'
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [leadData, setLeadData] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [counsellorsList, setCounsellorsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Status transition state
  const [targetStatus, setTargetStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Counsellor assignment state
  const [selectedCounsellorId, setSelectedCounsellorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Internal note state
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Fetch full lead details
  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(getApiUrl(`/api/v1/crm/leads/${leadId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setLeadData(json.data.enquiry);
        setConversation(json.data.conversation);
      } else {
        setError(json.error?.message || 'Failed to load lead details');
      }
    } catch (err) {
      setError('Network error while retrieving lead.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch eligible counsellors for assignment
  const fetchCounsellors = async () => {
    if (!currentUser || currentUser.role === 'COUNSELLOR') return;
    try {
      const res = await fetch(getApiUrl('/api/v1/crm/counsellors'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCounsellorsList(json.data.counsellors || []);
      }
    } catch (err) {
      console.error('Failed to load counsellors:', err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails();
      fetchCounsellors();
      setSuccessBanner('');
      setTargetStatus('');
      setRejectionReason('');
      setNoteText('');
    }
  }, [isOpen, leadId]);

  if (!isOpen) return null;

  const enquiry = leadData;
  const student = enquiry?.studentId;
  const college = enquiry?.collegeId;
  const course = enquiry?.courseId;
  const assigned = enquiry?.assignedCounsellorId;

  const currentStatus = enquiry?.status || 'NEW';
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  const canAssign = ['COLLEGE_ADMIN', 'PLATFORM_ADMIN'].includes(currentUser?.role);

  // Handle Status Update
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!targetStatus) return;

    if (targetStatus === 'REJECTED' && (!rejectionReason.trim() || rejectionReason.trim().length < 5)) {
      setError('A rejection reason of at least 5 characters is mandatory.');
      return;
    }

    setIsUpdatingStatus(true);
    setError('');
    try {
      const res = await fetch(getApiUrl(`/api/v1/crm/enquiries/${leadId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: targetStatus,
          reason: targetStatus === 'REJECTED' ? rejectionReason.trim() : rejectionReason.trim() || undefined
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessBanner(`Status successfully updated to ${targetStatus}`);
        setTargetStatus('');
        setRejectionReason('');
        await fetchLeadDetails();
        if (onLeadUpdated) onLeadUpdated();
      } else {
        setError(json.error?.message || 'Failed to update status');
      }
    } catch (err) {
      setError('Network error while updating status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Counsellor Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCounsellorId) return;

    setIsAssigning(true);
    setError('');
    try {
      const res = await fetch(getApiUrl(`/api/v1/crm/leads/${leadId}/assign`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ counsellorId: selectedCounsellorId })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessBanner('Lead assigned successfully.');
        setSelectedCounsellorId('');
        await fetchLeadDetails();
        if (onLeadUpdated) onLeadUpdated();
      } else {
        setError(json.error?.message || 'Failed to assign counsellor');
      }
    } catch (err) {
      setError('Network error while assigning lead.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Add Internal Note
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || noteText.trim().length < 3) {
      setError('Note text must be at least 3 characters.');
      return;
    }

    setIsAddingNote(true);
    setError('');
    try {
      const res = await fetch(getApiUrl(`/api/v1/crm/enquiries/${leadId}/notes`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: noteText.trim() })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessBanner('Internal note recorded.');
        setNoteText('');
        await fetchLeadDetails();
        if (onLeadUpdated) onLeadUpdated();
      } else {
        setError(json.error?.message || 'Failed to add note');
      }
    } catch (err) {
      setError('Network error while adding internal note.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'NEW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ASSIGNED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'CONTACTED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'VERIFIED':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'ENROLLED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'REJECTED':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-navy-900 border-l border-navy-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-navy-800 flex items-start justify-between bg-navy-950/80">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-electric-blue px-2 py-0.5 rounded bg-electric-blue/10 border border-electric-blue/30">
                {enquiry?.trackingId || 'LOADING...'}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(enquiry?.status)}`}>
                {enquiry?.status}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                enquiry?.priority === 'HOT' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {enquiry?.priority || 'WARM'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-2 flex items-center gap-2">
              <span>{student?.fullName || 'Candidate Record'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {college?.name || 'Institution'} • {course?.title || enquiry?.pathway || 'Diploma'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white transition-colors shrink-0"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {successBanner && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-navy-800 px-3 sm:px-6 bg-navy-950/40 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-electric-blue text-electric-blue'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Eligibility</span>
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-electric-blue text-electric-blue'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Status & Assignment</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-electric-blue text-electric-blue'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Internal Notes ({enquiry?.internalNotes?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'border-electric-blue text-electric-blue'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Transcript</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <span className="inline-block w-6 h-6 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Loading lead details...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: PROFILE & ELIGIBILITY */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Candidate Contact */}
                  <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-electric-blue" />
                      <span>Student Contact & Origin</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Full Legal Name</span>
                        <span className="font-semibold text-white">{student?.fullName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Mobile Phone</span>
                        <span className="font-semibold text-emerald-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{student?.mobileNumber ? `+91-${student.mobileNumber}` : '—'}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Email Address</span>
                        <span className="font-semibold text-slate-300">{student?.email || 'None Provided'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">District / State</span>
                        <span className="font-semibold text-slate-300">{student?.district}, {student?.state}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Category</span>
                        <span className="font-semibold text-slate-300">{student?.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Preferred Language</span>
                        <span className="font-semibold text-slate-300 uppercase">{student?.preferredLanguage || 'en'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Record & Eligibility */}
                  <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Academic Credentials & Evaluation</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                      <div>
                        <span className="text-slate-500 block">Qualifying Exam</span>
                        <span className="font-semibold text-white">{student?.qualification?.examType || '10TH'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Aggregate Percentage</span>
                        <span className="font-bold text-electric-blue text-sm">
                          {student?.qualification?.aggregatePercentage ? `${student.qualification.aggregatePercentage}%` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Board / Council</span>
                        <span className="font-semibold text-slate-300">{student?.qualification?.board || 'BSE_ODISHA'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Passing Year</span>
                        <span className="font-semibold text-slate-300">{student?.qualification?.passingYear || 2024}</span>
                      </div>
                    </div>

                    {/* Eligibility Breakdown */}
                    <div className="pt-3 border-t border-navy-800">
                      <span className="text-xs font-semibold text-slate-300 block mb-2">Deterministic Eligibility Breakdown:</span>
                      {enquiry?.eligibilityBreakdown && enquiry.eligibilityBreakdown.length > 0 ? (
                        <div className="space-y-2">
                          {enquiry.eligibilityBreakdown.map((rule, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs p-2 rounded-xl bg-navy-900 border border-navy-800">
                              {rule.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-bold text-slate-200">{rule.rule}</span>
                                <p className="text-[11px] text-slate-400">{rule.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Evaluated deterministically based on standard admission rules.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STATUS & ASSIGNMENT */}
              {activeTab === 'status' && (
                <div className="space-y-6">
                  {/* Status Transition Control */}
                  <form onSubmit={handleStatusSubmit} className="p-4 rounded-2xl bg-navy-950 border border-navy-800 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Status State Machine</span>
                      <span className="text-emerald-400 font-mono text-[11px]">Current: {currentStatus}</span>
                    </h4>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Advance to Next Permitted Status:
                      </label>
                      <select
                        value={targetStatus}
                        onChange={(e) => setTargetStatus(e.target.value)}
                        className="w-full bg-navy-900 border border-navy-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-electric-blue"
                      >
                        <option value="">-- Select Valid Next State --</option>
                        {allowedNext.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {allowedNext.length === 0 && (
                        <p className="text-[11px] text-amber-400 mt-1">This enquiry has reached a terminal status ({currentStatus}).</p>
                      )}
                    </div>

                    {targetStatus === 'REJECTED' && (
                      <div>
                        <label className="block text-xs font-semibold text-rose-300 mb-1">
                          Mandatory Rejection Reason (Min. 5 characters):
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="e.g. Ineligible percentage; student enrolled elsewhere; false contact details"
                          rows={2}
                          className="w-full bg-navy-900 border border-rose-500/40 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                          required
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!targetStatus || isUpdatingStatus}
                      className="w-full py-2.5 px-4 rounded-xl bg-electric-blue hover:bg-blue-500 text-navy-950 font-bold text-xs shadow-md transition-all disabled:opacity-40"
                    >
                      {isUpdatingStatus ? 'Updating Status...' : 'Apply Status Transition'}
                    </button>
                  </form>

                  {/* Counsellor Assignment Control (Admins Only) */}
                  {canAssign && (
                    <form onSubmit={handleAssignSubmit} className="p-4 rounded-2xl bg-navy-950 border border-navy-800 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Counsellor Assignment</span>
                        <span className="text-purple-400 font-mono text-[11px]">
                          Assigned: {assigned?.name || 'Unassigned'}
                        </span>
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Select Active Counsellor for {college?.name || 'College'}:
                        </label>
                        <select
                          value={selectedCounsellorId}
                          onChange={(e) => setSelectedCounsellorId(e.target.value)}
                          className="w-full bg-navy-900 border border-navy-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="">-- Choose Counsellor --</option>
                          {counsellorsList.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name} ({c.role}) • {c.email}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedCounsellorId || isAssigning}
                        className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-40"
                      >
                        {isAssigning ? 'Assigning...' : 'Assign Counsellor'}
                      </button>
                    </form>
                  )}

                  {/* Lifecycle Status History Timeline */}
                  <div className="p-4 rounded-2xl bg-navy-950 border border-navy-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Status Transition History</span>
                    </h4>

                    {enquiry?.statusHistory && enquiry.statusHistory.length > 0 ? (
                      <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-navy-800">
                        {enquiry.statusHistory.map((hist, idx) => (
                          <div key={idx} className="relative text-xs">
                            <span className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-electric-blue border-2 border-navy-950" />
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">
                                {hist.fromStatus ? `${hist.fromStatus} → ` : ''}{hist.toStatus}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Actor: <strong className="text-slate-300">{hist.changedByName}</strong> ({hist.changedByRole})
                            </p>
                            {hist.reason && (
                              <p className="text-[11px] text-amber-300/80 italic mt-0.5">"{hist.reason}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No previous transitions recorded.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: INTERNAL NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  {/* Confidentiality Notice */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Confidential Internal Staff Notes — Strictly protected and never exposed to candidate portal.</span>
                  </div>

                  {/* Add Note Form */}
                  <form onSubmit={handleNoteSubmit} className="p-4 rounded-2xl bg-navy-950 border border-navy-800 space-y-3">
                    <label className="block text-xs font-semibold text-slate-300">
                      Record New Staff Observation / Call Summary:
                    </label>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="e.g. Student visited campus with father. Discussed lateral entry mechanical eligibility."
                      rows={3}
                      className="w-full bg-navy-900 border border-navy-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">{noteText.length}/2000 characters</span>
                      <button
                        type="submit"
                        disabled={isAddingNote || noteText.trim().length < 3}
                        className="py-2 px-4 rounded-xl bg-electric-blue hover:bg-blue-500 text-navy-950 font-bold text-xs flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAddingNote ? 'Recording...' : 'Add Note'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Existing Notes Feed */}
                  <div className="space-y-3">
                    {enquiry?.internalNotes && enquiry.internalNotes.length > 0 ? (
                      enquiry.internalNotes.map((n, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-navy-950 border border-navy-800 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 flex items-center gap-1.5">
                              <span>{n.authorName}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-navy-900 text-slate-400 border border-navy-800">
                                {n.authorRole}
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{n.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-center text-slate-500 py-6">No internal notes added yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: CHAT TRANSCRIPT */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-400 flex items-center justify-between">
                    <span>Session: {conversation?.sessionId || 'Direct Form Registration'}</span>
                    <span className="uppercase text-electric-blue font-bold">Language: {conversation?.language || 'en'}</span>
                  </div>

                  {conversation?.messages && conversation.messages.length > 0 ? (
                    <div className="space-y-3 p-3 rounded-2xl bg-navy-950 border border-navy-800 max-h-[420px] overflow-y-auto">
                      {conversation.messages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                            m.sender === 'USER'
                              ? 'ml-auto bg-emerald-600/20 text-emerald-100 border border-emerald-500/30'
                              : 'bg-navy-900 text-slate-200 border border-navy-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
                            <strong>{m.sender === 'USER' ? 'Student' : 'Adminator Bot'}</strong>
                            <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-center text-slate-500 py-12">
                      No online simulator transcript linked to this enquiry record.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
