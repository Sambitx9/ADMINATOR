import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Building2,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  MapPin,
  Flame,
  Award
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig.js';

export const ExecutiveAnalyticsDashboard = ({
  token,
  currentUser,
  currentLanguage = 'en'
}) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [collegesList, setCollegesList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [districtViewMode, setDistrictViewMode] = useState('map'); // 'map' | 'list'
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  // Multilingual translations dictionary
  const t = {
    en: {
      badge: 'Executive Admission Intelligence • 100% Offline Engine',
      title: 'Executive Analytics & Admission Demand Dashboard',
      subtitle: 'Real-time cohort conversion analytics, branch-wise student demand, lifecycle funnels, and geographic distribution across Odisha.',
      timeRange: 'Time Window:',
      time7d: 'Last 7 Days',
      time30d: 'Last 30 Days',
      time90d: 'Last 90 Days',
      timeAll: 'All Time Record',
      filterBranch: 'Branch Focus:',
      allBranches: 'All 6 Branches',
      filterCollege: 'Institution Scope:',
      allColleges: 'All Institutions (Platform Admin)',
      refresh: 'Refresh Analytics',
      kpiTotal: 'Total Enquiries',
      kpiContacted: 'Contacted Leads',
      kpiVerified: 'Verified Documents',
      kpiEnrolled: 'Confirmed Enrolled',
      kpiConversion: 'Overall Conversion Rate',
      kpiHotLeads: 'High-Priority Hot Leads',
      branchDemandTitle: '1. Branch-wise Enquiry Demand vs Intake Capacity',
      branchDemandSubtitle: 'Comparing student interest volume against approved seat quota per diploma engineering discipline.',
      statusDistTitle: '2. Lead Lifecycle Status Distribution',
      statusDistSubtitle: 'Current workflow pipeline allocation across active, in-review, and completed leads.',
      funnelTitle: '3. Enquiry Conversion Funnel & Pipeline Drop-off',
      funnelSubtitle: 'Step-by-step conversion progression from initial student contact to confirmed polytechnic enrolment.',
      districtTitle: '4. District-wise Candidate Geographic Distribution',
      districtSubtitle: 'Geographic origin of prospective diploma applicants across Odisha districts.',
      comparisonTitle: '5. Multi-College Benchmark Comparison',
      comparisonSubtitle: 'Comparative enquiry demand and admission conversion rates across polytechnic institutions.',
      enquiries: 'Enquiries',
      intakeSeats: 'Approved Seats',
      enrolled: 'Enrolled',
      demandRatio: 'Demand Ratio',
      dropOff: 'Drop-off',
      conversion: 'Conversion',
      pctOfTotal: '% of Total',
      mapView: 'Map View',
      listView: 'Ranked List',
      demoDisclaimer: '[DEMO DATASET - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]',
      noDataFound: 'No enquiry records match the selected filters.'
    },
    or: {
      badge: 'କାର୍ଯ୍ୟନିର୍ବାହୀ ନାମଲେଖା ବିଶ୍ଳେଷଣ • ଅଫଲାଇନ୍ ₹୦ ଇଞ୍ଜିନ୍',
      title: 'କାର୍ଯ୍ୟନିର୍ବାହୀ ବିଶ୍ଳେଷଣ ଏବଂ ଆଡମିଶନ ଚାହିଦା ଡ୍ୟାସବୋର୍ଡ',
      subtitle: 'ଓଡ଼ିଶାର ଛାତ୍ରଛାତ୍ରୀଙ୍କ ଆବେଦନ ଚାହିଦା, ବ୍ରାଞ୍ଚ ଅନୁଯାୟୀ ଆଗ୍ରହ, ନାମଲେଖା ଫନେଲ୍ ଏବଂ ଜିଲ୍ଲାୱାରୀ ବିତରଣ।',
      timeRange: 'ସମୟସୀମା:',
      time7d: 'ଗତ ୭ ଦିନ',
      time30d: 'ଗତ ୩୦ ଦିନ',
      time90d: 'ଗତ ୯୦ ଦିନ',
      timeAll: 'ସମସ୍ତ ତଥ୍ୟ',
      filterBranch: 'ବ୍ରାଞ୍ଚ ଚୟନ:',
      allBranches: 'ସମସ୍ତ ୬ଟି ବ୍ରାଞ୍ଚ',
      filterCollege: 'ଅନୁଷ୍ଠାନ ପରିସର:',
      allColleges: 'ସମସ୍ତ ଅନୁଷ୍ଠାନ (ପ୍ଲାଟଫର୍ମ ଆଡମିନ୍)',
      refresh: 'ପୁନଃ ଲୋଡ୍ କରନ୍ତୁ',
      kpiTotal: 'ମୋଟ ପଚରାଉଚରା',
      kpiContacted: 'ଯୋଗାଯୋଗ ହୋଇଥିବା ଲିଡ୍',
      kpiVerified: 'କାଗଜପତ୍ର ଯାଞ୍ଚ ହୋଇଥିବା',
      kpiEnrolled: 'ନାମଲେଖା ସୁନିଶ୍ଚିତ',
      kpiConversion: 'ସାମଗ୍ରିକ ନାମଲେଖା ହାର',
      kpiHotLeads: 'ଅଗ୍ରାଧିକାର ପ୍ରାପ୍ତ ହଟ୍ ଲିଡ୍',
      branchDemandTitle: '୧. ବ୍ରାଞ୍ଚ ଅନୁଯାୟୀ ଚାହିଦା ବନାମ ମୋଟ ସିଟ୍',
      branchDemandSubtitle: 'ପ୍ରତ୍ୟେକ ଇଞ୍ଜିନିୟରିଂ ବ୍ରାଞ୍ଚରେ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ଆଗ୍ରହ ଏବଂ ଅନୁମୋଦିତ ସିଟ୍ ସଂଖ୍ୟାର ତୁଳନା।',
      statusDistTitle: '୨. ଲିଡ୍ ସ୍ଥିତି ବିତରଣ ଚାର୍ଟ',
      statusDistSubtitle: 'ଆସିଥିବା ଲିଡ୍ ଗୁଡ଼ିକର ବିଭିନ୍ନ ପର୍ଯ୍ୟାୟରେ ବଣ୍ଟନ।',
      funnelTitle: '୩. ନାମଲେଖା ରୂପାନ୍ତରଣ ଫନେଲ୍ ଏବଂ ଡ୍ରପ୍-ଅଫ୍',
      funnelSubtitle: 'ପ୍ରାରମ୍ଭିକ ପଚରାଉଚରାରୁ ନାମଲେଖା ପର୍ଯ୍ୟନ୍ତ କ୍ରମାନ୍ୱୟ ପ୍ରଗତି।',
      districtTitle: '୪. ଓଡ଼ିଶାର ଜିଲ୍ଲାୱାରୀ ପ୍ରାର୍ଥୀ ବିତରଣ',
      districtSubtitle: 'ଓଡ଼ିଶାର ବିଭିନ୍ନ ଜିଲ୍ଲାରୁ ଆସିଥିବା ଆବେଦନକାରୀଙ୍କ ଭୌଗୋଳିକ ଅବସ୍ଥିତି।',
      comparisonTitle: '୫. ବହୁ-କଲେଜ ତୁଳନାତ୍ମକ ମାନଦଣ୍ଡ',
      comparisonSubtitle: 'ଅନୁଷ୍ଠାନଗୁଡ଼ିକ ମଧ୍ୟରେ ଆବେଦନ ଚାହିଦା ଏବଂ ନାମଲେଖା ହାରର ତୁଳନା।',
      enquiries: 'ପଚରାଉଚରା',
      intakeSeats: 'ଅନୁମୋଦିତ ସିଟ୍',
      enrolled: 'ନାମଲେଖା ହୋଇଛି',
      demandRatio: 'ଚାହିଦା ଅନୁପାତ',
      dropOff: 'ଡ୍ରପ୍-ଅଫ୍',
      conversion: 'ରୂପାନ୍ତରଣ',
      pctOfTotal: 'ମୋଟର %',
      mapView: 'ଭୌଗୋଳିକ ମାନଚିତ୍ର',
      listView: 'କ୍ରମ ତାଲିକା',
      demoDisclaimer: '[ଡେମୋ ତଥ୍ୟସେଟ୍ — କେବଳ ମୂଲ୍ୟାଙ୍କନ ପାଇଁ — ସରକାରୀ ନାମଲେଖା ତଥ୍ୟ ନୁହେଁ]',
      noDataFound: 'ମନୋନୀତ ଫିଲ୍ଟର୍ ସହିତ କୌଣସି ତଥ୍ୟ ମିଳିଲା ନାହିଁ।'
    },
    hi: {
      badge: 'कार्यकारी प्रवेश बुद्धिमत्ता • 100% ऑफलाइन इंजन',
      title: 'कार्यकारी विश्लेषिकी एवं प्रवेश मांग डैशबोर्ड',
      subtitle: 'ओडिशा के छात्रों की वास्तविक मांग, शाखा-वार रुचि, प्रवेश फ़नल और ज़िला-वार भौगोलिक वितरण का विश्लेषण।',
      timeRange: 'समयावधि:',
      time7d: 'पिछले 7 दिन',
      time30d: 'पिछले 30 दिन',
      time90d: 'पिछले 90 दिन',
      timeAll: 'सभी समय का डेटा',
      filterBranch: 'शाखा चयन:',
      allBranches: 'सभी 6 शाखाएँ',
      filterCollege: 'संस्थान दायरा:',
      allColleges: 'सभी संस्थान (प्लेटफ़ॉर्म एडमिन)',
      refresh: 'ताज़ा करें',
      kpiTotal: 'कुल पूछताछ',
      kpiContacted: 'संपर्क की गई लीड',
      kpiVerified: 'सत्यापित दस्तावेज़',
      kpiEnrolled: 'नामांकित छात्र',
      kpiConversion: 'समग्र प्रवेश दर',
      kpiHotLeads: 'उच्च प्राथमिकता हॉट लीड',
      branchDemandTitle: '1. शाखा-वार पूछताछ मांग बनाम सीट क्षमता',
      branchDemandSubtitle: 'प्रत्येक डिप्लोमा इंजीनियरिंग शाखा में छात्रों की रुचि और स्वीकृत सीट क्षमता की तुलना।',
      statusDistTitle: '2. लीड जीवनचक्र स्थिति वितरण',
      statusDistSubtitle: 'सक्रिय, समीक्षाधीन और नामांकित लीड का वितरण।',
      funnelTitle: '3. पूछताछ रूपांतरण फ़नल और ड्रॉप-ऑफ़',
      funnelSubtitle: 'प्रारंभिक पूछताछ से अंतिम नामांकन तक चरण-दर-चरण प्रगति।',
      districtTitle: '4. ओडिशा के ज़िला-वार उम्मीदवार वितरण',
      districtSubtitle: 'ओडिशा के विभिन्न ज़िलों से संभावित आवेदकों का भौगोलिक वितरण।',
      comparisonTitle: '5. बहु-कॉलेज बेंचमार्क तुलना',
      comparisonSubtitle: 'संस्थानों के बीच पूछताछ मांग और प्रवेश रूपांतरण दर की तुलना।',
      enquiries: 'पूछताछ',
      intakeSeats: 'स्वीकृत सीटें',
      enrolled: 'नामांकित',
      demandRatio: 'मांग अनुपात',
      dropOff: 'ड्रॉप-ऑफ़',
      conversion: 'रूपांतरण',
      pctOfTotal: 'कुल का %',
      mapView: 'मानचित्र दृश्य',
      listView: 'रैंकिंग सूची',
      demoDisclaimer: '[डेमो डेटासेट — केवल मूल्यांकन के लिए — आधिकारिक प्रवेश डेटा नहीं]',
      noDataFound: 'चयनित फ़िल्टर के साथ कोई डेटा उपलब्ध नहीं है।'
    }
  }[currentLanguage] || {
    badge: 'Executive Admission Intelligence • 100% Offline Engine',
    title: 'Executive Analytics & Admission Demand Dashboard',
    subtitle: 'Real-time cohort conversion analytics, branch-wise student demand, lifecycle funnels, and geographic distribution across Odisha.',
    timeRange: 'Time Window:',
    time7d: 'Last 7 Days',
    time30d: 'Last 30 Days',
    time90d: 'Last 90 Days',
    timeAll: 'All Time Record',
    filterBranch: 'Branch Focus:',
    allBranches: 'All 6 Branches',
    filterCollege: 'Institution Scope:',
    allColleges: 'All Institutions (Platform Admin)',
    refresh: 'Refresh Analytics',
    kpiTotal: 'Total Enquiries',
    kpiContacted: 'Contacted Leads',
    kpiVerified: 'Verified Documents',
    kpiEnrolled: 'Confirmed Enrolled',
    kpiConversion: 'Overall Conversion Rate',
    kpiHotLeads: 'High-Priority Hot Leads',
    branchDemandTitle: '1. Branch-wise Enquiry Demand vs Intake Capacity',
    branchDemandSubtitle: 'Comparing student interest volume against approved seat quota per diploma engineering discipline.',
    statusDistTitle: '2. Lead Lifecycle Status Distribution',
    statusDistSubtitle: 'Current workflow pipeline allocation across active, in-review, and completed leads.',
    funnelTitle: '3. Enquiry Conversion Funnel & Pipeline Drop-off',
    funnelSubtitle: 'Step-by-step conversion progression from initial student contact to confirmed polytechnic enrolment.',
    districtTitle: '4. District-wise Candidate Geographic Distribution',
    districtSubtitle: 'Geographic origin of prospective diploma applicants across Odisha districts.',
    comparisonTitle: '5. Multi-College Benchmark Comparison',
    comparisonSubtitle: 'Comparative enquiry demand and admission conversion rates across polytechnic institutions.',
    enquiries: 'Enquiries',
    intakeSeats: 'Approved Seats',
    enrolled: 'Enrolled',
    demandRatio: 'Demand Ratio',
    dropOff: 'Drop-off',
    conversion: 'Conversion',
    pctOfTotal: '% of Total',
    demoDisclaimer: '[DEMO DATASET - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]',
    noDataFound: 'No enquiry records match the selected filters.'
  };

  const isPlatformAdmin = currentUser?.role === 'PLATFORM_ADMIN';

  // Fetch colleges list if Platform Admin
  useEffect(() => {
    if (isPlatformAdmin) {
      fetch(getApiUrl('/api/v1/colleges'))
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setCollegesList(json.data);
          }
        })
        .catch((err) => console.error('[ExecutiveAnalytics] Error fetching colleges:', err));
    }
  }, [isPlatformAdmin]);

  // Fetch executive analytics from backend API
  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('timeRange', timeRange);
      if (selectedBranch !== 'ALL') params.set('branchCode', selectedBranch);
      if (isPlatformAdmin && selectedCollegeId) {
        params.set('collegeId', selectedCollegeId);
      }

      const res = await fetch(getApiUrl(`/api/v1/crm/analytics?${params.toString()}`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAnalyticsData(json.data);
      } else {
        setError(json.error?.message || json.message || 'Failed to load executive analytics');
      }
    } catch (err) {
      console.error('[ExecutiveAnalytics] Fetch error:', err);
      setError('Failed to communicate with local analytics engine.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token, timeRange, selectedBranch, selectedCollegeId]);

  const kpis = analyticsData?.kpis || {
    totalEnquiries: 0,
    contactedEnquiries: 0,
    verifiedEnquiries: 0,
    enrolledEnquiries: 0,
    conversionRate: 0,
    hotLeadsCount: 0
  };

  const branchDemand = analyticsData?.branchDemand || [];
  const statusDistribution = analyticsData?.statusDistribution || [];
  const conversionFunnel = analyticsData?.conversionFunnel || [];
  const districtHeatMap = analyticsData?.districtHeatMap || [];
  const collegeComparison = analyticsData?.collegeComparison || [];

  // Helper for branch localized name
  const getBranchName = (b) => {
    if (!b?.name) return b?.branchCode || '';
    if (typeof b.name === 'string') return b.name;
    return b.name[currentLanguage] || b.name.en || b.branchCode;
  };

  // Compute SVG Donut Chart coordinates
  const renderDonutChart = () => {
    const total = statusDistribution.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-52 text-slate-500 text-xs">
          <HelpCircle className="w-8 h-8 mb-2 text-slate-600" />
          <span>{t.noDataFound}</span>
        </div>
      );
    }

    let accumulatedAngle = 0;
    const size = 200;
    const center = size / 2;
    const radius = 70;
    const strokeWidth = 24;

    const segments = statusDistribution.map((item) => {
      const angle = (item.count / total) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;

      // Convert angles to SVG arc path
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = (((startAngle + angle) - 90) * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

      return {
        ...item,
        pathData,
        percentage: Number(((item.count / total) * 100).toFixed(1))
      };
    });

    return (
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-2">
        {/* SVG Donut */}
        <div className="relative shrink-0 w-52 h-52 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {segments.map((seg, idx) => (
              <path
                key={idx}
                d={seg.pathData}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                onMouseEnter={() => setActiveTooltip(`${seg.status}: ${seg.count} (${seg.percentage}%)`)}
                onMouseLeave={() => setActiveTooltip(null)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-extrabold text-white font-mono">{total}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Leads</span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs w-full max-w-xs">
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-navy-950 border border-navy-800"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-slate-300 font-medium truncate">{seg.status}</span>
              </div>
              <span className="font-bold text-white font-mono ml-2">
                {seg.count} <span className="text-[10px] text-slate-400 font-normal">({seg.percentage}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Geographic spatial layout coordinates for Odisha's districts
  const ODISHA_DISTRICTS = [
    // Northern Region
    { name: 'Sundargarh', x: 25, y: 15, w: 75, h: 36, zone: 'North' },
    { name: 'Keonjhar', x: 105, y: 25, w: 68, h: 42, zone: 'North' },
    { name: 'Mayurbhanj', x: 178, y: 15, w: 78, h: 45, zone: 'North' },
    { name: 'Balasore', x: 215, y: 65, w: 65, h: 35, zone: 'Coastal' },
    { name: 'Bhadrak', x: 210, y: 105, w: 60, h: 32, zone: 'Coastal' },
    // Central & Coastal Region
    { name: 'Jajpur', x: 160, y: 105, w: 46, h: 34, zone: 'Coastal' },
    { name: 'Dhenkanal', x: 110, y: 105, w: 46, h: 34, zone: 'Central' },
    { name: 'Cuttack', x: 140, y: 144, w: 62, h: 38, zone: 'Central', isDriems: true },
    { name: 'Kendrapara', x: 206, y: 142, w: 58, h: 34, zone: 'Coastal' },
    { name: 'Jagatsinghpur', x: 190, y: 180, w: 58, h: 32, zone: 'Coastal' },
    { name: 'Khordha', x: 130, y: 186, w: 56, h: 36, zone: 'Central' },
    { name: 'Puri', x: 145, y: 226, w: 52, h: 34, zone: 'Coastal' },
    { name: 'Nayagarh', x: 80, y: 175, w: 46, h: 34, zone: 'Central' },
    // Western & Central Region
    { name: 'Jharsuguda', x: 15, y: 55, w: 52, h: 32, zone: 'West' },
    { name: 'Deogarh', x: 72, y: 68, w: 42, h: 30, zone: 'Central' },
    { name: 'Sambalpur', x: 30, y: 92, w: 58, h: 36, zone: 'West' },
    { name: 'Bargarh', x: 10, y: 132, w: 55, h: 34, zone: 'West' },
    { name: 'Angul', x: 90, y: 140, w: 46, h: 32, zone: 'Central' },
    { name: 'Subarnapur', x: 35, y: 170, w: 42, h: 30, zone: 'West' },
    { name: 'Balangir', x: 10, y: 170, w: 45, h: 34, zone: 'West' },
    { name: 'Boudh', x: 65, y: 206, w: 42, h: 30, zone: 'Central' },
    { name: 'Nuapada', x: 5, y: 210, w: 38, h: 34, zone: 'West' },
    { name: 'Kalahandi', x: 15, y: 248, w: 52, h: 38, zone: 'South' },
    { name: 'Kandhamal', x: 72, y: 240, w: 52, h: 36, zone: 'South' },
    // Southern Region
    { name: 'Ganjam', x: 110, y: 265, w: 62, h: 38, zone: 'South' },
    { name: 'Gajapati', x: 92, y: 307, w: 48, h: 32, zone: 'South' },
    { name: 'Rayagada', x: 45, y: 290, w: 45, h: 36, zone: 'South' },
    { name: 'Nabarangpur', x: 8, y: 290, w: 34, h: 36, zone: 'South' },
    { name: 'Koraput', x: 18, y: 330, w: 52, h: 38, zone: 'South' },
    { name: 'Malkangiri', x: 15, y: 372, w: 48, h: 35, zone: 'South' }
  ];

  const getDistrictHeatColor = (count) => {
    if (count <= 0) return '#1e293b';
    if (count <= 3) return '#0369a1';
    if (count <= 10) return '#0284c7';
    if (count <= 25) return '#0d9488';
    return '#10b981';
  };

  const renderOdishaSvgHeatMap = () => {
    const districtCountMap = Object.fromEntries(
      districtHeatMap.map((d) => [d.district.toLowerCase(), d])
    );

    return (
      <div className="space-y-3">
        {/* Interactive SVG Choropleth Map of Odisha */}
        <div className="relative bg-navy-950 p-2 rounded-xl border border-navy-800 flex flex-col items-center justify-center">
          <svg
            viewBox="0 0 290 420"
            className="w-full max-w-[270px] sm:max-w-[290px] h-auto drop-shadow-md select-none"
          >
            {ODISHA_DISTRICTS.map((dist) => {
              const matched = districtCountMap[dist.name.toLowerCase()];
              const count = matched?.enquiriesCount || 0;
              const pct = matched?.percentage || 0;
              const fill = getDistrictHeatColor(count);
              const isHovered = hoveredDistrict?.name === dist.name;

              return (
                <g
                  key={dist.name}
                  className="cursor-pointer transition-transform duration-150"
                  onMouseEnter={() =>
                    setHoveredDistrict({
                      name: dist.name,
                      count,
                      percentage: pct,
                      zone: dist.zone,
                      isDriems: dist.isDriems
                    })
                  }
                  onMouseLeave={() => setHoveredDistrict(null)}
                >
                  <rect
                    x={dist.x}
                    y={dist.y}
                    width={dist.w}
                    height={dist.h}
                    rx="5"
                    fill={fill}
                    stroke={
                      isHovered
                        ? '#38bdf8'
                        : dist.isDriems
                        ? '#34d399'
                        : '#334155'
                    }
                    strokeWidth={isHovered ? 2.5 : dist.isDriems ? 2 : 1}
                    className="transition-colors duration-200"
                  />
                  <text
                    x={dist.x + dist.w / 2}
                    y={dist.y + dist.h / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[9px] font-bold fill-slate-200 pointer-events-none"
                  >
                    {dist.w < 45 ? dist.name.slice(0, 3) : dist.name.slice(0, 6)}
                  </text>
                  {count > 0 && (
                    <text
                      x={dist.x + dist.w - 3}
                      y={dist.y + 8}
                      textAnchor="end"
                      className="text-[8px] font-mono font-bold fill-amber-300 pointer-events-none"
                    >
                      {count}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* District Details Banner */}
          <div className="w-full mt-2 p-2 rounded-lg bg-navy-900 border border-navy-800 text-center text-xs">
            {hoveredDistrict ? (
              <div className="flex items-center justify-between px-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>{hoveredDistrict.name}</span>
                  {hoveredDistrict.isDriems && (
                    <span className="text-[10px] text-emerald-300 font-semibold px-1 rounded bg-emerald-500/20">
                      DRIEMS Base
                    </span>
                  )}
                </span>
                <span className="font-mono text-teal-300 font-bold">
                  {hoveredDistrict.count} enquiries ({hoveredDistrict.percentage}%)
                </span>
              </div>
            ) : (
              <span className="text-slate-400 text-[11px] italic">
                Hover or tap any district on the Odisha heat map to inspect enquiry demand
              </span>
            )}
          </div>
        </div>

        {/* Heat Intensity Scale Legend */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1">
          <span className="font-semibold uppercase tracking-wider">Demand Heat Scale:</span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1e293b] border border-slate-700" /> 0
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0369a1]" /> 1-3
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7]" /> 4-10
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0d9488]" /> 11-25
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" /> 25+
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Demo watermark disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 text-center text-xs font-semibold text-amber-300 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{t.demoDisclaimer}</span>
      </div>

      {/* Header Banner & Controls */}
      <div className="bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 border border-navy-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{t.badge}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {t.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed mt-1">
              {t.subtitle}
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-xs font-semibold text-slate-200 border border-navy-700 flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.refresh}</span>
          </button>
        </div>

        {/* Global Filter Bar */}
        <div className="pt-3 border-t border-navy-800/80 flex flex-wrap items-center gap-3 text-xs">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-300">{t.timeRange}</span>
            <div className="flex bg-navy-950 p-0.5 rounded-lg border border-navy-800">
              {[
                { id: '7d', label: t.time7d },
                { id: '30d', label: t.time30d },
                { id: '90d', label: t.time90d },
                { id: 'all', label: t.timeAll }
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setTimeRange(r.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    timeRange === r.id
                      ? 'bg-electric-blue text-navy-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r.id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-300">{t.filterBranch}</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-navy-900 border border-navy-700 text-slate-200 rounded-lg px-2.5 py-1 focus:border-electric-blue focus:outline-none"
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

          {/* College Filter (Platform Admin Only) */}
          {isPlatformAdmin && (
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="font-semibold text-slate-300">{t.filterCollege}</span>
              <select
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                className="bg-navy-900 border border-navy-700 text-slate-200 rounded-lg px-2.5 py-1 focus:border-purple-400 focus:outline-none"
              >
                <option value="">{t.allColleges}</option>
                {collegesList.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Enquiries */}
        <div className="bg-navy-900/90 border border-navy-800 p-4 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.kpiTotal}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">{kpis.totalEnquiries}</span>
            <Users className="w-4 h-4 text-electric-blue" />
          </div>
          <span className="text-[10px] text-slate-400">Recorded Leads</span>
        </div>

        {/* Contacted Leads */}
        <div className="bg-navy-900/90 border border-navy-800 p-4 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.kpiContacted}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-purple-300 font-mono">
              {kpis.contactedEnquiries}
            </span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-[10px] text-slate-400">Counsellor Contacted</span>
        </div>

        {/* Verified Documents */}
        <div className="bg-navy-900/90 border border-navy-800 p-4 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.kpiVerified}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-teal-300 font-mono">
              {kpis.verifiedEnquiries}
            </span>
            <FileCheck className="w-4 h-4 text-teal-400" />
          </div>
          <span className="text-[10px] text-slate-400">Marked Verified</span>
        </div>

        {/* Confirmed Enrolled */}
        <div className="bg-navy-900/90 border border-navy-800 p-4 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.kpiEnrolled}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">
              {kpis.enrolledEnquiries}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">Admitted Cohort</span>
        </div>

        {/* Overall Conversion Rate */}
        <div className="bg-navy-900/90 border border-navy-800 p-4 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.kpiConversion}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-300 font-mono">
              {kpis.conversionRate}%
            </span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-400">Lead-to-Admit</span>
        </div>

        {/* Hot Leads */}
        <div className="bg-navy-900/90 border border-navy-800 p-4 rounded-xl space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.kpiHotLeads}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-400 font-mono">
              {kpis.hotLeadsCount}
            </span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-[10px] text-rose-400 font-medium">Immediate Action</span>
        </div>
      </div>

      {/* Grid: Visualisations 1 & 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VISUALISATION 1: BRANCH-WISE DEMAND */}
        <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-start justify-between border-b border-navy-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-electric-blue" />
                <span>{t.branchDemandTitle}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{t.branchDemandSubtitle}</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {branchDemand.map((b) => {
              const maxSeats = Math.max(...branchDemand.map((x) => x.totalSeats), 60);
              const maxEnq = Math.max(...branchDemand.map((x) => x.enquiriesCount), 1);
              const displayMax = Math.max(maxSeats, maxEnq);

              const enqPercent = Math.min(100, Math.round((b.enquiriesCount / displayMax) * 100));
              const capPercent = Math.min(100, Math.round((b.totalSeats / displayMax) * 100));

              return (
                <div key={b.branchCode} className="space-y-1 bg-navy-950 p-3 rounded-xl border border-navy-800">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-electric-blue font-mono">{b.branchCode}</span>
                      <span className="text-slate-200 font-medium">{getBranchName(b)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-300">
                        {b.enquiriesCount} {t.enquiries} / {b.totalSeats} {t.intakeSeats}
                      </span>
                      <span className="font-bold text-xs text-emerald-400 font-mono">
                        {b.demandRatio}%
                      </span>
                    </div>
                  </div>

                  {/* Dual Horizontal Bars */}
                  <div className="space-y-1 pt-1">
                    {/* Enquiry interest bar */}
                    <div className="w-full bg-navy-900 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="bg-electric-blue h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, enqPercent)}%` }}
                        title={`${b.branchCode} Enquiries: ${b.enquiriesCount}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* VISUALISATION 2: STATUS DISTRIBUTION (DONUT CHART) */}
        <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-start justify-between border-b border-navy-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-400" />
                <span>{t.statusDistTitle}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{t.statusDistSubtitle}</p>
            </div>
          </div>

          {/* Interactive Donut Component */}
          {renderDonutChart()}
        </div>
      </div>

      {/* Grid: Visualisations 3 & 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VISUALISATION 3: CONVERSION FUNNEL */}
        <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-start justify-between border-b border-navy-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>{t.funnelTitle}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{t.funnelSubtitle}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {conversionFunnel.map((step, idx) => {
              const stageName =
                typeof step.name === 'string'
                  ? step.name
                  : step.name[currentLanguage] || step.name.en || step.stage;

              const funnelColors = ['#3B82F6', '#8B5CF6', '#10B981', '#059669'];
              const currentColor = funnelColors[idx % funnelColors.length];

              return (
                <div
                  key={step.stage}
                  className="bg-navy-950 p-3.5 rounded-xl border border-navy-800 space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-navy-950"
                        style={{ backgroundColor: currentColor }}
                      >
                        {idx + 1}
                      </span>
                      <span>{stageName}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white font-mono">{step.count}</span>
                      <span className="text-xs font-bold text-amber-300 font-mono">
                        ({step.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Funnel Progress Step */}
                  <div className="w-full bg-navy-900 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(5, step.percentage)}%`,
                        backgroundColor: currentColor
                      }}
                    />
                  </div>

                  {/* Drop-off counter */}
                  {step.dropOffCount > 0 && idx < conversionFunnel.length - 1 && (
                    <div className="flex items-center justify-end text-[10px] text-rose-400 gap-1 font-medium">
                      <ArrowDownRight className="w-3 h-3" />
                      <span>
                        {step.dropOffCount} {t.dropOff} ({((step.dropOffCount / (step.count || 1)) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* VISUALISATION 4: DISTRICT GEOGRAPHIC HEAT MAP */}
        <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-start justify-between border-b border-navy-800 pb-3 gap-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span>{t.districtTitle}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{t.districtSubtitle}</p>
            </div>

            {/* View Mode Toggle: Map vs List */}
            <div className="flex bg-navy-950 p-0.5 rounded-lg border border-navy-800 shrink-0">
              <button
                onClick={() => setDistrictViewMode('map')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  districtViewMode === 'map'
                    ? 'bg-teal-500 text-navy-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.mapView}
              </button>
              <button
                onClick={() => setDistrictViewMode('list')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  districtViewMode === 'list'
                    ? 'bg-teal-500 text-navy-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.listView}
              </button>
            </div>
          </div>

          {/* Interactive Heat Map Render */}
          {districtViewMode === 'map' ? (
            <div className="space-y-4">
              {renderOdishaSvgHeatMap()}

              {/* Top 3 Summary Pills under map */}
              <div className="pt-2 border-t border-navy-800/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Top Admission Demand Hubs:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {districtHeatMap.slice(0, 3).map((d, idx) => (
                    <div
                      key={d.district}
                      className="bg-navy-950 p-2 rounded-lg border border-navy-800 text-center"
                    >
                      <span className="text-[10px] text-slate-400 block truncate">#{idx + 1} {d.district}</span>
                      <span className="text-xs font-bold text-teal-300 font-mono">{d.enquiriesCount} leads</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {districtHeatMap.map((d, dIdx) => {
                const maxDist = Math.max(...districtHeatMap.map((x) => x.enquiriesCount), 1);
                const barPercent = Math.min(100, Math.round((d.enquiriesCount / maxDist) * 100));

                return (
                  <div
                    key={d.district}
                    className="bg-navy-950 p-2.5 rounded-xl border border-navy-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500 w-4">#{dIdx + 1}</span>
                        <span>{d.district}</span>
                      </span>
                      <span className="font-bold text-teal-300 font-mono">
                        {d.enquiriesCount} <span className="text-[10px] text-slate-400 font-normal">({d.percentage}%)</span>
                      </span>
                    </div>

                    {/* Heat bar */}
                    <div className="w-full bg-navy-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-electric-blue h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, barPercent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* VISUALISATION 5: MULTI-COLLEGE BENCHMARK COMPARISON */}
      <div className="bg-navy-900/90 border border-navy-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-start justify-between border-b border-navy-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-electric-blue" />
              <span>{t.comparisonTitle}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.comparisonSubtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {collegeComparison.map((c) => {
            const isDriems = c.code === 'DRIEMS';

            return (
              <div
                key={c.code}
                className={`p-4 rounded-xl border space-y-3 ${
                  isDriems
                    ? 'bg-electric-blue/[0.04] border-electric-blue/40 shadow-sm'
                    : 'bg-navy-950 border-navy-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{c.code}</span>
                  {isDriems && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-electric-blue/20 text-electric-blue border border-electric-blue/30">
                      Primary
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 font-medium line-clamp-1">{c.name}</p>

                <div className="space-y-1.5 text-xs pt-1 border-t border-navy-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t.enquiries}:</span>
                    <span className="font-bold text-white font-mono">{c.totalEnquiries}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t.enrolled}:</span>
                    <span className="font-bold text-emerald-400 font-mono">{c.enrolledCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t.kpiConversion}:</span>
                    <span className="font-bold text-amber-300 font-mono">{c.conversionRate}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};