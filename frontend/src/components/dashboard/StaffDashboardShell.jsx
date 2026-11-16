import React, { useState, useEffect } from 'react';
import {
  Users,
  FileCheck,
  PhoneCall,
  TrendingUp,
  Database,
  Server,
  RefreshCw,
  AlertCircle,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  UserCheck,
  Shield,
  LogOut,
  Building2,
  ArrowRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  Layers,
  Inbox
} from 'lucide-react';
import { StaffLogin } from './StaffLogin';
import { LeadDetailDrawer } from './LeadDetailDrawer';
import { getApiUrl } from '../../utils/apiConfig.js';
import { AuditLogTable } from './AuditLogTable';
import { ExecutiveAnalyticsDashboard } from './ExecutiveAnalyticsDashboard';

export const StaffDashboardShell = ({ currentLanguage = 'en' }) => {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [token, setToken] = useState(() => urlParams.get('token') || localStorage.getItem('adminator_staff_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const qUser = urlParams.get('user');
      if (qUser) return JSON.parse(decodeURIComponent(qUser));
      return JSON.parse(localStorage.getItem('adminator_staff_user') || 'null');
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('pipeline'); // 'overview', 'pipeline', 'audit'
  const [metrics, setMetrics] = useState(null);
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalLeads: 0, totalPages: 1 });
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Student Roster State
  const [students, setStudents] = useState([]);
  const [studentsPagination, setStudentsPagination] = useState({ page: 1, limit: 15, totalStudents: 0, totalPages: 1 });
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [studentError, setStudentError] = useState('');

  // Handle URL parameters for navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openDrawer') === 'true' && leads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(leads[0]._id);
      setIsDrawerOpen(true);
    }
  }, [leads]);

  // Translations
  const translations = {
    en: {
      portalTitle: "Staff CRM & Admissions Command Center",
      tabOverview: "Overview & Analytics",
      tabAnalytics: "Executive Analytics",
      tabPipeline: "Lead Pipeline",
      tabAudit: "Audit Ledger",
      tabStudents: "Student Roster (65)",
      totalLeads: "Total Enquiries",
      newLeads: "New",
      assignedLeads: "Assigned",
      contactedLeads: "Contacted",
      verifiedLeads: "Verified",
      enrolledLeads: "Enrolled",
      rejectedLeads: "Rejected",
      searchPlaceholder: "Search student name, phone (+91), or tracking ID...",
      searchBtn: "Search",
      allStatuses: "All Statuses",
      allPriorities: "All Priorities",
      clearFilters: "Clear",
      refresh: "Refresh",
      trackingId: "Tracking ID",
      studentName: "Student Name",
      phone: "Mobile Phone",
      course: "Branch & Course",
      pathway: "Pathway",
      priority: "Priority",
      status: "Status",
      counsellor: "Assigned Counsellor",
      createdDate: "Date Submitted",
      actions: "Actions",
      viewDetails: "View Details",
      workloadTitle: "Counsellor Admission Workload",
      recentActivityTitle: "Recent Admissions Activity",
      logout: "Log Out",
      unassigned: "Unassigned"
    },
    or: {
      portalTitle: "କର୍ମଚାରୀ CRM ଏବଂ ଆଡମିଶନ ନିୟନ୍ତ୍ରଣ କେନ୍ଦ୍ର",
      tabOverview: "ସମୀକ୍ଷା ଏବଂ ବିଶ୍ଳେଷଣ",
      tabAnalytics: "କାର୍ଯ୍ୟନିର୍ବାହୀ ବିଶ୍ଳେଷଣ",
      tabPipeline: "ଆବେଦନ ତାଲିକା (Pipeline)",
      tabAudit: "ଅଡିଟ୍ ଲେଜର",
      tabStudents: "ଛାତ୍ରଛାତ୍ରୀ ତାଲିକା (୬୫)",
      totalLeads: "ମୋଟ ଆବେଦନ",
      newLeads: "ନୂତନ",
      assignedLeads: "ନ୍ୟସ୍ତ (Assigned)",
      contactedLeads: "ଯୋଗାଯୋଗ ହୋଇଛି",
      verifiedLeads: "ଯାଞ୍ଚ ହୋଇଛି",
      enrolledLeads: "ନାମଲେଖା ଶେଷ",
      rejectedLeads: "ପ୍ରତ୍ୟାଖ୍ୟାତ",
      searchPlaceholder: "ଛାତ୍ରଙ୍କ ନାମ, ଫୋନ୍ କିମ୍ବା ଟ୍ରାକିଂ ଆଇଡି ଖୋଜନ୍ତୁ...",
      searchBtn: "ଖୋଜନ୍ତୁ",
      allStatuses: "ସମସ୍ତ ସ୍ଥିତି",
      allPriorities: "ସମସ୍ତ ପ୍ରାଥମିକତା",
      clearFilters: "ସଫା କରନ୍ତୁ",
      refresh: "ତାଜା କରନ୍ତୁ",
      trackingId: "ଟ୍ରାକିଂ ଆଇଡି",
      studentName: "ଛାତ୍ରଙ୍କ ନାମ",
      phone: "ମୋବାଇଲ୍ ନମ୍ବର",
      course: "ଇଞ୍ଜିନିୟରିଂ ବ୍ରାଞ୍ଚ",
      pathway: "ଆଡମିଶନ ପଥ",
      priority: "ପ୍ରାଥମିକତା",
      status: "ସ୍ଥିତି",
      counsellor: "କାଉନସେଲର",
      createdDate: "ଦାଖଲ ତାରିଖ",
      actions: "କାର୍ଯ୍ୟ",
      viewDetails: "ବିବରଣୀ ଦେଖନ୍ତୁ",
      workloadTitle: "କାଉନସେଲର କାର୍ଯ୍ୟଭାର",
      recentActivityTitle: "ସାମ୍ପ୍ରତିକ ଆଡମିଶନ କାର୍ଯ୍ୟକଳାପ",
      logout: "ଲଗ୍ ଆଉଟ୍",
      unassigned: "ଅଣ-ନ୍ୟସ୍ତ"
    },
    hi: {
      portalTitle: "स्टाफ CRM एवं प्रवेश कमान केंद्र",
      tabOverview: "अवलोकन एवं विश्लेषण",
      tabAnalytics: "कार्यकारी विश्लेषिकी",
      tabPipeline: "लीड पाइपलाइन",
      tabAudit: "ऑडिट लेजर",
      tabStudents: "छात्र रोस्टर (65)",
      totalLeads: "कुल आवेदन",
      newLeads: "नए",
      assignedLeads: "सौंपा गया",
      contactedLeads: "सम्पर्क किया",
      verifiedLeads: "सत्यापित",
      enrolledLeads: "नामांकित",
      rejectedLeads: "अस्वीकृत",
      searchPlaceholder: "छात्र का नाम, फोन या ट्रैकिंग आईडी खोजें...",
      searchBtn: "खोजें",
      allStatuses: "सभी स्थितियां",
      allPriorities: "सभी प्राथमिकताएं",
      clearFilters: "रीसेट",
      refresh: "रिफ्रेश",
      trackingId: "ट्रैकिंग आईडी",
      studentName: "छात्र का नाम",
      phone: "मोबाइल नंबर",
      course: "इंजीनियरिंग शाखा",
      pathway: "प्रवेश मार्ग",
      priority: "प्राथमिकता",
      status: "स्थिति",
      counsellor: "काउंसलर",
      createdDate: "जमा तिथि",
      actions: "कार्रवाई",
      viewDetails: "विवरण देखें",
      workloadTitle: "काउंसलर कार्यभार",
      recentActivityTitle: "हालिया प्रवेश गतिविधियां",
      logout: "लॉग आउट",
      unassigned: "अ-सौंपा"
    }
  };

  const t = translations[currentLanguage] || translations.en;

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('adminator_staff_token');
    localStorage.removeItem('adminator_staff_user');
    setToken('');
    setCurrentUser(null);
  };

  // Fetch Dashboard Metrics
  const fetchMetrics = async () => {
    if (!token) return;
    try {
      const res = await fetch(getApiUrl('/api/v1/crm/metrics'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const json = await res.json();
      if (res.ok && json.success) {
        setMetrics(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  // Fetch Leads List with Filters & Pagination
  const fetchLeads = async (page = 1) => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      let query = `?page=${page}&limit=${pagination.limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (searchQuery.trim()) query += `&search=${encodeURIComponent(searchQuery.trim())}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (priorityFilter) query += `&priority=${priorityFilter}`;

      const res = await fetch(getApiUrl(`/api/v1/crm/leads${query}`), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const json = await res.json();
      if (res.ok && json.success) {
        setLeads(json.data.leads || []);
        setPagination(json.data.pagination || { page: 1, limit: 10, totalLeads: 0, totalPages: 1 });
      } else {
        setError(json.error?.message || 'Failed to retrieve leads');
      }
    } catch (err) {
      setError('Network connection error while fetching leads.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Students Roster
  const fetchStudents = async (page = 1) => {
    if (!token) return;
    setIsStudentsLoading(true);
    setStudentError('');
    try {
      let query = `?page=${page}&limit=${studentsPagination.limit}&isRoster=true`;
      if (studentSearch.trim()) query += `&search=${encodeURIComponent(studentSearch.trim())}`;
      const res = await fetch(getApiUrl(`/api/v1/crm/students${query}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const json = await res.json();
      if (res.ok && json.success) {
        setStudents(json.data.students);
        setStudentsPagination(json.data.pagination);
      } else {
        setStudentError(json.error?.message || 'Failed to fetch student records');
      }
    } catch (e) {
      setStudentError('Network error retrieving student records');
    } finally {
      setIsStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeTab === 'students') {
      fetchStudents(1);
    }
  }, [token, activeTab]);

  // Initial Load & Polling
  useEffect(() => {
    if (token) {
      fetchMetrics();
      fetchLeads(1);
    }
  }, [token, statusFilter, priorityFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const openLeadDrawer = (leadId) => {
    setSelectedLeadId(leadId);
    setIsDrawerOpen(true);
  };

  const handleLeadUpdated = () => {
    fetchMetrics();
    fetchLeads(pagination.page);
  };

  // If not authenticated, show StaffLogin
  if (!token || !currentUser) {
    return (
      <StaffLogin
        currentLanguage={currentLanguage}
        onLoginSuccess={(user, jwtToken) => {
          setCurrentUser(user);
          setToken(jwtToken);
        }}
      />
    );
  }

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

  const canViewAudit = ['COLLEGE_ADMIN', 'PLATFORM_ADMIN'].includes(currentUser?.role);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Staff Identity Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-navy-800 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t.portalTitle}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-electric-blue/20 text-electric-blue border border-electric-blue/40">
              {currentUser.role}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-800 text-slate-300 border border-navy-700">
              {currentUser.collegeId?.name || (currentUser.role === 'PLATFORM_ADMIN' ? 'Global Multi-Tenant Scope' : 'Institution')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchMetrics();
              fetchLeads(pagination.page);
            }}
            className="px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-xs font-semibold text-slate-200 border border-navy-700 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.refresh}</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-navy-800 gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'pipeline'
              ? 'bg-navy-800 text-white border-t-2 border-electric-blue'
              : 'text-slate-400 hover:text-white hover:bg-navy-900/60'
          }`}
        >
          <Layers className="w-4 h-4 text-electric-blue" />
          <span>{t.tabPipeline}</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-navy-950 text-slate-300">
            {metrics?.counts?.total ?? pagination.totalLeads}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-navy-800 text-white border-t-2 border-electric-blue'
              : 'text-slate-400 hover:text-white hover:bg-navy-900/60'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>{t.tabOverview}</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-navy-800 text-white border-t-2 border-electric-blue'
              : 'text-slate-400 hover:text-white hover:bg-navy-900/60'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span>{t.tabAnalytics}</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Phase 5
          </span>
        </button>

        {canViewAudit && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'audit'
                ? 'bg-navy-800 text-white border-t-2 border-electric-blue'
                : 'text-slate-400 hover:text-white hover:bg-navy-900/60'
            }`}
          >
            <Shield className="w-4 h-4 text-purple-400" />
            <span>{t.tabAudit}</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('students')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'students'
              ? 'bg-navy-800 text-white border-t-2 border-electric-blue'
              : 'text-slate-400 hover:text-white hover:bg-navy-900/60'
          }`}
        >
          <Users className="w-4 h-4 text-teal-400" />
          <span>{t.tabStudents}</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-navy-950 text-teal-400 border border-teal-500/30">
            {studentsPagination.totalStudents || 65}
          </span>
        </button>
      </div>

      {/* VIEW 1: LEAD PIPELINE (Default Work Center) */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800 space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-navy-950 border border-navy-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-navy-950 border border-navy-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-electric-blue"
                >
                  <option value="">{t.allStatuses}</option>
                  <option value="NEW">NEW</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="ENROLLED">ENROLLED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-navy-950 border border-navy-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-electric-blue"
                >
                  <option value="">{t.allPriorities}</option>
                  <option value="HOT">HOT 🔥</option>
                  <option value="WARM">WARM ⚡</option>
                  <option value="COLD">COLD ❄️</option>
                </select>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-electric-blue hover:bg-blue-500 text-navy-950 font-bold text-xs shadow-md transition-all"
                >
                  {t.searchBtn || 'Search'}
                </button>

                {(searchQuery || statusFilter || priorityFilter) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    {t.clearFilters}
                  </button>
                )}
              </div>
            </form>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Leads Table & Mobile Card View */}
          <div className="rounded-2xl bg-navy-900 border border-navy-800 overflow-hidden shadow-2xl">
            {/* Desktop / Tablet Table (md and up: >= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-navy-950/80 border-b border-navy-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">{t.trackingId}</th>
                    <th className="py-3.5 px-4">{t.studentName}</th>
                    <th className="py-3.5 px-4">{t.phone}</th>
                    <th className="py-3.5 px-4">{t.course}</th>
                    <th className="py-3.5 px-4">{t.priority}</th>
                    <th className="py-3.5 px-4">{t.status}</th>
                    <th className="py-3.5 px-4">{t.counsellor}</th>
                    <th className="py-3.5 px-4">{t.createdDate}</th>
                    <th className="py-3.5 px-4 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400">
                        <span className="inline-block w-6 h-6 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-xs">Loading leads...</p>
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-500 space-y-2">
                        <Inbox className="w-8 h-8 mx-auto text-slate-600" />
                        <p className="text-xs font-semibold text-slate-400">No leads found matching your criteria</p>
                        <p className="text-[11px] text-slate-500">Try modifying search keywords or clearing active filters.</p>
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr
                        key={lead._id}
                        onClick={() => openLeadDrawer(lead._id)}
                        className="hover:bg-navy-800/40 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-electric-blue whitespace-nowrap">
                          {lead.trackingId}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white group-hover:text-electric-blue transition-colors">
                            {lead.studentId?.fullName || 'Candidate'}
                          </div>
                          <span className="text-[10px] text-slate-400">{lead.studentId?.district || 'Odisha'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                          {lead.studentId?.mobileNumber ? `+91-${lead.studentId.mobileNumber}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div className="font-semibold text-slate-200">
                            {lead.courseId?.title || lead.pathway || 'Diploma'}
                          </div>
                          <span className="text-[10px] text-slate-400">{lead.collegeId?.name || 'Institution'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            lead.priority === 'HOT'
                              ? 'bg-rose-500/20 text-rose-400'
                              : lead.priority === 'WARM'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {lead.priority || 'WARM'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {lead.assignedCounsellorId ? (
                            <span className="font-semibold text-purple-300">{lead.assignedCounsellorId.name}</span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">{t.unassigned}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openLeadDrawer(lead._id);
                            }}
                            className="p-1.5 rounded-lg bg-navy-800 hover:bg-electric-blue hover:text-navy-950 text-slate-300 transition-colors"
                            title="Open Lead Drawer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (< md: < 768px) - Eliminates DEF-UI-08 horizontal clipping */}
            <div className="md:hidden divide-y divide-navy-800/60">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <span className="inline-block w-6 h-6 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs">Loading leads...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2 p-4">
                  <Inbox className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs font-semibold text-slate-400">No leads found matching criteria</p>
                  <p className="text-[11px] text-slate-500">Try modifying search or clearing filters.</p>
                </div>
              ) : (
                leads.map((lead) => (
                  <div
                    key={lead._id}
                    onClick={() => openLeadDrawer(lead._id)}
                    className="p-3.5 hover:bg-navy-800/40 cursor-pointer transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-electric-blue">
                          {lead.trackingId}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          lead.priority === 'HOT'
                            ? 'bg-rose-500/20 text-rose-400'
                            : lead.priority === 'WARM'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {lead.priority || 'WARM'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-sm">
                          {lead.studentId?.fullName || 'Candidate'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {lead.courseId?.title || lead.pathway || 'Diploma'} • {lead.studentId?.district || 'Odisha'}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openLeadDrawer(lead._id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-electric-blue hover:text-navy-950 text-slate-200 text-xs font-semibold flex items-center gap-1 min-h-[36px] shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-navy-800/40">
                      <span>{lead.studentId?.mobileNumber ? `+91-${lead.studentId.mobileNumber}` : '—'}</span>
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-navy-950/80 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                Showing <strong className="text-white">{leads.length}</strong> of{' '}
                <strong className="text-white">{pagination.totalLeads}</strong> enquiries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLeads(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-navy-800 text-slate-300 disabled:opacity-40 hover:bg-navy-700 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="px-2 font-mono text-[11px]">
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchLeads(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg bg-navy-800 text-slate-300 disabled:opacity-40 hover:bg-navy-700 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: OVERVIEW & ANALYTICS DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
              <span className="text-[11px] text-slate-400 block">{t.totalLeads}</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">
                {metrics?.counts?.total ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30">
              <span className="text-[11px] text-blue-300 block">{t.newLeads}</span>
              <span className="text-2xl font-extrabold text-blue-400 mt-1 block">
                {metrics?.counts?.new ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
              <span className="text-[11px] text-purple-300 block">{t.assignedLeads}</span>
              <span className="text-2xl font-extrabold text-purple-400 mt-1 block">
                {metrics?.counts?.assigned ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-[11px] text-amber-300 block">{t.contactedLeads}</span>
              <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
                {metrics?.counts?.contacted ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30">
              <span className="text-[11px] text-teal-300 block">{t.verifiedLeads}</span>
              <span className="text-2xl font-extrabold text-teal-300 mt-1 block">
                {metrics?.counts?.verified ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-300 block">{t.enrolledLeads}</span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                {metrics?.counts?.enrolled ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
              <span className="text-[11px] text-rose-300 block">{t.rejectedLeads}</span>
              <span className="text-2xl font-extrabold text-rose-400 mt-1 block">
                {metrics?.counts?.rejected ?? 0}
              </span>
            </div>
          </div>

          {/* Workload and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Counsellor Workload (Admins) */}
            <div className="p-5 rounded-2xl bg-navy-900 border border-navy-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>{t.workloadTitle}</span>
              </h3>
              {metrics?.workload && metrics.workload.length > 0 ? (
                <div className="space-y-2.5">
                  {metrics.workload.map((w, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-navy-950 border border-navy-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{w.name}</span>
                        <span className="text-[10px] text-slate-400">{w.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[11px]">
                          {w.activeLeads} Active
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">
                          {w.enrolledLeads} Enrolled
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">No counsellor workload metrics recorded yet.</p>
              )}
            </div>

            {/* Recent Admissions Activity Feed */}
            <div className="p-5 rounded-2xl bg-navy-900 border border-navy-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{t.recentActivityTitle}</span>
              </h3>
              {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
                <div className="space-y-2.5">
                  {metrics.recentActivity.map((act, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-navy-950 border border-navy-800 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-200">{act.action}</span>
                        <p className="text-[10px] text-slate-400">By {act.actorName} ({act.actorRole})</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">No recent activity logs.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: IMMUTABLE AUDIT LOG VIEWER */}
      {activeTab === 'audit' && canViewAudit && (
        <AuditLogTable token={token} currentLanguage={currentLanguage} />
      )}

      {/* VIEW 4: DRIEMS OFFICIAL STUDENT ROSTER (Internal CRM Only) */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Header & Search */}
          <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-400" />
                  <span>Institutional Student Roster (Confidential Demo Records)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Showing 65 verified student names imported for DRIEMS Polytechnic (Autonomous). Private internal records.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchStudents(1)}
                    placeholder="Search student by name..."
                    className="bg-navy-950 border border-navy-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-blue w-60"
                  />
                </div>
                <button
                  onClick={() => fetchStudents(1)}
                  className="px-3 py-1.5 rounded-xl bg-electric-blue hover:bg-blue-500 text-navy-950 font-bold text-xs shadow-md transition-all"
                >
                  {t.searchBtn || 'Search'}
                </button>
                {studentSearch && (
                  <button
                    onClick={() => {
                      setStudentSearch('');
                      setTimeout(() => fetchStudents(1), 50);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {studentError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{studentError}</span>
            </div>
          )}

          {/* Roster Table & Mobile Card View */}
          <div className="rounded-2xl bg-navy-900 border border-navy-800 overflow-hidden shadow-2xl">
            {/* Desktop / Tablet Table (md and up: >= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-navy-950/80 border-b border-navy-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 w-12">#</th>
                    <th className="py-3.5 px-4">Student Full Name</th>
                    <th className="py-3.5 px-4">Institution</th>
                    <th className="py-3.5 px-4">Roster Source</th>
                    <th className="py-3.5 px-4">Record Type</th>
                    <th className="py-3.5 px-4">Privacy Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/60 text-slate-300">
                  {isStudentsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 mx-auto animate-spin text-electric-blue mb-2" />
                        <span>Loading official student roster...</span>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No student records match the search filter.
                      </td>
                    </tr>
                  ) : (
                    students.map((st, idx) => (
                      <tr key={st._id} className="hover:bg-navy-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {(studentsPagination.page - 1) * studentsPagination.limit + idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {st.fullName}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {st.collegeId?.name || 'DRIEMS Polytechnic (Autonomous)'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/30 text-[10px] font-mono">
                            {st.importSource || 'DRIEMS_ROSTER'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-semibold">
                            IMPORTED ROSTER
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                            CONFIDENTIAL (CRM ONLY)
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (< md: < 768px) */}
            <div className="md:hidden divide-y divide-navy-800/60">
              {isStudentsLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 mx-auto animate-spin text-electric-blue mb-2" />
                  <p className="text-xs">Loading official student roster...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="py-12 text-center text-slate-500 p-4">
                  <p className="text-xs">No student records match search.</p>
                </div>
              ) : (
                students.map((st, idx) => (
                  <div key={st._id} className="p-3.5 space-y-1.5 hover:bg-navy-800/40">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-500 font-bold">
                        #{(studentsPagination.page - 1) * studentsPagination.limit + idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30 font-mono">
                        {st.importSource || 'DRIEMS_ROSTER'}
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">
                      {st.fullName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {st.collegeId?.name || 'DRIEMS Polytechnic (Autonomous)'}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[9px] font-semibold">
                        IMPORTED ROSTER
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[9px] font-medium border border-slate-700">
                        CONFIDENTIAL
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {studentsPagination.totalPages > 1 && (
              <div className="p-3.5 bg-navy-950/80 border-t border-navy-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing {students.length} of {studentsPagination.totalStudents} student records (Page {studentsPagination.page} of {studentsPagination.totalPages})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!studentsPagination.hasPrevPage || isStudentsLoading}
                    onClick={() => fetchStudents(studentsPagination.page - 1)}
                    className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-white disabled:opacity-40 disabled:hover:bg-navy-800 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-mono text-white text-[11px]">
                    {studentsPagination.page} / {studentsPagination.totalPages}
                  </span>
                  <button
                    disabled={!studentsPagination.hasNextPage || isStudentsLoading}
                    onClick={() => fetchStudents(studentsPagination.page + 1)}
                    className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-white disabled:opacity-40 disabled:hover:bg-navy-800 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 5: EXECUTIVE ANALYTICS DASHBOARD (Phase 5) */}
      {activeTab === 'analytics' && (
        <ExecutiveAnalyticsDashboard
          token={token}
          currentUser={currentUser}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Lead Detail Slide-Over Drawer */}
      <LeadDetailDrawer
        leadId={selectedLeadId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLeadId(null);
        }}
        token={token}
        currentUser={currentUser}
        onLeadUpdated={handleLeadUpdated}
        currentLanguage={currentLanguage}
      />
    </div>
  );
};
